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
  AppMessageBotExecute,
  AppMessageBotStop,
  AppMessageBotTokenResponse,
  AppMessageIndexWebpage,
  AppMessagePayloadGeneral,
  AppMessagePayloadWebpageTextQA,
  AppMessagePayloadWebpageVQA,
  AppMessageUpdateModelId,
  AppMessageGetWebpage,
} from "../utils/types";
import { IconAlertCircle, IconSettings } from "@tabler/icons-react";
import { openSettings } from "../utils/ui";
import { STORAGE_FIELD_AI_MODEL_CONFIG } from "../utils/constants";
import {
  readAIModelConfig,
  readLastSelectedModelId,
  saveSelectedModelId,
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

  const processToken = useCallback(
    (queryMode: QueryMode | null, token: string, isDone: boolean) => {
      setMessages((messages) => {
        const lastMessage = messages[messages.length - 1];
        const prevMessages = messages.slice(0, messages.length - 1);

        if (
          !lastMessage ||
          lastMessage.isComplete ||
          lastMessage.role !== "ai"
        ) {
          return [
            ...messages,
            {
              role: "ai",
              queryMode: queryMode!,
              content: token,
              isComplete: isDone,
            },
          ];
        }
        return [
          ...prevMessages,
          {
            role: "ai",
            queryMode: lastMessage.queryMode,
            content: lastMessage.content + token,
            isComplete: isDone,
          },
        ];
      });
    },
    []
  );

  const handleBotMessagePayload = useCallback(
    (payload: AppMessageBotTokenResponse["payload"], isDone: boolean) => {
      if (payload.error) {
        setError(payload.error);
      } else {
        processToken(payload.queryMode, payload.token, isDone);
      }
    },
    [processToken]
  );

  const sendUpdateModelMessage = useCallback(
    async (tabId: number | null, currSelectedModelId: string | null) => {
      if (!tabId || !currSelectedModelId) {
        return;
      }
      const [modelProvider, modelName] = currSelectedModelId.split("_") as [
        ModelProvider,
        string
      ];

      await chrome.runtime.sendMessage<AppMessageUpdateModelId>({
        type: "sp_update-model",
        payload: {
          tabId,
          modelProvider,
          modelName,
        },
      });
    },
    []
  );

  const handleTabStateInit = useCallback(() => {
    setWebpageMarkdown("");
    sendUpdateModelMessage(tabId, selectedModelId);
  }, [tabId, selectedModelId, sendUpdateModelMessage]);

  const { swPort, isBotProcessing } = useChatMessaging(
    tabId,
    handleTabStateInit,
    handleBotMessagePayload
  );

  const analyzeWebpage = useCallback(async () => {
    const pageMarkdown = await chrome.tabs.sendMessage<AppMessageGetWebpage>(
      tabId!,
      {
        type: "sp_get-webpage",
        payload: {
          usageType: "general",
        },
      }
    );
    setWebpageMarkdown(pageMarkdown);

    await chrome.runtime.sendMessage<AppMessageIndexWebpage>({
      type: "sp_index-webpage",
      payload: {
        tabId: tabId!,
        pageMarkdown,
      },
    });
  }, [tabId]);

  const processUserPrompt = useCallback(
    async (queryMode: QueryMode, prompt: string) => {
      const prevMessages: ChatMessage[] = [];
      setMessages((messages) => {
        prevMessages.push(...messages);
        return [...messages, { role: "human", queryMode, content: prompt }];
      });

      if (queryMode === "webpage-text-qa") {
        if (!webpageMarkdown) {
          await analyzeWebpage();
        }
      }

      if (queryMode === "webpage-vqa") {
        swPort?.postMessage({
          type: "sp_bot-execute",
          payload: {
            queryMode,
            prompt,
            prevMessages,
            imageData,
          } as AppMessagePayloadWebpageVQA,
        } as AppMessageBotExecute);
      } else {
        swPort?.postMessage({
          type: "sp_bot-execute",
          payload: {
            queryMode,
            prompt,
            prevMessages,
          } as AppMessagePayloadGeneral | AppMessagePayloadWebpageTextQA,
        } as AppMessageBotExecute);
      }
    },
    [analyzeWebpage, imageData, swPort, webpageMarkdown]
  );

  const handleStopPromptProcessing = useCallback(() => {
    swPort?.postMessage({
      type: "sp_bot-stop",
    } as AppMessageBotStop);
  }, [swPort]);

  const clearChatContext = useCallback(async () => {
    setMessages([]);
  }, []);

  const clearSessionState = useCallback(() => {
    setWebpageMarkdown("");
    setMessages([]);
    setImageData(null);
  }, []);

  const updateModelConfig = useCallback(
    async (currSelectedModelId: string | null) => {
      if (!currSelectedModelId) {
        return;
      }

      const [modelProvider, modelName] = currSelectedModelId.split("_") as [
        ModelProvider,
        string
      ];
      const aiModelConfig = await readAIModelConfig();

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
    []
  );

  const handleSelectedModelChange = useCallback(
    async (currSelectedModelId: string | null) => {
      if (!currSelectedModelId) {
        return;
      }

      setSelectedModelId(currSelectedModelId);

      const [modelProvider] = currSelectedModelId.split("_") as [
        ModelProvider,
        string
      ];

      if (modelProvider !== selectedModel?.modelProvider) {
        clearSessionState();
      }

      await saveSelectedModelId(currSelectedModelId);
    },

    [selectedModel, clearSessionState]
  );

  const init = useCallback(async () => {
    clearSessionState();

    const tab = (
      await chrome.tabs.query({ active: true, currentWindow: true })
    ).at(0);
    const tabId = tab!.id!;

    setTabId(tabId);

    const aiModelConfig = await readAIModelConfig();
    populateModelSelect(aiModelConfig);

    const lastSelectedModelId = await readLastSelectedModelId();
    if (lastSelectedModelId) {
      setSelectedModelId(lastSelectedModelId);
    }
  }, [clearSessionState]);

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

        updateModelConfig(selectedModelId);
      }
    },
    [selectedModelId, updateModelConfig]
  );

  useStorageOnChanged(handleStorageChange);

  const handleUrlChange = useCallback(() => {
    clearSessionState();
  }, [clearSessionState]);

  const handleSelectionPrompt = useCallback(
    (prompt: string) => {
      processUserPrompt("general", prompt);
    },
    [processUserPrompt]
  );

  const handleImageCapture = useCallback((imageData: string) => {
    setImageData(imageData);
  }, []);

  useSidePanelMessageListener(
    tabId,
    handleUrlChange,
    handleSelectionPrompt,
    handleImageCapture
  );

  useEffect(() => {
    sendUpdateModelMessage(tabId, selectedModelId);
  }, [tabId, selectedModelId, sendUpdateModelMessage]);

  useEffect(() => {
    updateModelConfig(selectedModelId);
  }, [selectedModelId, updateModelConfig]);

  useEffect(() => {
    init();
  }, [init]);

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
        handleImageCapture,
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
          onChange={(value) => handleSelectedModelChange(value)}
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
        {queryMode === "webpage-vqa" && !imageData && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            Please capture image
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
