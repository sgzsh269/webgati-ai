import { ConversationSummaryBufferMemory } from "langchain/memory";
import { VectorStore } from "langchain/vectorstores/base";
import {
  AIModelConfig,
  ModelProvider,
  QueryMode,
  SWMessageBotExecute,
  SupportedModel,
} from "../../../utils/types";
import { executeWebpageSummary } from "./webpage-summary";
import { executeWebpageRAG } from "./webpage-rag";
import { executeGeneralChat } from "./general-chat";
import { executeWebpageVisionChat } from "./webpage-vision";
import { SWService } from "../sw-service";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatAnthropic } from "langchain/chat_models/anthropic";
import { ChatOllama } from "langchain/chat_models/ollama";
import { BaseChatModel } from "langchain/chat_models/base";
import { OLLAMA_DEFAULT_BASE_URL } from "../../../utils/constants";

const MAX_RETRIES = 3;
const DEFAULT_MAX_TOKENS = 4000;

export class AIService {
  private swService: SWService;
  private aiModelConfig: AIModelConfig | null;

  constructor(swService: SWService) {
    this.swService = swService;
    this.aiModelConfig = null;
  }

  updateAIModelConfig(aiModelConfig: AIModelConfig): void {
    this.aiModelConfig = aiModelConfig;
  }

  getModelId(tabId: number): SupportedModel {
    const tabState = this.swService.swState.tabIdStateMap[tabId];
    if (!tabState) {
      throw new Error("No tabIdStateMap found for tabId: " + tabId);
    }

    if (!tabState.modelId) {
      throw new Error("No modelId found for tabId: " + tabId);
    }

    return tabState.modelId;
  }

  getModelName(modelId: SupportedModel): string {
    return modelId.split("_")[1];
  }

  getModelProvider(tabId: number): ModelProvider {
    const tabModelId = this.getModelId(tabId);

    return tabModelId.split("_")[0] as ModelProvider;
  }

  getModelProviderConfig(tabId: number): Record<string, any> {
    const modelProvider = this.getModelProvider(tabId);

    if (!this.aiModelConfig) {
      throw new Error("No AI model config found");
    }

    return this.aiModelConfig[modelProvider];
  }

  getModelProviderAPIKey(tabId: number): string | null {
    const modelProviderConfig = this.getModelProviderConfig(tabId);
    return modelProviderConfig.apiKey || null;
  }

  getEmbeddingModel(tabId: number): OpenAIEmbeddings | undefined {
    const modelProvider = this.getModelProvider(tabId);

    if (modelProvider !== "openai") {
      return undefined;
    }
    return new OpenAIEmbeddings({
      openAIApiKey: this.getModelProviderAPIKey(tabId) as string,
      maxRetries: MAX_RETRIES,
    });
  }

  getCurrentLLMFastVariant(tabId: number): BaseChatModel {
    const modelProvider = this.getModelProvider(tabId);
    const tabModelId = this.getModelId(tabId);
    const modelProviderConfig = this.getModelProviderConfig(tabId);
    const modelName = this.getModelName(tabModelId);

    if (modelProvider === "openai") {
      return new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        openAIApiKey: modelProviderConfig.apiKey,
        temperature: 0,
        maxRetries: MAX_RETRIES,
      });
    }
    if (modelProvider === "anthropic") {
      return new ChatAnthropic({
        modelName: "claude-instant-1.2",
        anthropicApiKey: modelProviderConfig.apiKey,
        temperature: 0,
        maxTokensToSample: DEFAULT_MAX_TOKENS,
        maxRetries: MAX_RETRIES,
      });
    } else if (modelProvider === "ollama") {
      return new ChatOllama({
        baseUrl: modelProviderConfig.baseUrl,
        model: modelName,
      });
    }

    throw new Error("Unsupported model provider: " + modelProvider);
  }

  getCurrentLLM(tabId: number, queryMode: QueryMode): BaseChatModel {
    const tabModelId = this.getModelId(tabId);
    const modelProviderConfig = this.getModelProviderConfig(tabId);
    const modelProvider = this.getModelProvider(tabId);
    const modelName = this.getModelName(tabModelId);

    if (modelProvider !== "ollama") {
      if (!modelProviderConfig.apiKey) {
        throw new Error("No API key found for model in settings");
      }
    }

    if (modelProvider === "openai") {
      let modelName;
      let maxTokens;
      if (tabModelId === "openai_gpt-4") {
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
        openAIApiKey: modelProviderConfig.apiKey,
        temperature: 0,
        streaming: true,
        maxRetries: MAX_RETRIES,
      });
    }
    if (modelProvider === "anthropic") {
      let modelName;
      if (tabModelId === "anthropic_claude-2") {
        modelName = "claude-2.1";
      } else {
        modelName = "claude-instant-1.2";
      }

      return new ChatAnthropic({
        modelName,
        anthropicApiKey: modelProviderConfig.apiKey,
        temperature: 0,
        maxTokensToSample: DEFAULT_MAX_TOKENS,
        maxRetries: MAX_RETRIES,
        streaming: true,
      });
    }
    if (modelProvider === "ollama") {
      return new ChatOllama({
        baseUrl: modelProviderConfig.baseUrl,
        model: modelName,
      });
    }

    throw new Error("Unsupported model provider: " + modelProvider);
  }

  async execute(
    installType: "development" | "normal",
    tabId: number,
    msg: SWMessageBotExecute,
    vectorStore: VectorStore | null,
    memory: ConversationSummaryBufferMemory,
    abortController: AbortController,
    handleNewTokenCallback: (token: string) => void
  ): Promise<void> {
    const queryMode = msg.payload.queryMode;

    const currentModel = this.getCurrentLLM(tabId, queryMode);
    const fasterModel = this.getCurrentLLMFastVariant(tabId);

    if (queryMode === "general") {
      await executeGeneralChat(
        currentModel,
        memory,
        msg.payload.prompt,
        abortController,
        handleNewTokenCallback
      );
    } else if (queryMode === "webpage-text-qa") {
      await executeWebpageRAG(
        fasterModel,
        currentModel,
        memory,
        vectorStore,
        msg.payload.prompt,
        abortController,
        handleNewTokenCallback
      );
    } else if (queryMode === "webpage-vqa") {
      await executeWebpageVisionChat(
        msg.payload.prompt,
        msg.payload.imageData,
        currentModel,
        abortController,
        memory,
        handleNewTokenCallback
      );
    } else if (queryMode === "summary") {
      await executeWebpageSummary(
        msg.payload.markdownContent,
        memory,
        currentModel,
        abortController,
        handleNewTokenCallback
      );
    }
  }
}
