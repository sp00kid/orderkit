import { codeToHtml } from "shiki";

interface CodeBlockProps {
  code: string;
  language: string;
}

// Server component — shiki runs at build time, output is trusted static HTML.
// The code strings are hardcoded in our own source files, not user input.
export default async function CodeBlock({ code, language }: CodeBlockProps) {
  const html = await codeToHtml(code.trim(), {
    lang: language,
    theme: "github-light",
  });

  return (
    <div className="code-block">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
