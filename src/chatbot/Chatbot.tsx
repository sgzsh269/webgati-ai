import React, { useCallback, useEffect, useState } from "react";

import { ActionIcon, Divider, Group, Paper } from "@mantine/core";

import { getModelProvider } from "../utils/storage";
import { ChatUI } from "../components/ChatUI";
import { generatePageMarkdown } from "../utils/markdown";
import { ActionList } from "../components/ActionList";
import { AppContext } from "../utils/app-context";
import {
  useSWMessaging,
  useChromeTabUrlChange,
  useSelectionDialog,
  useToggleSidePanel,
} from "../utils/hooks";
import {
  ChatMessage,
  ModelProvider,
  QueryMode,
  SWMessageBotClearMemory,
  SWMessageBotExecute,
  SWMessageBotStop,
  SWMessageBotTokenResponse,
  SWMessageGetTabId,
  SWMessageIndexWebpage,
  SWMessagePayloadGeneral,
  SWMessagePayloadWebpageTextQA,
  SWMessagePayloadWebpageVQA,
} from "../utils/types";
import { IconSettings, IconX } from "@tabler/icons-react";
import { Logo } from "../components/Logo";
import { handleSettingsClick } from "../utils/ui";
import { useStorageOnChanged } from "../utils/hooks/useStorageOnChanged";
import html2canvas from "html2canvas";
import {
  SIDE_PANEL_WIDTH,
  STORAGE_FIELD_AI_MODEL_CONFIG,
} from "../utils/constants";

const SELECTION_DEBOUNCE_DELAY_MS = 800;

export function Chatbot(): JSX.Element {
  const [modelProvider, setModelProvider] = useState<ModelProvider | null>(
    null
  );
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [webpageMarkdown, setWebpageMarkdown] = useState("");
  const [tabId, setTabId] = useState<number | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [queryMode, setQueryMode] = useState<QueryMode>("general");

  const { showSidePanel, setShowSidePanel } = useToggleSidePanel();

  useSelectionDialog(
    (prompt) => {
      setShowSidePanel(true);
      processUserPrompt(prompt);
    },
    SELECTION_DEBOUNCE_DELAY_MS,
    queryMode
  );

  useChromeTabUrlChange((url) => {
    setUrl(url);
  });

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (url) {
      init();
    }
  }, [url]);

  const analyzeWebpage = async () => {
    const pageMarkdown = await generatePageMarkdown("general");
    setWebpageMarkdown(pageMarkdown);

    await chrome.runtime.sendMessage<SWMessageIndexWebpage>({
      type: "index-webpage",
      payload: {
        pageMarkdown,
      },
    });
  };

  const processUserPrompt = async (prompt: string) => {
    setMessages((messages) => [...messages, { role: "user", content: prompt }]);

    if (queryMode === "webpage-text-qa") {
      if (!webpageMarkdown) {
        await analyzeWebpage();
      }
    }

    if (queryMode === "webpage-vqa") {
      takeWebpageScreenshot().then((imageData) => {
        swPort?.postMessage({
          type: "bot-execute",
          payload: {
            queryMode,
            prompt,
            imageData,
          } as SWMessagePayloadWebpageVQA,
        } as SWMessageBotExecute);
      });
    } else {
      swPort?.postMessage({
        type: "bot-execute",
        payload: {
          queryMode,
          prompt,
        } as SWMessagePayloadGeneral | SWMessagePayloadWebpageTextQA,
      } as SWMessageBotExecute);
    }
  };

  const takeWebpageScreenshot = async () => {
    const canvas = await html2canvas(document.body, { useCORS: true });
    const imgData = canvas.toDataURL("image/jpeg");
    return imgData;
  };

  const processToken = (token: string, isDone: boolean) => {
    setMessages((messages) => {
      const lastMessage = messages[messages.length - 1];
      const prevMessages = messages.slice(0, messages.length - 1);

      if (!lastMessage || lastMessage.isComplete || lastMessage.role !== "ai") {
        return [
          ...messages,
          {
            role: "ai",
            content: token,
            isComplete: isDone,
          },
        ];
      }
      return [
        ...prevMessages,
        {
          role: "ai",
          content: lastMessage.content + token,
          isComplete: isDone,
        },
      ];
    });
  };

  const handleCloseClick = () => {
    setShowSidePanel(false);
  };

  const handleBotMessagePayload = useCallback(
    (payload: SWMessageBotTokenResponse["payload"], isDone: boolean) => {
      if (payload.error) {
        setError(payload.error);
      } else {
        processToken(payload.token, isDone);
      }
    },
    []
  );

  const { swPort, isBotProcessing } = useSWMessaging(
    tabId,
    url,
    handleBotMessagePayload
  );

  const handleStopPromptProcessing = () => {
    swPort?.postMessage({
      type: "bot-stop",
    } as SWMessageBotStop);
  };

  const clearChatContext = useCallback(async () => {
    swPort?.postMessage({
      type: "bot-clear-memory",
    } as SWMessageBotClearMemory);
    setMessages([]);
  }, [swPort]);

  const init = useCallback(async () => {
    setWebpageMarkdown("");
    setMessages([]);

    const modelProvider = await getModelProvider();

    setModelProvider(modelProvider);

    const tabId = await chrome.runtime.sendMessage<SWMessageGetTabId>({
      type: "get-tab-id",
    });
    setTabId(tabId);
  }, []);

  const handleStorageChange = useCallback(
    (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const aiModelConfigChanges = changes[STORAGE_FIELD_AI_MODEL_CONFIG];

      if (aiModelConfigChanges) {
        init();
      }
    },
    [init]
  );

  useStorageOnChanged(handleStorageChange);

  const disableInput = !modelProvider || isBotProcessing;

  return (
    <AppContext.Provider
      value={{
        swPort,
        webpageMarkdown,
        modelProvider,
        analyzeWebpage,
        clearChatContext,
      }}
    >
      <Paper
        sx={{
          display: showSidePanel ? "flex" : "none",
          padding: "8px",
          flexDirection: "column",
          position: "fixed",
          height: "100vh",
          width: SIDE_PANEL_WIDTH + "px",
          top: 0,
          right: 0,
          overflow: "auto",
          zIndex: 2147483600,
          boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
          fontFamily: "arial, sans-serif",
          fontSize: "16px",
        }}
        radius={0}
        shadow="xl"
        withBorder
      >
        <Group position="apart">
          <ActionIcon variant="transparent" onClick={handleSettingsClick}>
            <IconSettings size="24px" />
          </ActionIcon>
          <Logo />
          <ActionIcon variant="transparent">
            <IconX size="24px" onClick={handleCloseClick} />
          </ActionIcon>
        </Group>
        <ActionList
          queryMode={queryMode}
          sx={{ marginTop: "8px", marginBottom: "8px" }}
        />
        <Divider />
        <ChatUI
          messages={messages}
          modelProvider={modelProvider}
          disableInput={disableInput}
          isLoading={isBotProcessing}
          error={error}
          setError={setError}
          clearChatContext={clearChatContext}
          processUserPrompt={processUserPrompt}
          stopPromptProcessing={handleStopPromptProcessing}
          queryMode={queryMode}
          setQueryMode={setQueryMode}
        />
      </Paper>
    </AppContext.Provider>
  );
}
