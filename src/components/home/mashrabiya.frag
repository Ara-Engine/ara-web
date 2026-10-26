// Light through a mashrabiya: a lattice screen on the room's right wall whose
// openings each hold a nuqta. One analytic ray per pixel against the floor, back
// wall, screen and ceiling, plus a short volumetric march for the light shafts.
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;

const float SCREEN_X = 3.2;
const vec3 LIGHT_COL = vec3(0.62, 0.75, 1.0);

float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

// 1 where light passes the lattice at (z, y) on the screen plane, 0 on the wood:
// rhombus cells, each with a small solid nuqta in its centre.
float lattice(vec2 p, float blur) {
  vec2 q = vec2(p.x / 0.36 + p.y / 0.62, p.x / 0.36 - p.y / 0.62);
  vec2 f = abs(fract(q) - 0.5);
  float m = max(f.x, f.y);
  float open = smoothstep(0.405 + blur, 0.405 - blur, m);
  float nuqta = smoothstep(0.13 - blur, 0.13 + blur, m);
  return open * nuqta;
}

// The window the screen sits in: z in [0.6, 7], y in [0.3, 3.6].
float window(vec2 p, float blur) {
  vec2 lo = smoothstep(vec2(0.6, 0.3) - blur, vec2(0.6, 0.3) + blur, p);
  vec2 hi = smoothstep(vec2(7.0, 3.6) + blur, vec2(7.0, 3.6) - blur, p);
  return lo.x * lo.y * hi.x * hi.y;
}

// The sun drifts slowly, so the pattern crawls across the room.
vec3 lightDir() {
  float t = uTime * 0.035;
  return normalize(vec3(1.0, 1.4 + 0.1 * sin(t), 0.30 + 0.25 * sin(t * 0.7)));
}

// How much sunlight reaches p through the screen; the penumbra widens with distance.
float visibility(vec3 p, vec3 L) {
  if (p.x >= SCREEN_X) return 0.0;
  float t = (SCREEN_X - p.x) / L.x;
  vec2 s = (p + L * t).zy;
  float blur = 0.004 + t * 0.012;
  return lattice(s, blur) * window(s, blur * 2.0);
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ro = vec3(-1.45 + uMouse.x * 0.25, 1.5 - uMouse.y * 0.12, -3.8);
  vec3 target = vec3(1.8, 0.85, 4.0);
  vec3 fw = normalize(target - ro);
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw));
  vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * 1.35 + uv.x * rt + uv.y * up);
  vec3 L = lightDir();

  // Scene: floor y=0 (1), back wall z=7 (2), the screen x=SCREEN_X (3), ceiling y=4 (4).
  float tHit = 1e5;
  vec3 n = vec3(0.0);
  int id = 0;
  if (rd.y < 0.0) { float t = -ro.y / rd.y; if (t < tHit) { tHit = t; n = vec3(0, 1, 0); id = 1; } }
  if (rd.z > 0.0) { float t = (7.0 - ro.z) / rd.z; if (t < tHit) { tHit = t; n = vec3(0, 0, -1); id = 2; } }
  if (rd.x > 0.0) { float t = (SCREEN_X - ro.x) / rd.x; if (t < tHit) { tHit = t; n = vec3(-1, 0, 0); id = 3; } }
  if (rd.y > 0.0) { float t = (4.0 - ro.y) / rd.y; if (t < tHit) { tHit = t; n = vec3(0, -1, 0); id = 4; } }
  vec3 p = ro + rd * tHit;

  vec3 col = vec3(0.0);
  if (id == 3) {
    // The screen seen from inside: its openings glow with the sky behind them.
    vec2 s = p.zy;
    float glow = lattice(s, 0.006) * window(s, 0.006);
    float halo = lattice(s, 0.22) * window(s, 0.4);
    col = LIGHT_COL * (glow * 1.05 + halo * 0.22) + vec3(0.006, 0.006, 0.008);
  } else {
    float v = visibility(p + n * 0.001, L);
    float ndl = max(dot(n, L), 0.0);
    vec3 albedo = id == 1 ? vec3(0.20, 0.20, 0.22) : vec3(0.13, 0.13, 0.145);
    // Cheap bounce: the lit pool, heavily blurred, fills the room a little.
    float pool = window((p + L * ((SCREEN_X - p.x) / L.x)).zy, 1.2) * step(p.x, SCREEN_X);
    col = albedo * (LIGHT_COL * (v * ndl * 1.55) + LIGHT_COL * pool * 0.06 + vec3(0.004, 0.005, 0.009));
  }

  // Volumetric shafts: gather the light that got through the screen along the view ray.
  const int STEPS = 40;
  float maxT = min(tHit, 16.0);
  float dt = maxT / float(STEPS);
  float jitter = hash(gl_FragCoord.xy + fract(uTime) * 61.0);
  float g = 0.55;
  float phase = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * dot(rd, L), 1.5) * 0.08;
  float scatter = 0.0;
  for (int i = 0; i < STEPS; i++) {
    vec3 s = ro + rd * (float(i) + jitter) * dt;
    float dust = 0.75 + 0.25 * sin(s.x * 3.1 + uTime * 0.21) * sin(s.z * 2.3 - uTime * 0.17);
    scatter += visibility(s, L) * dust;
  }
  col += LIGHT_COL * scatter * dt * phase * 0.44 + vec3(0.10, 0.22, 0.75) * scatter * dt * 0.0022;

  col = aces(col * 0.95);
  col = pow(col, vec3(1.0 / 2.2));
  float vig = smoothstep(1.25, 0.35, length(uv * vec2(0.9, 1.1)));
  col *= mix(0.55, 1.0, vig);
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.018;
  gl_FragColor = vec4(col, 1.0);
}
