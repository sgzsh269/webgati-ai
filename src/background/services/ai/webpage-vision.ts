import { BaseLanguageModel } from "langchain/base_language";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { HumanMessage } from "langchain/schema";

export async function executeWebpageVisionChat(
  prompt: string,
  imageData: string,
  model: BaseLanguageModel,
  abortController: AbortController,
  memory: ConversationSummaryBufferMemory,
  handleNewTokenCallback: (token: string) => void
): Promise<void> {
  const message = new HumanMessage({
    content: [
      {
        type: "text",
        text: prompt,
      },
      {
        type: "image_url",
        image_url: {
          url: imageData,
          detail: "auto",
        },
      },
    ],
  });

  const result = await model.invoke([message], {
    callbacks: [
      {
        handleLLMNewToken(token: string) {
          handleNewTokenCallback(token);
        },
      },
    ],
    signal: abortController.signal,
  });

  memory.chatHistory.addAIChatMessage(result.text);
}
