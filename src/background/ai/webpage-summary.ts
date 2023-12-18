import { ConversationSummaryBufferMemory } from "langchain/memory";
import { LLMChain } from "langchain/chains";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { BaseLanguageModel } from "langchain/dist/base_language";
import { PromptTemplate } from "langchain/prompts";

const CHUNK_SIZE_CHARS = 4000;
const CHUNK_OVERLAP_CHARS = 200;

const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
  chunkSize: CHUNK_SIZE_CHARS,
  chunkOverlap: CHUNK_OVERLAP_CHARS,
});

const SUMMARY_PROMPT = `Your are an assistant tasked to generate dense and concise summaries from various types of content. You have been provided with content that needs to be summarized below.

To generate dense and concise summaries, use the following guidelines
- Understand the important entities and their context in the content.
- To make it dense, do not include unnecessary verbose phrases such as "The content mentions", "The speaker discusses", etc.
- Summary should always be in markdown-style bullet points, each bullet point should be less than 25 words, ensure each bullet point captures a unique insight.

## Content
{content}

## SUMMARY`;

const summaryPromptTemplate = new PromptTemplate({
  template: SUMMARY_PROMPT,
  inputVariables: ["content"],
});

export async function executeWebpageSummary(
  markdownContent: string,
  memory: ConversationSummaryBufferMemory,
  model: BaseLanguageModel,
  abortController: AbortController,
  onNewToken: (token: string) => void
): Promise<void> {
  const mdDocs = await splitter.createDocuments([markdownContent]);

  for await (const doc of mdDocs) {
    const chain = new LLMChain({
      llm: model,
      prompt: summaryPromptTemplate,
    });

    const result = await chain.call(
      {
        content: doc.pageContent,
        signal: abortController.signal,
      },
      {
        callbacks: [
          {
            handleLLMNewToken(token: string) {
              onNewToken(token);
            },
          },
        ],
      }
    );
    memory.chatHistory.addAIChatMessage(result.text);
  }
}
