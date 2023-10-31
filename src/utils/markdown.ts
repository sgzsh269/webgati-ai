import TurndownService, { Node } from "turndown";
import jquery from "jquery";
import { loadPdf } from "./pdf";

function generateTurndownFilter() {
  return {
    filter: function (node: Node) {
      return (
        node.nodeName === "SCRIPT" ||
        node.nodeName === "STYLE" ||
        node.nodeName === "AUDIO" ||
        node.nodeName === "VIDEO" ||
        node.nodeName === "IMG" ||
        node.nodeName === "IFRAME" ||
        node.nodeName === "CANVAS" ||
        node.nodeName === "NOSCRIPT"
      );
    },
    replacement: function () {
      return "";
    },
  };
}

export function convertPageToMarkdown(
  type: "general" | "summary",
  html: string
): string {
  const turndownService = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    codeBlockStyle: "fenced",
    fence: "```",
  });

  const turndownFilter = generateTurndownFilter();

  if (type === "summary") {
    // Choose elements relevant for summary
    jquery("div#onetrust-consent-sdk").remove();
    const elements = jquery("h1, h2, p, li:not(:has(a)), table, div");
    let filteredHtml = "";
    elements.each(function (this: HTMLElement) {
      if (
        this.nodeName === "DIV" &&
        jquery(this).find("*").not("span").length !== 0
      ) {
        return;
      }
      filteredHtml += this.outerHTML;
    });

    turndownService.addRule("", turndownFilter);
    return turndownService.turndown(filteredHtml);
  } else {
    turndownService.addRule("", turndownFilter);
    return turndownService.turndown(html);
  }
}

export async function generatePageMarkdown(
  type: "general" | "summary"
): Promise<string> {
  let markdownContent = "";
  if (window.location.href.endsWith(".pdf")) {
    markdownContent = await loadPdf(window.location.href);
  } else {
    markdownContent = await convertPageToMarkdown(
      type,
      document.body.innerHTML
    );
  }
  return markdownContent;
}
