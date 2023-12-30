import { BaseLanguageModel } from "langchain/base_language";
import { BaseMessage, HumanMessage } from "langchain/schema";
import { ModelProvider } from "../../../utils/types";

export async function executeWebpageVisionChat(
  modelProvider: ModelProvider,
  prompt: string,
  imageData: string,
  chatHistory: BaseMessage[],
  model: BaseLanguageModel,
  abortController: AbortController,

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

  await model.invoke([...chatHistory, message], {
    callbacks: [
      {
        handleLLMNewToken(token: string) {
          handleNewTokenCallback(token);
        },
      },
    ],
    signal: abortController.signal,
  });
}
