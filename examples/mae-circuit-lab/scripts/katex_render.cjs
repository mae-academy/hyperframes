// Batch-renders TeX with the vendored KaTeX (scripts/vendor/katex.min.cjs).
// stdin: JSON array of TeX strings   stdout: JSON array of HTML strings (HTML output only, no MathML duplicate text)
const katex = require("./vendor/katex.min.cjs");
let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  const out = JSON.parse(raw).map((tex) =>
    katex.renderToString(tex, {
      output: "html",
      throwOnError: true,
      displayMode: false,
      strict: "error",
    }),
  );
  process.stdout.write(JSON.stringify(out));
});
