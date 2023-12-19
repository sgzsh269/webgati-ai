import { Document } from "langchain/document";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { VectorStore } from "langchain/vectorstores/base";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import {
  STORAGE_FIELD_MODEL_PROVIDER,
  STORAGE_FIELD_OPENAI,
} from "./constants";

export type InstallType = "development" | "normal";
export type QueryMode =
  | SWMessagePayloadGeneral["queryMode"]
  | SWMessagePayloadWebpageTextQA["queryMode"]
  | SWMessagePayloadWebpageVQA["queryMode"]
  | SWMessagePayloadSummary["queryMode"];

export type BotMessageType =
  | "agent"
  | "docs-summarizer"
  | "webpage-vqa"
  | "summary";

export type AppContextType = {
  swPort: chrome.runtime.Port | null;
  webpageMarkdown: string;
  modelProvider: ModelProvider | null;
  analyzeWebpage: () => Promise<void>;
  clearChatContext: () => Promise<void>;
};

export type IndexedData = {
  vectorStore: VectorStore;
  docs: Document[];
};

export type OpenAIConfig = {
  apiKey: string;
  modelName: string;
};

export type ChatMessage = {
  role: "user" | "ai";
  content: string;
  isComplete?: boolean;
};

export type SWMessageToggleSidePanel = {
  type: "toggle-side-panel";
};

export type SWMessageUrlChange = {
  type: "url-change";
  payload: {
    url: string;
  };
};

export type SWMessageGetTabId = {
  type: "get-tab-id";
};

export type SWMessageIndexWebpage = {
  type: "index-webpage";
  payload: {
    pageMarkdown: string;
  };
};

export type SWMessageBotExecute = {
  type: "bot-execute";
  payload:
    | SWMessagePayloadGeneral
    | SWMessagePayloadWebpageTextQA
    | SWMessagePayloadWebpageVQA
    | SWMessagePayloadSummary;
};

export type SWMessageBotProcessing = {
  type: "bot-processing";
};

export type SWMessageBotTokenResponse = {
  type: "bot-token-response";
  payload: {
    token: string;
    error?: string;
  };
};

export type SWMessageBotDone = {
  type: "bot-done";
};

export type SWMessageBotStop = {
  type: "bot-stop";
};

export type SWMessageBotClearMemory = {
  type: "bot-clear-memory";
};

export type SWMessageKeepAlive = {
  type: "keep-alive";
};

export type SWMessagePayloadGeneral = {
  queryMode: "general";
  prompt: string;
};

export type SWMessagePayloadWebpageTextQA = {
  queryMode: "webpage-text-qa";
  prompt: string;
};

export type SWMessagePayloadWebpageVQA = {
  queryMode: "webpage-vqa";
  prompt: string;
  imageData: string;
};

export type SWMessagePayloadSummary = {
  queryMode: "summary";
  markdownContent: string;
};

export type SWMessage =
  | SWMessageToggleSidePanel
  | SWMessageUrlChange
  | SWMessageGetTabId
  | SWMessageIndexWebpage
  | SWMessageBotExecute
  | SWMessageBotProcessing
  | SWMessageBotTokenResponse
  | SWMessageBotDone
  | SWMessageBotStop
  | SWMessageBotClearMemory
  | SWMessageKeepAlive;

export type TabState = {
  tabId: number;
  url: string | null | undefined;
  botAbortController: AbortController | null;
  botMemory: ConversationSummaryBufferMemory | null;
  webpageDocs: Document[] | null;
  vectorStore: MemoryVectorStore | null;
  port: chrome.runtime.Port | null;
};

export type SWState = {
  installType: InstallType | null;
  tabIdStateMap: {
    [tabId: number]: TabState | undefined;
  };
};

export type ModelProvider = typeof STORAGE_FIELD_OPENAI;

export type AIModelConfig = {
  [STORAGE_FIELD_MODEL_PROVIDER]: ModelProvider;
  [STORAGE_FIELD_OPENAI]: OpenAIConfig;
};

export type ModelFormSubFormRef = {
  save: () => Promise<void>;
};
