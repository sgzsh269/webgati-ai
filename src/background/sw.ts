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

/// INITIALIZATION

const swService = new SWService();
const aiService = new AIService(swService);

chrome.runtime.onInstalled.addListener(async function () {
  const management = await chrome.management.getSelf();
  swService.swState.installType = management.installType as InstallType;

  let aiModelConfig = await readAIModelConfig();
  if (!aiModelConfig) {
    aiModelConfig = AI_MODEL_CONFIG_DEFAULT;
    await chrome.storage.local.set({
      [STORAGE_FIELD_AI_MODEL_CONFIG]: aiModelConfig,
    });
  }
  aiService.initialize();
  aiService.updateAIModelConfig(aiModelConfig!);
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
    if (
      changeInfo.url?.includes("chrome-extension://") ||
      changeInfo.url?.includes("chrome://")
    ) {
      return;
    }

    const oldTabState = swService.swState.tabIdStateMap[tabId];

    let oldUrl = "";
    let oldModel: TabState["model"] | null = null;
    if (oldTabState) {
      oldUrl = oldTabState.url!;
      oldModel = oldTabState.model;

      oldTabState.port?.disconnect();
      delete swService.swState.tabIdStateMap[tabId];
    }

    initTabState(tabId, changeInfo.url || oldUrl, oldModel);

    if (changeInfo.url) {
      sendUrlChangeMessage(changeInfo.url);
    } else {
      sendUrlChangeMessage(oldUrl!);
    }
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
      updateTabModel(tabId, message);
      sendResponse("OK");
      break;
    case "keep-alive":
      sendResponse("OK");
      break;
    default:
      console.log(
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
  const sender = port.sender;

  let tabState = swService.swState.tabIdStateMap[tabId] as TabState;
  if (!tabState) {
    initTabState(tabId, sender!.url!, null);
    tabState = swService.swState.tabIdStateMap[tabId] as TabState;
    return;
  }

  tabState.port = port;

  port.onMessage.addListener(async function (msg: SWMessage) {
    switch (msg.type) {
      case "bot-execute":
        invokeBot(msg, tabState);
        break;
      case "bot-stop":
        stopBot(tabId);
        break;
      case "bot-clear-memory":
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

async function indexWebpage(
  tabId: number,
  url: string,
  message: SWMessageIndexWebpage
) {
  const pageMarkdown = message.payload.pageMarkdown;

  const webpageDocs = await splitter.createDocuments([pageMarkdown]);

  const tabState = swService.swState.tabIdStateMap[tabId] as TabState;

  tabState.webpageDocs = webpageDocs;
  tabState.vectorStore = await MemoryVectorStore.fromDocuments(
    webpageDocs,
    aiService.getEmbeddingModel(tabId)!
  );
}

async function updateTabModel(tabId: number, message: SWMessageUpdateModel) {
  const tabState = swService.swState.tabIdStateMap[tabId] as TabState;

  tabState.model = {
    provider: message.payload.modelProvider,
    modelName: message.payload.modelName,
  };
}

async function initTabState(
  tabId: number,
  url: string,
  model: TabState["model"]
) {
  swService.swState.tabIdStateMap[tabId] = {
    tabId,
    url,
    model,
    botAbortController: null,
    botMemory: null,
    vectorStore: null,
    webpageDocs: [],
    port: null,
  };
}

async function invokeBot(msg: SWMessageBotExecute, tabState: TabState) {
  try {
    postBotProcessing(tabState);

    if (!tabState.botMemory) {
      tabState.botMemory = new ConversationSummaryBufferMemory({
        llm: aiService.getCurrentLLM(tabState.tabId, "general", true),
        maxTokenLimit: 1000,
        returnMessages: true,
      });
    }

    if (!tabState.botAbortController) {
      tabState.botAbortController = new AbortController();
    }

    await aiService.execute(
      swService.swState.installType as "development" | "normal",
      tabState.tabId,
      msg,
      tabState.vectorStore,
      tabState.botMemory,
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

function sendUrlChangeMessage(url: string) {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    try {
      const activeTabId = tabs[0].id;

      if (activeTabId) {
        await chrome.tabs.sendMessage<SWMessageUrlChange>(activeTabId, {
          type: "url-change",
          payload: { url },
        });
      }
    } catch (error: any) {
      // no-op, UI component may not have been loaded due to delayed rendering
    }
  });
}
