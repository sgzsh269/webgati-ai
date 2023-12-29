import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ConversationSummaryBufferMemory } from "langchain/memory";

import {
  InstallType,
  AppMessage,
  AppMessageBotDone,
  AppMessageBotExecute,
  AppMessageBotProcessing,
  AppMessageBotTokenResponse,
  AppMessageUrlChange,
  TabState,
  AppMessageUpdateModelId as SWMessageUpdateModel,
  AppMessageIndexWebpage,
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

/// TAB EVENTS
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (tab.url) {
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      enabled: true,
      path: "sidepanel.html",
    });
  }
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
  message: AppMessage,
  sender,
  sendResponse
) {
  switch (message.type) {
    case "sp_side-panel-init":
      initTabState(message.payload.tabId, message.payload.url);
      sendResponse("OK");
      break;
    case "sp_update-model":
      handleModelUpdate(message);
      sendResponse("OK");
      break;

    case "sp_keep-alive":
      sendResponse("OK");
      break;
    case "sp_index-webpage":
      indexWebpage(message)
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
    case "cs_capture-visible-screen":
      console.log("capture-visible-screen");
      chrome.tabs
        .captureVisibleTab({
          format: "png",
        })
        .then((imageData) => sendResponse(imageData));
      break;
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

  port.onMessage.addListener((message: AppMessage) => {
    handlePortMessage(tabState, message);
  });

  port.onDisconnect.addListener(() => {
    handlePortDisconnect(tabState);
  });
});

async function handlePortMessage(tabState: TabState, message: AppMessage) {
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

async function indexWebpage(message: AppMessageIndexWebpage) {
  const pageMarkdown = message.payload.pageMarkdown;

  const webpageDocs = await splitter.createDocuments([pageMarkdown]);

  const tabId = message.payload.tabId;

  const tabState = swService.swState.tabIdStateMap[tabId] as TabState;

  tabState.vectorStore = await MemoryVectorStore.fromDocuments(
    webpageDocs,
    aiService.getEmbeddingModel(tabId)!
  );
}

function handleModelUpdate(message: SWMessageUpdateModel) {
  const tabState = swService.swState.tabIdStateMap[
    message.payload.tabId
  ] as TabState;

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

async function invokeBot(msg: AppMessageBotExecute, tabState: TabState) {
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
  } as AppMessageBotProcessing);
}

function postBotTokenResponse(tabState: TabState, token: string) {
  tabState.port?.postMessage({
    type: "bot-token-response",
    payload: {
      token,
    },
  } as AppMessageBotTokenResponse);
}

function postBotError(tabState: TabState, error: string) {
  tabState.port?.postMessage({
    type: "bot-token-response",
    payload: {
      error,
    },
  } as AppMessageBotTokenResponse);
}

function postBotDone(tabState: TabState) {
  tabState.port?.postMessage({
    type: "bot-done",
  } as AppMessageBotDone);
}

function clearBotMemory(tabState: TabState) {
  tabState.botMemory?.clear();
}

async function sendUrlChangeMessage(tabId: number, url: string) {
  // Mainly to notify content script to take action when the url changes for SPA-based webpage
  try {
    await chrome.tabs.sendMessage<AppMessageUrlChange>(tabId, {
      type: "sw_url-change",
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

chrome.sidePanel.setPanelBehavior({
  openPanelOnActionClick: true,
});

init().catch(console.error);
