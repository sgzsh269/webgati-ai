import React, { useCallback, useEffect, useState } from "react";

import { ActionIcon, Divider, Group, Notification, Paper } from "@mantine/core";
import {
  MSG_TYPE_BOT_STOP,
  MSG_TYPE_BOT_EXECUTE,
  MSG_TYPE_GET_TAB_ID,
  MSG_TYPE_INDEX_WEBPAGE,
  MSG_TYPE_BOT_CLEAR_MEMORY,
  SIDE_PANEL_WIDTH,
  STORAGE_FIELD_AI_MODEL_CONFIG,
} from "../utils/constants";
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
  SWMessagePayloadToken,
  ModelProvider,
} from "../utils/types";
import { IconSettings, IconX } from "@tabler/icons-react";
import { Logo } from "../components/Logo";
import { handleSettingsClick } from "../utils/ui";
import { useStorageOnChanged } from "../utils/hooks/useStorageOnChanged";

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

  const { showSidePanel, setShowSidePanel } = useToggleSidePanel();

  useSelectionDialog((prompt) => {
    setShowSidePanel(true);
    processUserPrompt(prompt);
  }, SELECTION_DEBOUNCE_DELAY_MS);

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

    await chrome.runtime.sendMessage({
      type: MSG_TYPE_INDEX_WEBPAGE,
      payload: {
        pageMarkdown,
      },
    });
  };

  const processUserPrompt = async (prompt: string) => {
    setMessages((messages) => [...messages, { role: "user", content: prompt }]);

    swPort?.postMessage({
      type: MSG_TYPE_BOT_EXECUTE,
      payload: {
        origin: "general",
        prompt,
      },
    });
  };

  const processToken = (payload: SWMessagePayloadToken) => {
    setMessages((messages) => {
      const lastMessage = messages[messages.length - 1];
      const prevMessages = messages.slice(0, messages.length - 1);

      if (!lastMessage || lastMessage.isComplete || lastMessage.role !== "ai") {
        return [
          ...messages,
          {
            role: "ai",
            content: payload.token,
            isComplete: payload.isEnd,
          },
        ];
      }
      return [
        ...prevMessages,
        {
          role: "ai",
          content: lastMessage.content + payload.token,
          isComplete: payload.isEnd,
        },
      ];
    });
  };

  const handleCloseClick = () => {
    setShowSidePanel(false);
  };

  const handleBotMessagePayload = useCallback(
    (payload: SWMessagePayloadToken) => {
      if (payload.error) {
        setError(payload.error);
      } else {
        processToken(payload);
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
      type: MSG_TYPE_BOT_STOP,
    });
  };

  const clearChatContext = useCallback(async () => {
    swPort?.postMessage({
      type: MSG_TYPE_BOT_CLEAR_MEMORY,
    });
    setMessages([]);
  }, [swPort]);

  const init = useCallback(async () => {
    setWebpageMarkdown("");
    setMessages([]);

    const modelProvider = await getModelProvider();

    setModelProvider(modelProvider);

    const tabId = await chrome.runtime.sendMessage({
      type: MSG_TYPE_GET_TAB_ID,
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
        <ActionList sx={{ marginTop: "8px", marginBottom: "8px" }} />
        {!webpageMarkdown && (
          <Notification mt="8px" color="orange" disallowClose>
            Chat is in general mode. Webpage has not been analyzed for chat!
            Click required action above.
          </Notification>
        )}
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
        />
      </Paper>
    </AppContext.Provider>
  );
}
