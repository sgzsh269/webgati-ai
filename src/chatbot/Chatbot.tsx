import React, { useCallback, useEffect, useState } from "react";

import { ActionIcon, Divider, Group, Paper, Select } from "@mantine/core";

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
  SWMessageUpdateModelId,
  SupportedModel,
} from "../utils/types";
import { IconSettings, IconX } from "@tabler/icons-react";
import { Logo } from "../components/Logo";
import { handleSettingsClick } from "../utils/ui";
import { useStorageOnChanged } from "../utils/hooks/useStorageOnChanged";
import html2canvas from "html2canvas";
import {
  SIDE_PANEL_WIDTH,
  STORAGE_FIELD_AI_MODEL_CONFIG,
  SUPPORTED_MODELS,
} from "../utils/constants";

const SELECTION_DEBOUNCE_DELAY_MS = 800;

export function Chatbot(): JSX.Element {
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [webpageMarkdown, setWebpageMarkdown] = useState("");
  const [tabId, setTabId] = useState<number | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [queryMode, setQueryMode] = useState<QueryMode>("general");
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!selectedModelId) {
      return;
    }

    handleSelectedIdModelChange(selectedModelId as SupportedModel);
  }, [selectedModelId]);

  const handleSelectedIdModelChange = async (
    selectedModelId: SupportedModel
  ) => {
    await chrome.runtime.sendMessage<SWMessageUpdateModelId>({
      type: "update-model-id",
      payload: {
        modelId: selectedModelId,
      },
    });
  };

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
    showSidePanel,
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

  const disableInput = isBotProcessing;

  return (
    <AppContext.Provider
      value={{
        swPort,
        webpageMarkdown,
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
        <Select
          placeholder="Choose a model"
          nothingFound="No options"
          data={SUPPORTED_MODELS}
          sx={{
            marginTop: "8px",
          }}
          value={selectedModelId}
          onChange={setSelectedModelId}
        />
        <ActionList
          queryMode={queryMode}
          sx={{ marginTop: "8px", marginBottom: "8px" }}
        />
        <Divider />
        <ChatUI
          messages={messages}
          disableInput={disableInput}
          isLoading={isBotProcessing}
          error={error}
          setError={setError}
          clearChatContext={clearChatContext}
          processUserPrompt={processUserPrompt}
          stopPromptProcessing={handleStopPromptProcessing}
          queryMode={queryMode}
          setQueryMode={setQueryMode}
          selectedModel={selectedModelId as SupportedModel}
        />
      </Paper>
    </AppContext.Provider>
  );
}
