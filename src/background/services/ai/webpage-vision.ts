import { BaseLanguageModel } from "langchain/base_language";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { HumanMessage } from "langchain/schema";
import { ModelProvider } from "../../../utils/types";

export async function executeWebpageVisionChat(
  modelProvider: ModelProvider,
  prompt: string,
  imageData: string,
  model: BaseLanguageModel,
  abortController: AbortController,
  memory: ConversationSummaryBufferMemory,
  handleNewTokenCallback: (token: string) => void
): Promise<void> {
  let imageUrl: any;
  if (modelProvider === "openai") {
    imageUrl = {
      url: imageData,
      detail: "auto",
    };
  } else {
    imageUrl = imageData;
  }

  const message = new HumanMessage({
    content: [
      {
        type: "text",
        text: prompt,
      },
      {
        type: "image_url",
        image_url: imageUrl,
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
