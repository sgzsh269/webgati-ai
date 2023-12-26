import {
  STORAGE_FIELD_AI_MODEL_CONFIG,
  STORAGE_FIELD_LAST_SELECTED_MODEL_ID,
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

export async function saveAIModelConfig(
  config: Record<string, any>
): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_FIELD_AI_MODEL_CONFIG]: config,
  });
}

export async function readLastSelectedModelId(): Promise<string | null> {
  const result = await chrome.storage.local.get(
    STORAGE_FIELD_LAST_SELECTED_MODEL_ID
  );
  return result[STORAGE_FIELD_LAST_SELECTED_MODEL_ID] || null;
}

export async function saveLastSelectedModelId(
  selectedModelId: string
): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_FIELD_LAST_SELECTED_MODEL_ID]: selectedModelId,
  });
}
