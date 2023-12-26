import React, { useCallback, useEffect, useState } from "react";

import {
  ActionIcon,
  Alert,
  Button,
  Divider,
  Group,
  Paper,
  Select,
  Text,
} from "@mantine/core";

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
  AIModelConfig,
  ChatMessage,
  ModelConfig,
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
  SWMessageUpdateModelId,
} from "../utils/types";
import { IconAlertCircle, IconSettings, IconX } from "@tabler/icons-react";
import { Logo } from "../components/Logo";
import { openSettings } from "../utils/ui";
import { useStorageOnChanged } from "../utils/hooks/useStorageOnChanged";
import {
  EXTENSION_Z_INDEX,
  SIDE_PANEL_WIDTH,
  STORAGE_FIELD_AI_MODEL_CONFIG,
} from "../utils/constants";
import {
  readAIModelConfig,
  readLastSelectedModelId,
  saveLastSelectedModelId,
} from "../utils/storage";

const SELECTION_DEBOUNCE_DELAY_MS = 800;

export function Chatbot(): JSX.Element {
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [webpageMarkdown, setWebpageMarkdown] = useState("");
  const [tabId, setTabId] = useState<number | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [queryMode, setQueryMode] = useState<QueryMode>("general");
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [modelSelectOptions, setModelSelectOptions] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<{
    modelProvider: ModelProvider;
    apiKey?: string;
    config: ModelConfig;
  } | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [showSidePanel, setShowSidePanel] = useState<boolean>(false);

  useToggleSidePanel(() => {
    setShowSidePanel((showSidePanel) => !showSidePanel);
  });

  useSelectionDialog(
    (prompt) => {
      setShowSidePanel(true);

      if (disableInput) {
        return;
      }

      processUserPrompt("general", prompt);
    },
    SELECTION_DEBOUNCE_DELAY_MS,
    queryMode
  );

  useChromeTabUrlChange((url) => {
    init();
    setUrl(url);
  });

  useEffect(() => {
    init();
  }, []);

  const handleSelectedModelChange = async (selectedModelId: string | null) => {
    setSelectedModelId(selectedModelId);

    if (!selectedModelId) {
      return;
    }

    await saveLastSelectedModelId(selectedModelId);

    const [modelProvider, modelName] = selectedModelId.split("_") as [
      ModelProvider,
      string
    ];

    if (modelProvider !== selectedModel?.modelProvider) {
      clearSessionState();
    }

    const aiModelConfig = await readAIModelConfig();

    if (aiModelConfig) {
      const modelConfig = aiModelConfig[modelProvider].chatModels.find(
        (item) => item.modelName === modelName
      );

      await chrome.runtime.sendMessage<SWMessageUpdateModelId>({
        type: "update-model",
        payload: {
          modelProvider,
          modelName,
        },
      });

      setSelectedModel({
        modelProvider,
        apiKey: aiModelConfig[modelProvider].apiKey,
        config: modelConfig as ModelConfig,
      });
    }
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

  const processUserPrompt = async (queryMode: QueryMode, prompt: string) => {
    setMessages((messages) => [...messages, { role: "user", content: prompt }]);

    if (queryMode === "webpage-text-qa") {
      if (!webpageMarkdown) {
        await analyzeWebpage();
      }
    }

    if (queryMode === "webpage-vqa") {
      swPort?.postMessage({
        type: "bot-execute",
        payload: {
          queryMode,
          prompt,
          imageData,
        } as SWMessagePayloadWebpageVQA,
      } as SWMessageBotExecute);
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
    clearSessionState();

    const tabId = await chrome.runtime.sendMessage<SWMessageGetTabId>({
      type: "get-tab-id",
    });
    setTabId(tabId);

    const aiModelConfig = await readAIModelConfig();
    populateModelSelect(aiModelConfig);

    const lastSelectedModelId = await readLastSelectedModelId();
    setSelectedModelId(lastSelectedModelId);
  }, []);

  const clearSessionState = useCallback(() => {
    setWebpageMarkdown("");
    setMessages([]);
  }, []);

  const populateModelSelect = (aiModelConfig: AIModelConfig | null) => {
    const modelOptions = [];

    if (aiModelConfig) {
      for (const modelProvider of [
        "openai",
        "anthropic",
        "ollama",
      ] as ModelProvider[]) {
        const config = aiModelConfig[modelProvider];
        for (const item of config.chatModels) {
          modelOptions.push({
            value: `${modelProvider}_${item.modelName}`,
            label: item.label,
            group: modelProvider.toUpperCase(),
          });
        }
      }
    }

    setModelSelectOptions(modelOptions);
  };

  const handleStorageChange = useCallback(
    (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const aiModelConfigChanges = changes[STORAGE_FIELD_AI_MODEL_CONFIG];

      if (aiModelConfigChanges) {
        populateModelSelect(aiModelConfigChanges.newValue);
        handleSelectedModelChange(selectedModelId);
      }
    },
    [selectedModelId]
  );

  useStorageOnChanged(handleStorageChange);

  const requiresApiKey =
    selectedModel?.modelProvider !== "ollama" && !selectedModel?.apiKey;
  const disableInput =
    !selectedModel ||
    requiresApiKey ||
    isBotProcessing ||
    (queryMode === "webpage-vqa" && !imageData);

  return (
    <AppContext.Provider
      value={{
        swPort,
        webpageMarkdown,
        analyzeWebpage,
        clearChatContext,
        setImageData,
        setShowSidePanel,
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
          zIndex: EXTENSION_Z_INDEX,
          boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px",
          fontFamily: "arial, sans-serif",
          fontSize: "16px",
        }}
        radius={0}
        shadow="xl"
        withBorder
      >
        <Group position="apart">
          <ActionIcon variant="transparent" onClick={openSettings}>
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
          data={modelSelectOptions}
          sx={{
            marginTop: "8px",
          }}
          value={selectedModelId}
          onChange={handleSelectedModelChange}
          searchable
        />
        <ActionList
          queryMode={queryMode}
          sx={{ marginTop: "8px", marginBottom: "8px" }}
        />
        <Divider />
        {!selectedModelId && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            Please select a model
          </Alert>
        )}
        {selectedModel && requiresApiKey && (
          <Alert icon={<IconAlertCircle size={16} />} color="orange">
            <Text size="sm">
              Please set API Key for selected model in settings
            </Text>
            <Button color="orange" size="xs" onClick={openSettings}>
              Open Settings
            </Button>
          </Alert>
        )}
        <ChatUI
          messages={messages}
          disableInput={disableInput}
          isLoading={isBotProcessing}
          error={error}
          setError={setError}
          clearChatContext={clearChatContext}
          processUserPrompt={(prompt) => processUserPrompt(queryMode, prompt)}
          stopPromptProcessing={handleStopPromptProcessing}
          queryMode={queryMode}
          setQueryMode={setQueryMode}
          modelConfig={selectedModel?.config || null}
          imageData={imageData}
          clearImageData={() => setImageData(null)}
        />
      </Paper>
    </AppContext.Provider>
  );
}
