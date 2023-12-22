import { STORAGE_FIELD_AI_MODEL_CONFIG } from "./constants";
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
