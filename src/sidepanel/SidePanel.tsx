import React, { useCallback, useEffect, useState } from "react";

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  Select,
  Text,
} from "@mantine/core";

import { ChatUI } from "./ChatUI";
import { generatePageMarkdown } from "../utils/markdown";
import { ActionList } from "./ActionList";
import { AppContext } from "../utils/app-context";
import {
  useChatMessaging,
  useSidePanelMessageListener,
  useStorageOnChanged,
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
  SWMessageSidePanelInit,
  SWMessageIndexWebpage,
  SWMessagePayloadGeneral,
  SWMessagePayloadWebpageTextQA,
  SWMessagePayloadWebpageVQA,
  SWMessageUpdateModelId,
} from "../utils/types";
import { IconAlertCircle, IconSettings } from "@tabler/icons-react";
import { openSettings } from "../utils/ui";
import { STORAGE_FIELD_AI_MODEL_CONFIG } from "../utils/constants";
import {
  readAIModelConfig,
  readLastSelectedModelId,
  saveLastSelectedModelId,
} from "../utils/storage";

export function SidePanel(): JSX.Element {
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [webpageMarkdown, setWebpageMarkdown] = useState("");
  const [queryMode, setQueryMode] = useState<QueryMode>("general");
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [modelSelectOptions, setModelSelectOptions] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<{
    modelProvider: ModelProvider;
    apiKey?: string;
    config: ModelConfig;
  } | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [tabId, setTabId] = useState<number | null>(null);

  const manifest = chrome.runtime.getManifest();
  const version = manifest.version;

  const analyzeWebpage = async () => {
    const pageMarkdown = await generatePageMarkdown("general");
    setWebpageMarkdown(pageMarkdown);

    await chrome.runtime.sendMessage<SWMessageIndexWebpage>({
      type: "sp_index-webpage",
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

  const { swPort, isBotProcessing } = useChatMessaging(
    tabId,
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

  const clearSessionState = useCallback(() => {
    setWebpageMarkdown("");
    setMessages([]);
  }, []);

  const handleSelectedModelChange = useCallback(
    async (tabId: number, selectedModelId: string | null) => {
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

      await chrome.runtime.sendMessage<SWMessageUpdateModelId>({
        type: "sp_update-model",
        payload: {
          tabId,
          modelProvider,
          modelName,
        },
      });

      if (aiModelConfig) {
        const modelConfig = aiModelConfig[modelProvider].chatModels.find(
          (item) => item.modelName === modelName
        );

        setSelectedModel({
          modelProvider,
          apiKey: aiModelConfig[modelProvider].apiKey,
          config: modelConfig as ModelConfig,
        });
      }
    },
    [selectedModel, clearSessionState]
  );

  const init = useCallback(async () => {
    clearSessionState();

    const tab = (
      await chrome.tabs.query({ active: true, currentWindow: true })
    ).at(0);
    const tabId = tab!.id!;
    const url = tab!.url!;

    await chrome.runtime.sendMessage<SWMessageSidePanelInit>({
      type: "sp_side-panel-init",
      payload: {
        tabId,
        url,
      },
    });

    setTabId(tabId);

    const aiModelConfig = await readAIModelConfig();
    populateModelSelect(aiModelConfig);

    const lastSelectedModelId = await readLastSelectedModelId();
    handleSelectedModelChange(tabId, lastSelectedModelId);
  }, [clearSessionState, handleSelectedModelChange]);

  const populateModelSelect = (aiModelConfig: AIModelConfig | null) => {
    const modelOptions = [];

    if (aiModelConfig) {
      for (const modelProvider of [
        "openai",
        "ollama",
        "anthropic",
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

        if (tabId) {
          handleSelectedModelChange(tabId, selectedModelId);
        }
      }
    },
    [tabId, selectedModelId, handleSelectedModelChange]
  );

  useStorageOnChanged(handleStorageChange);

  const handleUrlChange = useCallback(() => {
    init();
  }, [init]);

  useSidePanelMessageListener(handleUrlChange);

  useEffect(() => {
    init();
  }, []);

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
        tabId,
        swPort,
        webpageMarkdown,
        analyzeWebpage,
        clearChatContext,
        setImageData,
      }}
    >
      <Paper
        sx={{
          display: "flex",
          padding: "8px",
          flexDirection: "column",
          position: "fixed",
          height: "100vh",
          width: "100%",
          top: 0,
          right: 0,
          overflow: "auto",
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
          <Group sx={{}}>
            <Text size="sm">v{version}</Text>
            <Badge color="yellow" size="sm">
              BETA
            </Badge>
          </Group>
        </Group>
        <Select
          placeholder="Choose a model"
          nothingFound="No options"
          data={modelSelectOptions}
          sx={{
            marginTop: "8px",
          }}
          value={selectedModelId}
          onChange={(value) => handleSelectedModelChange(tabId!, value)}
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
        {selectedModelId && requiresApiKey && (
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
