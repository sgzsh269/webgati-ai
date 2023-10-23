import { Document } from "langchain/document";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { VectorStore } from "langchain/vectorstores/base";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import {
  MSG_TYPE_BOT_CLEAR_MEMORY,
  MSG_TYPE_BOT_DONE,
  MSG_TYPE_BOT_EXECUTE,
  MSG_TYPE_BOT_PROCESSING,
  MSG_TYPE_BOT_STOP,
  MSG_TYPE_BOT_TOKEN_RESPONSE,
  MSG_TYPE_GET_TAB_ID,
  MSG_TYPE_INDEX_WEBPAGE,
  MSG_TYPE_TOGGLE_SIDE_PANEL,
  MSG_TYPE_URL_CHANGE,
  STORAGE_FIELD_MODEL_PROVIDER,
  STORAGE_FIELD_OPENAI,
} from "./constants";

export type InstallType = "development" | "normal";

export type AppContextType = {
  swPort: chrome.runtime.Port | null;
  webpageMarkdown: string;
  analyzeWebpage: () => Promise<void>;
  clearChatContext: () => Promise<void>;
  modelProvider: ModelProvider | null;
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

export type SWMessagePayloadToken = {
  token: string;
  isEnd?: boolean;
  error?: string;
};

export type SWMessage = {
  type:
    | typeof MSG_TYPE_TOGGLE_SIDE_PANEL
    | typeof MSG_TYPE_URL_CHANGE
    | typeof MSG_TYPE_GET_TAB_ID
    | typeof MSG_TYPE_INDEX_WEBPAGE
    | typeof MSG_TYPE_BOT_EXECUTE
    | typeof MSG_TYPE_BOT_PROCESSING
    | typeof MSG_TYPE_BOT_TOKEN_RESPONSE
    | typeof MSG_TYPE_BOT_DONE
    | typeof MSG_TYPE_BOT_STOP
    | typeof MSG_TYPE_BOT_CLEAR_MEMORY;
  payload: SWMessagePayloadToken | any;
};

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
