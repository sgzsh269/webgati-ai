import {
  STORAGE_FIELD_AI_MODEL_CONFIG,
  STORAGE_FIELD_MODEL_PROVIDER,
} from "./constants";
import { AIModelConfig, ModelProvider } from "./types";

export async function readAIModelConfig(): Promise<AIModelConfig | null> {
  const result = await chrome.storage.local.get(STORAGE_FIELD_AI_MODEL_CONFIG);
  return result[STORAGE_FIELD_AI_MODEL_CONFIG] || null;
}

export async function readModelProviderConfig(
  modelProvider: ModelProvider
): Promise<Record<string, any> | null> {
  const aiModelConfig = await readAIModelConfig();
  if (!aiModelConfig) {
    return null;
  }

  return aiModelConfig[modelProvider];
}

export async function saveModelProviderConfig(
  modelProvider: ModelProvider,
  config: Record<string, any>
): Promise<void> {
  const aiModelConfig = await readAIModelConfig();

  if (!aiModelConfig) {
    await chrome.storage.local.set({
      [STORAGE_FIELD_AI_MODEL_CONFIG]: {
        [STORAGE_FIELD_MODEL_PROVIDER]: modelProvider,
        [modelProvider]: {
          ...config,
        },
      },
    });
  } else {
    await chrome.storage.local.set({
      [STORAGE_FIELD_AI_MODEL_CONFIG]: {
        ...aiModelConfig,
        [STORAGE_FIELD_MODEL_PROVIDER]: modelProvider,
        [modelProvider]: {
          ...config,
        },
      },
    });
  }
}
