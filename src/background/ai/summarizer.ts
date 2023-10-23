import { ConversationSummaryBufferMemory } from "langchain/memory";
import { LLMChain } from "langchain/chains";
import { SUMMARY_PROMPT } from "./prompts";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { BaseLanguageModel } from "langchain/dist/base_language";

const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
  chunkSize: 4000,
  chunkOverlap: 200,
});

export async function executeSummarizer(
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
      prompt: SUMMARY_PROMPT,
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
