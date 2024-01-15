import { Document } from "langchain/document";
import { VectorStore } from "langchain/vectorstores/base";
import {
  MODEL_PROVIDER_OPENAI,
  MODEL_PROVIDER_ANTHROPIC,
  MODEL_PROVIDER_OLLAMA,
} from "./constants";

export type InstallType = "development" | "normal";
export type QueryMode =
  | AppMessagePayloadGeneral["queryMode"]
  | AppMessagePayloadWebpageTextQA["queryMode"]
  | AppMessagePayloadWebpageVQA["queryMode"]
  | AppMessagePayloadSummary["queryMode"];

export type BotMessageType =
  | "agent"
  | "docs-summarizer"
  | "webpage-vqa"
  | "summary";

export type AppContextType = {
  tabId: number | null;
  swPort: chrome.runtime.Port | null;
  webpageMarkdown: string;
  analyzeWebpage: () => Promise<void>;
  clearChatContext: () => Promise<void>;
  handleImageCapture: (imageData: string) => void;
};

export type IndexedData = {
  vectorStore: VectorStore;
  docs: Document[];
};

export type ChatMessage = {
  role: "human" | "ai";
  queryMode: QueryMode;
  content: string;
  isComplete?: boolean;
};

export type AppMessageUrlChange = {
  type: "sw_url-change";
  payload: {
    tabId: number;
    url: string;
  };
};

export type AppMessageIndexWebpage = {
  type: "sp_index-webpage";
  payload: {
    tabId: number;
    pageMarkdown: string;
  };
};

export type AppMessageGetWebpage = {
  type: "sp_get-webpage";
  payload: {
    usageType: "general" | "summary";
  };
};

export type AppMessageUpdateModelId = {
  type: "sp_update-model";
  payload: {
    tabId: number;
    modelProvider: ModelProvider;
    modelName: string;
  };
};

export type AppMessageCaptureVisibleScreen = {
  type: "any_capture-visible-screen";
};

export type AppMessageSelectionPrompt = {
  type: "cs_selection-prompt";
  payload: {
    prompt: string;
  };
};

export type AppMessageImageCapture = {
  type: "cs_image-capture";
  payload: {
    imageData: string;
  };
};

export type AppMessageTabStateInit = {
  type: "sw_tab-state-init";
};

export type AppMessageBotExecute = {
  type: "sp_bot-execute";
  payload:
    | AppMessagePayloadGeneral
    | AppMessagePayloadWebpageTextQA
    | AppMessagePayloadWebpageVQA
    | AppMessagePayloadSummary;
};

export type AppMessageBotProcessing = {
  type: "sw_bot-processing";
};

export type AppMessageBotTokenResponse = {
  type: "sw_bot-token-response";
  payload: {
    queryMode: QueryMode;
    token: string;
    error?: string;
  };
};

export type AppMessageBotDone = {
  type: "sw_bot-done";
};

export type AppMessageBotStop = {
  type: "sp_bot-stop";
};

export type AppMessageBotClearMemory = {
  type: "sp_bot-clear-memory";
};

export type AppMessageKeepAlive = {
  type: "sp_keep-alive";
};

export type AppMessageSidePanelInit = {
  type: "sp_side-panel-init";
  payload: {
    tabId: number;
    url: string;
  };
};

export type AppMessageStartPageSnipTool = {
  type: "sp_start-page-snip-tool";
};

export type AppMessagePayloadGeneral = {
  queryMode: "general";
  prompt: string;
  prevMessages: ChatMessage[];
};

export type AppMessagePayloadWebpageTextQA = {
  queryMode: "webpage-text-qa";
  prompt: string;
  prevMessages: ChatMessage[];
};

export type AppMessagePayloadWebpageVQA = {
  queryMode: "webpage-vqa";
  prompt: string;
  imageData: string;
  prevMessages: ChatMessage[];
};

export type AppMessagePayloadSummary = {
  queryMode: "summary";
  markdownContent: string;
};

export type AppMessage =
  | AppMessageUrlChange
  | AppMessageGetWebpage
  | AppMessageIndexWebpage
  | AppMessageTabStateInit
  | AppMessageBotExecute
  | AppMessageBotProcessing
  | AppMessageBotTokenResponse
  | AppMessageBotDone
  | AppMessageBotStop
  | AppMessageBotClearMemory
  | AppMessageKeepAlive
  | AppMessageUpdateModelId
  | AppMessageCaptureVisibleScreen
  | AppMessageSidePanelInit
  | AppMessageStartPageSnipTool
  | AppMessageSelectionPrompt
  | AppMessageImageCapture;

export type TabState = {
  tabId: number;
  url: string | null | undefined;
  botAbortController: AbortController | null;
  vectorStore: VectorStore | null;
  port: chrome.runtime.Port | null;
  model: {
    provider: ModelProvider;
    modelName: string;
  } | null;
};

export type SWState = {
  installType: InstallType | null;
  tabIdStateMap: {
    [tabId: number]: TabState | undefined;
  };
};

export type ModelProvider =
  | typeof MODEL_PROVIDER_OPENAI
  | typeof MODEL_PROVIDER_ANTHROPIC
  | typeof MODEL_PROVIDER_OLLAMA;

export type ModelConfig = {
  label: string;
  modelName: string;
  maxOutputTokens: number | undefined;
  temperature: number;
  hasVision: boolean;
} & Record<string, any>;

export type AIModelConfig = {
  [K in ModelProvider]: {
    chatModels: Array<ModelConfig>;
  } & Record<string, any>;
};
