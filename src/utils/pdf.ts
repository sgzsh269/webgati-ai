// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import * as pdfjsLib from "pdfjs-dist";

import pdfjsWorker from "pdfjs-dist/build/pdf.worker.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function loadPdf(url: string): Promise<string> {
  const pdf = await pdfjsLib.getDocument(url).promise;
  let markdown = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    content.items.forEach((item) => {
      const text = item.str;
      const height = item.height;

      if (height > 13) {
        markdown += `## ${text}\n`;
      } else {
        markdown += `${text} `;
      }
    });

    markdown += "\n---\n";
  }

  return markdown;
}
