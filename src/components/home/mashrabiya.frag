// Light through a mashrabiya: the room's whole right wall is a lattice screen whose
// openings each hold a nuqta. One analytic ray per pixel against the floor, back
// wall, screen and ceiling, plus a short volumetric march for the light shafts and
// screen-space dust glinting in them. Sun, clouds and camera all drift slowly.
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
// 0 → 1: the openings light up one by one, from the back of the room forwards.
uniform float uReveal;
// 0 → 1: the room's exposure comes up and the camera settles in.
uniform float uIntro;

const float SCREEN_X = 3.2;
const float BACK_Z = 10.0;
// (z, y) of the screen's near, bottom corner and far, top corner. It starts just out
// of frame: far enough forward that the camera stands in shade, since a lattice bar's
// shadow passing through the eye would slice the frame edge-on.
const vec2 WIN_LO = vec2(-0.5, 0.3);
const vec2 WIN_HI = vec2(9.6, 3.6);
const vec3 LIGHT_COL = vec3(0.96, 0.96, 0.95);
// The page background (#0a0a0a): the darkest the scene ever gets, so it melts into the page.
const vec3 PAGE_BG = vec3(10.0 / 255.0);

float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

// 1 where light passes the lattice at (z, y) on the screen plane, 0 on the wood:
// rhombus cells, each with a small solid nuqta in its centre. Each cell switches on
// at its own moment during the reveal.
float lattice(vec2 p, float blur) {
  vec2 q = vec2(p.x / 0.36 + p.y / 0.62, p.x / 0.36 - p.y / 0.62);
  vec2 f = abs(fract(q) - 0.5);
  float m = max(f.x, f.y);
  float open = smoothstep(0.405 + blur, 0.405 - blur, m);
  float nuqta = smoothstep(0.13 - blur, 0.13 + blur, m);
  float delay = 0.05 + (WIN_HI.x - p.x) / (WIN_HI.x - WIN_LO.x) * 0.62 + hash(floor(q)) * 0.22;
  float on = smoothstep(delay, delay + 0.1, uReveal);
  return open * nuqta * on;
}

float window(vec2 p, float blur) {
  vec2 lo = smoothstep(WIN_LO - blur, WIN_LO + blur, p);
  vec2 hi = smoothstep(WIN_HI + blur, WIN_HI - blur, p);
  return lo.x * lo.y * hi.x * hi.y;
}

// A low sun that drifts, so the pattern crawls across the floor.
vec3 lightDir() {
  float t = uTime * 0.07;
  return normalize(vec3(1.0, 0.95 + 0.12 * sin(t), 0.3 + 0.25 * sin(t * 0.7)));
}

// Clouds passing: the sunlight swells and dims over tens of seconds.
float sunlight() {
  return 0.72 + 0.28 * smoothstep(-0.7, 0.7, sin(uTime * 0.31) * sin(uTime * 0.19 + 1.3) + 0.35);
}

// Dust motes: a sparse jittered grid of points drifting up through the frame.
float motes(vec2 uv) {
  vec2 g = uv * 26.0 + vec2(uTime * 0.07, -uTime * 0.16);
  vec2 id = floor(g);
  float h = hash(id);
  vec2 o = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
  o += 0.2 * vec2(sin(uTime * 0.4 + h * 6.28), cos(uTime * 0.3 + h * 6.28));
  float d = length(fract(g) - 0.5 - o * 0.6);
  float twinkle = 0.55 + 0.45 * sin(uTime * (0.7 + h) + h * 20.0);
  return step(0.8, h) * smoothstep(0.07, 0.0, d) * twinkle;
}

// How much sunlight reaches p through the screen; the penumbra widens with distance,
// from at least `soft`.
float visibility(vec3 p, vec3 L, float soft) {
  if (p.x >= SCREEN_X) return 0.0;
  float t = (SCREEN_X - p.x) / L.x;
  vec2 s = (p + L * t).zy;
  float blur = soft + t * 0.012;
  return lattice(s, blur) * window(s, blur * 2.0);
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  // Cover the frame at any aspect: wide screens crop the 16:9 composition top and
  // bottom; narrow ones keep its right side, where the screen is.
  float aspect = uRes.x / uRes.y;
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / max(uRes.y, uRes.x / 1.78);
  uv.x += max(0.0, 0.89 - 0.5 * aspect) * 0.75;
  uv.y -= 0.2; // the room sits high in the frame
  float settle = 1.0 - uIntro;
  vec3 drift = vec3(0.14 * sin(uTime * 0.09), 0.06 * sin(uTime * 0.13), 0.2 * sin(uTime * 0.07));
  vec3 ro = vec3(-1.6 + uMouse.x * 0.25, 1.4 - uMouse.y * 0.12 + settle * 0.3, -3.6 - settle * 1.2) + drift;
  vec3 target = vec3(1.1, 1.7, 6.0);
  vec3 fw = normalize(target - ro);
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw));
  vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.3 + uv.x * rt + uv.y * up);
  vec3 L = lightDir();
  float sun = sunlight();

  // Scene: floor y=0 (1), back wall (2), the screen x=SCREEN_X (3), ceiling y=4.2 (4).
  float tHit = 1e5;
  vec3 n = vec3(0.0);
  int id = 0;
  if (rd.y < 0.0) { float t = -ro.y / rd.y; if (t < tHit) { tHit = t; n = vec3(0, 1, 0); id = 1; } }
  if (rd.z > 0.0) { float t = (BACK_Z - ro.z) / rd.z; if (t < tHit) { tHit = t; n = vec3(0, 0, -1); id = 2; } }
  if (rd.x > 0.0) { float t = (SCREEN_X - ro.x) / rd.x; if (t < tHit) { tHit = t; n = vec3(-1, 0, 0); id = 3; } }
  if (rd.y > 0.0) { float t = (4.2 - ro.y) / rd.y; if (t < tHit) { tHit = t; n = vec3(0, -1, 0); id = 4; } }
  vec3 p = ro + rd * tHit;

  vec3 col = vec3(0.0);
  if (id == 3) {
    // The screen seen from inside: its openings glow with the sky behind them.
    vec2 s = p.zy;
    float glow = lattice(s, 0.006) * window(s, 0.006);
    float halo = lattice(s, 0.22) * window(s, 0.12);
    col = LIGHT_COL * (glow * 0.8 + halo * 0.12);
  } else {
    float v = visibility(p + n * 0.001, L, 0.004);
    float ndl = max(dot(n, L), 0.0);
    // Dark plaster walls and a slightly lighter stone floor: only the light pattern should read.
    vec3 albedo = id == 1 ? vec3(0.15, 0.15, 0.165) : vec3(0.05, 0.05, 0.056);
    // Cheap bounce: the lit pool, heavily blurred, fills the room a little.
    float pool = window((p + L * ((SCREEN_X - p.x) / L.x)).zy, 1.2) * step(p.x, SCREEN_X) * uReveal;
    col = albedo * (LIGHT_COL * (v * ndl * 1.55 * sun) + LIGHT_COL * pool * 0.025);
  }

  // Volumetric shafts: gather the light that got through the screen along the view ray.
  // Each step samples a slightly different point on the sun's disk: with one exact
  // direction, a ray lying in a bar's shadow plane stays dark its whole length and
  // draws a seam across the frame.
  const int STEPS = 40;
  float maxT = min(tHit, 18.0);
  float dt = maxT / float(STEPS);
  float jitter = hash(gl_FragCoord.xy + fract(uTime) * 61.0);
  float g = 0.55;
  float phase = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * dot(rd, L), 1.5) * 0.08;
  float scatter = 0.0;
  for (int i = 0; i < STEPS; i++) {
    vec3 s = ro + rd * (float(i) + jitter) * dt;
    float dust = 0.75 + 0.25 * sin(s.x * 3.1 + uTime * 0.21) * sin(s.z * 2.3 - uTime * 0.17);
    float k = float(i) * 2.399 + jitter * 6.283;
    vec3 disk = normalize(L + vec3(0.0, sin(k), cos(k)) * 0.06 * sqrt(fract(float(i) * 0.618 + jitter)));
    scatter += visibility(s, disk, 0.03) * dust;
  }
  float shafts = scatter * dt * phase * sun;
  col += LIGHT_COL * shafts * (0.65 + 2.5 * motes(uv));

  col *= mix(0.35, 1.0, uIntro);
  col = aces(col * 0.95);
  col = pow(col, vec3(1.0 / 2.2));
  float vig = smoothstep(1.25, 0.35, length(uv * vec2(0.9, 1.1)));
  col *= mix(0.55, 1.0, vig);
  col = max(col, PAGE_BG);
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}
