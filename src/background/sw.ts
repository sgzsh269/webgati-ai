import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ConversationSummaryBufferMemory } from "langchain/memory";

import {
  InstallType,
  SWMessage,
  SWMessageBotDone,
  SWMessageBotExecute,
  SWMessageBotProcessing,
  SWMessageBotTokenResponse,
  SWMessageToggleSidePanel,
  SWMessageUrlChange,
  TabState,
  SWMessageUpdateModelId as SWMessageUpdateModel,
  SWMessageIndexWebpage,
} from "../utils/types";
import { readAIModelConfig } from "../utils/storage";
import {
  AI_MODEL_CONFIG_DEFAULT,
  STORAGE_FIELD_AI_MODEL_CONFIG,
} from "../utils/constants";
import { SWService } from "./services/sw-service";
import { AIService } from "./services/ai/ai-service";

const splitter = RecursiveCharacterTextSplitter.fromLanguage("markdown", {
  chunkSize: 2000,
  chunkOverlap: 200,
});

/// STORAGE EVENTS

chrome.storage.local.onChanged.addListener(function (changes) {
  if (changes) {
    const aiModelConfigChange = changes[STORAGE_FIELD_AI_MODEL_CONFIG];

    if (aiModelConfigChange) {
      aiService.updateAIModelConfig(aiModelConfigChange.newValue);
    }
  }
});

/// BROWSER ACTION EVENTS (EXTENSION ICON CLICK)

chrome.action.onClicked.addListener(async function (tab) {
  try {
    if (tab.id) {
      await chrome.tabs.sendMessage<SWMessageToggleSidePanel>(tab.id, {
        type: "toggle-side-panel",
      });
    }
  } catch (error: any) {
    console.log(`Error: No webpage loaded in tab - ${error.message}`);
  }
});

/// TAB EVENTS
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  // Re-init tab state when url changes or page is refreshed
  // When page is refreshed, only 'favIconUrl' field gets updated
  if (changeInfo.url || changeInfo.favIconUrl) {
    const oldTabState = swService.swState.tabIdStateMap[tabId];

    let oldUrl = "";
    if (oldTabState) {
      oldUrl = oldTabState.url!;
      oldTabState.port?.disconnect();
    }

    const newUrl = changeInfo.url || oldUrl;

    sendUrlChangeMessage(tabId, newUrl);
  }
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  stopBot(tabId);
  delete swService.swState.tabIdStateMap[tabId];
});

/// MESSAGE EVENTS

chrome.runtime.onMessage.addListener(function (
  message: SWMessage,
  sender,
  sendResponse
) {
  const tabId = sender.tab?.id as number;
  const url = sender.tab?.url as string;
  const messageType = message.type;

  switch (message.type) {
    case "content-script-init":
      initTabState(tabId, url);
      sendResponse("OK");
      break;
    case "index-webpage":
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
    case "get-tab-id":
      sendResponse(tabId);
      break;
    case "update-model":
      handleModelUpdate(tabId, message);
      sendResponse("OK");
      break;
    case "capture-visible-screen":
      chrome.tabs
        .captureVisibleTab({ format: "png" })
        .then((dataUrl) => sendResponse(dataUrl));
      break;
    case "keep-alive":
      sendResponse("OK");
      break;
    default:
      throw new Error(
        `Message type not implemented for chrome.runtime.onMessage listnener: ${messageType}`
      );
  }
  return true;
});

chrome.runtime.onConnect.addListener(function (port) {
  if (!port.name.includes("tab")) {
    return;
  }
  const tabId = parseInt(port.name.split("-")[1]);

  const tabState = swService.swState.tabIdStateMap[tabId] as TabState;
  if (!tabState) {
    throw new Error("No tab state found for tab id: " + tabId);
  }

  tabState.port = port;

  port.onMessage.addListener((message: SWMessage) => {
    handlePortMessage(tabState, message);
  });

  port.onDisconnect.addListener(() => {
    handlePortDisconnect(tabState);
  });
});

async function handlePortMessage(tabState: TabState, message: SWMessage) {
  switch (message.type) {
    case "bot-execute":
      invokeBot(message, tabState);
      break;
    case "bot-stop":
      stopBot(tabState.tabId);
      break;
    case "bot-clear-memory":
      clearBotMemory(tabState);
      break;
    default:
      throw new Error(
        `Message type not implemented for port listener: ${message.type}`
      );
  }
}

function handlePortDisconnect(tabState: TabState) {
  tabState.port = null;
}

async function indexWebpage(
  tabId: number,
  url: string,
  message: SWMessageIndexWebpage
) {
  const pageMarkdown = message.payload.pageMarkdown;

  const webpageDocs = await splitter.createDocuments([pageMarkdown]);

  const tabState = swService.swState.tabIdStateMap[tabId] as TabState;

  tabState.vectorStore = await MemoryVectorStore.fromDocuments(
    webpageDocs,
    aiService.getEmbeddingModel(tabId)!
  );
}

function handleModelUpdate(tabId: number, message: SWMessageUpdateModel) {
  const tabState = swService.swState.tabIdStateMap[tabId] as TabState;

  const oldModelProvider = tabState.model?.provider;

  tabState.model = {
    provider: message.payload.modelProvider,
    modelName: message.payload.modelName,
  };

  if (oldModelProvider !== message.payload.modelProvider) {
    tabState.botMemory = null;
    tabState.vectorStore = null;
  }
}

function initTabState(tabId: number, url: string | null | undefined): TabState {
  swService.swState.tabIdStateMap[tabId] = {
    tabId,
    url,
    model: null,
    botAbortController: null,
    botMemory: null,
    vectorStore: null,
    port: null,
  };

  return swService.swState.tabIdStateMap[tabId]!;
}

async function invokeBot(msg: SWMessageBotExecute, tabState: TabState) {
  try {
    postBotProcessing(tabState);

    if (!tabState.botAbortController) {
      tabState.botAbortController = new AbortController();
    }

    if (!tabState.botMemory) {
      tabState.botMemory = new ConversationSummaryBufferMemory({
        llm: aiService.getCurrentLLM(tabState.tabId, false),
        maxTokenLimit: 1000,
        returnMessages: true,
      });
    }

    await aiService.execute(
      swService.swState.installType as "development" | "normal",
      tabState.tabId,
      msg,
      tabState.vectorStore,
      tabState.botMemory!,
      tabState.botAbortController,
      (token) => postBotTokenResponse(tabState, token)
    );
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
  const tabState = swService.swState.tabIdStateMap[tabId];

  if (tabState) {
    const abortController = tabState.botAbortController;
    abortController?.abort();
    tabState.botAbortController = null;
  }
}

function postBotProcessing(tabState: TabState) {
  tabState.port?.postMessage({
    type: "bot-processing",
  } as SWMessageBotProcessing);
}

function postBotTokenResponse(tabState: TabState, token: string) {
  tabState.port?.postMessage({
    type: "bot-token-response",
    payload: {
      token,
    },
  } as SWMessageBotTokenResponse);
}

function postBotError(tabState: TabState, error: string) {
  tabState.port?.postMessage({
    type: "bot-token-response",
    payload: {
      error,
    },
  } as SWMessageBotTokenResponse);
}

function postBotDone(tabState: TabState) {
  tabState.port?.postMessage({
    type: "bot-done",
  } as SWMessageBotDone);
}

function clearBotMemory(tabState: TabState) {
  tabState.botMemory?.clear();
}

async function sendUrlChangeMessage(tabId: number, url: string) {
  // Mainly to notify content script to take action when the url changes for SPA-based webpage
  try {
    await chrome.tabs.sendMessage<SWMessageUrlChange>(tabId, {
      type: "url-change",
      payload: { url },
    });
  } catch (error: any) {
    // no-op, this is expected when the content script hasn't been injected yet on a fresh page load
  }
}

/// INITIALIZATION

const swService = new SWService();
const aiService = new AIService(swService);

chrome.runtime.onInstalled.addListener(async function (details) {
  if (details.reason === "update") {
    // TODO: Handle update
  }
  const management = await chrome.management.getSelf();
  swService.swState.installType = management.installType as InstallType;
});

async function init() {
  let aiModelConfig = await readAIModelConfig();
  if (!aiModelConfig) {
    aiModelConfig = AI_MODEL_CONFIG_DEFAULT;
    await chrome.storage.local.set({
      [STORAGE_FIELD_AI_MODEL_CONFIG]: aiModelConfig,
    });
  }
  aiService.initialize();
  aiService.updateAIModelConfig(aiModelConfig!);

  console.log("Background service initialized");
}

init().catch(console.error);
