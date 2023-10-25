import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import {
  MSG_TYPE_BOT_DONE,
  MSG_TYPE_BOT_PROCESSING,
  MSG_TYPE_BOT_TOKEN_RESPONSE,
  MSG_TYPE_BOT_EXECUTE,
  MSG_TYPE_GET_TAB_ID,
  MSG_TYPE_INDEX_WEBPAGE,
  MSG_TYPE_BOT_STOP,
  MSG_TYPE_BOT_CLEAR_MEMORY,
  MSG_TYPE_TOGGLE_SIDE_PANEL,
  MSG_TYPE_SUMMARIZE_WEBPAGE,
  MSG_TYPE_URL_CHANGE,
  STORAGE_FIELD_AI_MODEL_CONFIG,
} from "../utils/constants";
import { InstallType, SWState, TabState } from "../utils/types";
import { executeSummarizer } from "./ai/summarizer";
import { modelService } from "./ai/model-service";
import { agentService } from "./ai/agent-service";
import { getModelProvider } from "../utils/storage";

const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
  chunkSize: 2000,
  chunkOverlap: 200,
});

const swState: SWState = {
  installType: null,
  tabIdStateMap: {},
};

/// INITIALIZATION

chrome.runtime.onInstalled.addListener(async function () {
  const management = await chrome.management.getSelf();
  swState.installType = management.installType as InstallType;
});

/// STORAGE EVENTS

chrome.storage.local.onChanged.addListener(function (changes) {
  if (changes) {
    const aiModelConfigChange = changes[STORAGE_FIELD_AI_MODEL_CONFIG];

    if (aiModelConfigChange) {
      modelService.updateCurrentModelProvider();
    }
  }
});

/// BROWSER ACTION EVENTS (EXTENSION ICON CLICK)

chrome.action.onClicked.addListener(async function (tab) {
  try {
    if (tab.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: MSG_TYPE_TOGGLE_SIDE_PANEL,
      });
    }
  } catch (error: any) {
    console.log(`Error: No webpage loaded in tab - ${error.message}`);
  }
});

/// TAB EVENTS
chrome.tabs.onCreated.addListener(function (tab) {
  initTabState(tab.id as number);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  // "loading" can be triggered by page refresh or navigation
  if (changeInfo.status === "loading") {
    const tabState = swState.tabIdStateMap[tabId];
    tabState?.port?.disconnect();
    delete swState.tabIdStateMap[tabId];
    initTabState(tabId as number);
  }
  if (changeInfo.url) {
    if (
      changeInfo.url.includes("chrome-extension://") ||
      changeInfo.url.includes("chrome://")
    ) {
      return;
    }
    const tabState = swState.tabIdStateMap[tabId];

    if (!tabState) {
      console.log("Unexpected Error: Tab state not found");
      return;
    }

    tabState.url = changeInfo.url;

    sendUrlChangeMessage(changeInfo.url);
  }
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  stopBot(tabId);
  delete swState.tabIdStateMap[tabId];
});

/// MESSAGE EVENTS

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  const tabId = sender.tab?.id as number;
  const url = sender.tab?.url as string;
  const messageType = message.type;

  switch (message.type) {
    case MSG_TYPE_INDEX_WEBPAGE:
      indexWebpage(tabId, url, message)
        .then(() =>
          sendResponse({
            status: "success",
          })
        )
        .catch(() =>
          sendResponse({
            status: "error",
          })
        );
      break;
    case MSG_TYPE_GET_TAB_ID:
      sendResponse(tabId);
      break;
    default:
      console.log(
        `Message type not implemented for message listnener: ${messageType}`
      );
  }
  return true;
});

chrome.runtime.onConnect.addListener(function (port) {
  if (!port.name.includes("tab")) {
    return;
  }
  const tabId = parseInt(port.name.split("-")[1]);

  let tabState = swState.tabIdStateMap[tabId] as TabState;
  if (!tabState) {
    initTabState(tabId);
    tabState = swState.tabIdStateMap[tabId] as TabState;
  }

  tabState.port = port;

  port.onMessage.addListener(async function (msg) {
    switch (msg.type) {
      case MSG_TYPE_BOT_EXECUTE:
        invokeBot("agent", msg, tabState);
        break;
      case MSG_TYPE_SUMMARIZE_WEBPAGE:
        invokeBot("docs-summarizer", msg, tabState);
        break;
      case MSG_TYPE_BOT_STOP:
        stopBot(tabId);
        break;
      case MSG_TYPE_BOT_CLEAR_MEMORY:
        clearBotMemory(tabState);
        break;
      default:
        console.log(
          `Message type not implemented for port listener: ${msg.type}`
        );
    }
  });

  port.onDisconnect.addListener(() => {
    tabState.port = null;
  });
});

async function indexWebpage(tabId: number, url: string, message: any) {
  const pageMarkdown = message.payload.pageMarkdown;

  const webpageDocs = await splitter.createDocuments([pageMarkdown]);

  const tabState = swState.tabIdStateMap[tabId] as TabState;

  tabState.webpageDocs = webpageDocs;
  tabState.vectorStore = await MemoryVectorStore.fromDocuments(
    webpageDocs,
    modelService.getEmbeddingModel()!
  );
}

async function initTabState(tabId: number) {
  swState.tabIdStateMap[tabId] = {
    tabId,
    url: null,
    botAbortController: null,
    botMemory: null,
    vectorStore: null,
    webpageDocs: [],
    port: null,
  };
}

async function invokeBot(
  type: "agent" | "docs-summarizer",
  msg: any,
  tabState: TabState
) {
  try {
    postBotProcessing(tabState);

    const model = modelService.getCurrentLLM();

    if (!tabState.vectorStore) {
      tabState.vectorStore = await MemoryVectorStore.fromDocuments(
        [],
        modelService.getEmbeddingModel()!
      );
    }

    if (!tabState.botMemory) {
      tabState.botMemory = new ConversationSummaryBufferMemory({
        llm: modelService.getOpenAI3Turbo(),
        maxTokenLimit: 500,
        memoryKey: "chat_history",
        outputKey: "output",
        returnMessages: true,
      });
    }

    if (!tabState.botAbortController) {
      tabState.botAbortController = new AbortController();
    }

    if (type === "docs-summarizer") {
      const markdownContent = msg.payload.markdownContent;
      if (!markdownContent) {
        postBotTokenResponse(tabState, "No valid content to summarize");
        return;
      }

      await executeSummarizer(
        markdownContent,
        tabState.botMemory,
        model,
        tabState.botAbortController,
        (token) => postBotTokenResponse(tabState, token)
      );
    } else {
      const prompt = msg.payload.prompt;

      await agentService.executeAgent(
        swState.installType as "development" | "normal",
        prompt,
        tabState.vectorStore,
        tabState.botMemory,
        model,
        tabState.botAbortController,
        (token) => postBotTokenResponse(tabState, token)
      );
    }
  } catch (error: any) {
    if (error.message !== "AbortError") {
      console.log(error);
      postBotError(tabState, error.message);
    }
  } finally {
    postBotDone(tabState);
  }
}

function stopBot(tabId: number) {
  const tabState = swState.tabIdStateMap[tabId];

  if (tabState) {
    const abortController = tabState.botAbortController;
    abortController?.abort();
    tabState.botAbortController = null;
  }
}

function postBotProcessing(tabState: TabState) {
  tabState.port?.postMessage({
    type: MSG_TYPE_BOT_PROCESSING,
  });
}

function postBotTokenResponse(tabState: TabState, token: string) {
  tabState.port?.postMessage({
    type: MSG_TYPE_BOT_TOKEN_RESPONSE,
    payload: {
      token,
    },
  });
}

function postBotError(tabState: TabState, error: string) {
  tabState.port?.postMessage({
    type: MSG_TYPE_BOT_TOKEN_RESPONSE,
    payload: {
      error,
    },
  });
}

function postBotDone(tabState: TabState) {
  tabState.port?.postMessage({
    type: MSG_TYPE_BOT_DONE,
  });
}

function clearBotMemory(tabState: TabState) {
  tabState.botMemory?.clear();
}

function sendUrlChangeMessage(url: string) {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    try {
      const activeTabId = tabs[0].id;

      if (activeTabId) {
        await chrome.tabs.sendMessage(activeTabId, {
          type: MSG_TYPE_URL_CHANGE,
          payload: { url },
        });
      }
    } catch (error: any) {
      // no-op, UI component may not have been loaded due to delayed rendering
    }
  });
}

async function init() {
  const modelProvider = await getModelProvider();
  if (modelProvider) {
    await modelService.updateCurrentModelProvider();
  }
}

init().catch(console.error);
