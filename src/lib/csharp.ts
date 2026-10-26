/** Token classes for the small C# snippets on the site. */
export type TokenKind = "plain" | "keyword" | "type" | "method" | "string" | "number" | "comment";

export type Token = { kind: TokenKind; text: string };

const KEYWORDS = new Set([
	"namespace",
	"public",
	"private",
	"protected",
	"internal",
	"sealed",
	"partial",
	"static",
	"readonly",
	"override",
	"virtual",
	"abstract",
	"class",
	"struct",
	"in",
	"ref",
	"var",
	"get",
	"set",
	"return",
	"new",
	"using",
	"if",
	"else",
	"float",
	"bool",
	"int",
	"void",
	"true",
	"false",
]);

const TOKEN = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?f?\b)|([A-Za-z_]\w*)|(\s+|.)/gy;

function classify([, comment, str, num, ident]: RegExpExecArray, rest: string): TokenKind {
	if (comment) return "comment";
	if (str) return "string";
	if (num) return "number";
	if (!ident) return "plain";
	if (KEYWORDS.has(ident)) return "keyword";
	if (/^\s*[(<]/.test(rest)) return "method";
	return /^[A-Z]/.test(ident) ? "type" : "plain";
}

/**
 * Splits one line of C# into tokens. Not a parser: enough for short, well-formed
 * snippets (keywords, PascalCase types, calls, literals, comments).
 */
export function tokenizeCSharp(line: string): Token[] {
	const tokens: Token[] = [];
	TOKEN.lastIndex = 0;
	for (let m = TOKEN.exec(line); m; m = TOKEN.exec(line)) {
		tokens.push({ kind: classify(m, line.slice(TOKEN.lastIndex)), text: m[0] });
	}
	return tokens;
}
