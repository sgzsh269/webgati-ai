import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { getModelProvider, getModelProviderConfig } from "../../utils/storage";
import {
  BotMessageType,
  ModelProvider,
  OpenAIConfig,
  QueryMode,
} from "../../utils/types";
import { ChatOpenAI } from "langchain/chat_models/openai";

const MAX_RETRIES = 3;
export class ModelService {
  private currentModelProvider: ModelProvider | null = null;
  private currentModelProviderConfig: OpenAIConfig | null = null;

  getEmbeddingModel(): OpenAIEmbeddings | undefined {
    if (this.currentModelProvider !== "openai") {
      console.log("Only OpenAI is supported for now");
      return;
    }
    return new OpenAIEmbeddings({
      openAIApiKey: this.currentModelProviderConfig?.apiKey,
      maxRetries: MAX_RETRIES,
    });
  }

  async updateCurrentModelProvider(): Promise<void> {
    this.currentModelProvider = await getModelProvider();
    if (!this.currentModelProvider) {
      console.log("Unexpected error: Model provider not set");
      return;
    }
    this.currentModelProviderConfig = await getModelProviderConfig(
      this.currentModelProvider
    );
  }

  getOpenAI3Turbo(): ChatOpenAI {
    return new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0,
      openAIApiKey: this.currentModelProviderConfig?.apiKey,
      maxRetries: MAX_RETRIES,
    });
  }

  getCurrentLLM(queryMode: QueryMode): ChatOpenAI {
    if (this.currentModelProvider !== "openai") {
      throw new Error("Only OpenAI is supported");
    }

    let modelName;
    let maxTokens;
    if (this.currentModelProviderConfig?.modelName === "gpt-4") {
      if (queryMode === "webpage-vqa") {
        modelName = "gpt-4-vision-preview";
        maxTokens = 3000;
      } else {
        modelName = "gpt-4-1106-preview";
        maxTokens = undefined;
      }
    } else {
      modelName = "gpt-3.5-turbo";
      maxTokens = undefined;
    }

    return new ChatOpenAI({
      modelName,
      maxTokens,
      openAIApiKey: this.currentModelProviderConfig?.apiKey,
      temperature: 0,
      streaming: true,
      maxRetries: MAX_RETRIES,
    });
  }
}

export const modelService = new ModelService();
