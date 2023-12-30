import { ConversationSummaryBufferMemory } from "langchain/memory";
import { VectorStore } from "langchain/vectorstores/base";
import {
  AIModelConfig,
  ModelConfig,
  AppMessageBotExecute,
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
import { HuggingFaceTransformersEmbeddings } from "langchain/embeddings/hf_transformers";
import { ChatOllama } from "langchain/chat_models/ollama";
import { env } from "@xenova/transformers";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { AIMessage, BaseMessage, HumanMessage } from "langchain/schema";

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
  chunkSize: 2000,
  chunkOverlap: 200,
});

const MAX_RETRIES = 3;

export class AIService {
  private swService: SWService;
  private aiModelConfig: AIModelConfig | null;
  private hfEmbeddings: HuggingFaceTransformersEmbeddings;

  constructor(swService: SWService) {
    this.swService = swService;
    this.aiModelConfig = null;
    this.hfEmbeddings = new HuggingFaceTransformersEmbeddings({
      modelName: "Xenova/all-MiniLM-L6-v2",
    });
  }

  async initialize(): Promise<void> {
    // Running this initially to trigger downloading and caching of the model
    await this.hfEmbeddings.embedQuery("initialize");
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

  getModelProviderConfig(tabId: number): {
    chatModels: Array<ModelConfig>;
  } & Record<string, any> {
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

  getEmbeddingModel(tabId: number): Embeddings {
    const modelProvider = this.getModel(tabId).provider;

    if (modelProvider === "openai") {
      return new OpenAIEmbeddings({
        openAIApiKey: this.getModelProviderAPIKey(tabId) as string,
        maxRetries: MAX_RETRIES,
      });
    }

    return this.hfEmbeddings;
  }

  getCurrentLLM(tabId: number, streaming: boolean): BaseChatModel {
    const modelProvider = this.getModel(tabId).provider;
    const modelProviderConfig = this.getModelProviderConfig(tabId);
    const modelName = this.getModel(tabId).modelName;
    const modelConfig = modelProviderConfig.chatModels.find(
      (m) => m.modelName === modelName
    );
    const temperature = modelConfig?.temperature;
    const maxOutputTokens = modelConfig?.maxOutputTokens;

    if (modelProvider === "openai") {
      return new ChatOpenAI({
        modelName,
        streaming,
        temperature,
        openAIApiKey: modelProviderConfig.apiKey,
        maxTokens: maxOutputTokens,
        maxRetries: MAX_RETRIES,
      });
    }
    if (modelProvider === "anthropic") {
      return new ChatAnthropic({
        modelName,
        streaming,
        temperature,
        anthropicApiKey: modelProviderConfig.apiKey,
        maxTokensToSample: maxOutputTokens,
        maxRetries: MAX_RETRIES,
      });
    }

    if (modelProvider === "ollama") {
      return new ChatOllama({
        baseUrl: modelProviderConfig.baseUrl,
        model: modelName,
        temperature,
        maxRetries: MAX_RETRIES,
      });
    }

    throw new Error("Unsupported model provider: " + modelProvider);
  }

  async splitText(text: string): Promise<Document[]> {
    return splitter.createDocuments([text]);
  }

  async createAndPopulateVectorStore(
    tabId: number,
    text: string
  ): Promise<VectorStore> {
    const docs = await this.splitText(text);
    return MemoryVectorStore.fromDocuments(
      docs,
      this.getEmbeddingModel(tabId)!
    );
  }

  createMemory(tabId: number): ConversationSummaryBufferMemory {
    return new ConversationSummaryBufferMemory({
      llm: this.getCurrentLLM(tabId, false),
      maxTokenLimit: 1000,
      returnMessages: true,
    });
  }

  async execute(
    installType: "development" | "normal",
    tabId: number,
    msg: AppMessageBotExecute,
    vectorStore: VectorStore | null,
    abortController: AbortController,
    handleNewTokenCallback: (token: string) => void
  ): Promise<void> {
    const queryMode = msg.payload.queryMode;

    const streamingModel = this.getCurrentLLM(tabId, true);
    const modelProvider = this.getModel(tabId).provider;

    const chatHistory: BaseMessage[] = [];
    if (queryMode !== "summary") {
      const messages = msg.payload.prevMessages.map((m) => {
        if (m.role === "human") {
          return new HumanMessage(m.content);
        } else {
          return new AIMessage(m.content);
        }
      });
      chatHistory.push(...messages);
    }

    if (queryMode === "general") {
      await executeGeneralChat(
        streamingModel,
        msg.payload.prompt,
        chatHistory,
        abortController,
        handleNewTokenCallback
      );
    } else if (queryMode === "webpage-text-qa") {
      if (!vectorStore) {
        throw new Error("Vector store not found");
      }

      const nonStreamingModel = this.getCurrentLLM(tabId, false);

      await executeWebpageRAG(
        streamingModel,
        nonStreamingModel,
        vectorStore,
        msg.payload.prompt,
        chatHistory,
        abortController,
        handleNewTokenCallback
      );
    } else if (queryMode === "webpage-vqa") {
      await executeWebpageVisionChat(
        modelProvider,
        msg.payload.prompt,
        msg.payload.imageData,
        chatHistory,
        streamingModel,
        abortController,
        handleNewTokenCallback
      );
    } else if (queryMode === "summary") {
      await executeWebpageSummary(
        msg.payload.markdownContent,
        streamingModel,
        abortController,
        handleNewTokenCallback
      );
    }
  }
}
