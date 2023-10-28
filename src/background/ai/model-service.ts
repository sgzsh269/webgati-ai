import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { getModelProvider, getModelProviderConfig } from "../../utils/storage";
import { ModelProvider, OpenAIConfig } from "../../utils/types";
import { ChatOpenAI } from "langchain/chat_models/openai";

const MAX_RETRIES = 3;
class ModelService {
  private currentModelProvider: ModelProvider | null = null;
  private currentModelProviderConfig: OpenAIConfig | null = null;

  getEmbeddingModel() {
    if (this.currentModelProvider !== "openai") {
      console.log("Only OpenAI is supported for now");
      return;
    }
    return new OpenAIEmbeddings({
      openAIApiKey: this.currentModelProviderConfig?.apiKey,
      maxRetries: MAX_RETRIES,
    });
  }

  async updateCurrentModelProvider() {
    this.currentModelProvider = await getModelProvider();
    if (!this.currentModelProvider) {
      console.log("Unexpected error: Model provider not set");
      return;
    }
    this.currentModelProviderConfig = await getModelProviderConfig(
      this.currentModelProvider
    );
  }

  getOpenAI3Turbo() {
    return new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0,
      openAIApiKey: this.currentModelProviderConfig?.apiKey,
      maxRetries: MAX_RETRIES,
    });
  }

  getCurrentLLM() {
    if (this.currentModelProvider !== "openai") {
      throw new Error("Only OpenAI is supported");
    }
    return new ChatOpenAI({
      modelName: this.currentModelProviderConfig?.modelName,
      openAIApiKey: this.currentModelProviderConfig?.apiKey,
      temperature: 0,
      streaming: true,
      maxRetries: MAX_RETRIES,
    });
  }
}

export const modelService = new ModelService();
