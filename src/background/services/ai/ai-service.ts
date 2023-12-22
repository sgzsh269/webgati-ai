import { ConversationSummaryBufferMemory } from "langchain/memory";
import { VectorStore } from "langchain/vectorstores/base";
import {
  AIModelConfig,
  QueryMode,
  SWMessageBotExecute,
  TabState,
} from "../../../utils/types";
import { executeWebpageSummary } from "./webpage-summary";
import { executeWebpageRAG } from "./webpage-rag";
import { executeGeneralChat } from "./general-chat";
import { executeWebpageVisionChat } from "./webpage-vision";
import { SWService } from "../sw-service";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Embeddings } from "langchain/embeddings/base";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatAnthropic } from "langchain/chat_models/anthropic";
import { BaseChatModel } from "langchain/chat_models/base";
// import { HuggingFaceTransformersEmbeddings } from "langchain/embeddings/hf_transformers";
// import { env } from "@xenova/transformers";

// TODO
// env.allowLocalModels = false;
// env.backends.onnx.wasm.numThreads = 1;

const MAX_RETRIES = 3;
const DEFAULT_MAX_TOKENS = 4000;

export class AIService {
  private swService: SWService;
  private aiModelConfig: AIModelConfig | null;
  // private hfEmbeddings: HuggingFaceTransformersEmbeddings;
  // private hfTransformersPipeline: any;

  constructor(swService: SWService) {
    this.swService = swService;
    this.aiModelConfig = null;
    // this.hfEmbeddings = new HuggingFaceTransformersEmbeddings({
    //   modelName: "Xenova/all-MiniLM-L6-v2",
    // });
  }

  async initialize(): Promise<void> {
    // Running this initially to trigger downloading and caching of the model
    // await this.hfEmbeddings.embedQuery("initialize");
  }

  updateAIModelConfig(aiModelConfig: AIModelConfig): void {
    this.aiModelConfig = aiModelConfig;
  }

  getModel(tabId: number): NonNullable<TabState["model"]> {
    const tabState = this.swService.swState.tabIdStateMap[tabId];

    if (!tabState) {
      throw new Error("No tab state found for tab id: " + tabId);
    }

    if (!tabState.model) {
      throw new Error("No model found for tab id: " + tabId);
    }

    return tabState.model;
  }

  getModelProviderConfig(tabId: number): Record<string, any> {
    const modelProvider = this.getModel(tabId).provider;

    if (!this.aiModelConfig) {
      throw new Error("No AI model config found");
    }

    return this.aiModelConfig[modelProvider];
  }

  getModelProviderAPIKey(tabId: number): string | null {
    const modelProviderConfig = this.getModelProviderConfig(tabId);
    return modelProviderConfig.apiKey || null;
  }

  getEmbeddingModel(tabId: number): Embeddings | undefined {
    const modelProvider = this.getModel(tabId).provider;

    if (modelProvider === "openai") {
      return new OpenAIEmbeddings({
        openAIApiKey: this.getModelProviderAPIKey(tabId) as string,
        maxRetries: MAX_RETRIES,
      });
    }
  }

  getCurrentLLM(
    tabId: number,
    queryMode: QueryMode,
    useEfficient = false
  ): BaseChatModel {
    const modelProvider = this.getModel(tabId).provider;
    const modelProviderConfig = this.getModelProviderConfig(tabId);
    const modelName = this.getModel(tabId).modelName;

    if (modelProvider === "openai") {
      console.log("modelName", modelName);
      console.log("efficient", useEfficient);

      return new ChatOpenAI({
        modelName: useEfficient ? "gpt-3.5-turbo" : modelName,
        openAIApiKey: modelProviderConfig.apiKey,
        temperature: 0,
        streaming: useEfficient ? false : true,
        maxRetries: MAX_RETRIES,
      });
    }
    if (modelProvider === "anthropic") {
      return new ChatAnthropic({
        modelName: useEfficient ? "claude-instant-1.2" : modelName,
        anthropicApiKey: modelProviderConfig.apiKey,
        temperature: 0,
        maxRetries: MAX_RETRIES,
        streaming: useEfficient ? false : true,
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
    const fasterModel = this.getCurrentLLM(tabId, "general", true);

    console.log("currentModel", currentModel);

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
