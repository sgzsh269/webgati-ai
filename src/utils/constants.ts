import { AIModelConfig } from "./types";

const manifest = chrome.runtime.getManifest();

export const APP_NAME = manifest.name;
const ELEMENT_NAME = APP_NAME.toLowerCase()
  .replace(/ /g, "-")
  // eslint-disable-next-line no-useless-escape
  .replace(/[\[\]]/g, "");

export const SIDE_PANEL_WIDTH = 400;
export const EXTENSION_Z_INDEX = 2147483600;

export const STORAGE_FIELD_AI_MODEL_CONFIG = "aiModelConfig";
export const STORAGE_FIELD_LAST_SELECTED_MODEL_ID = "lastSelectedModelId";

export const CHATBOT_ROOT_ID = `${ELEMENT_NAME}-chatbot-root`;
export const CHATBOT_SHADOW_ROOT_ID = `${ELEMENT_NAME}-chatbot-shadow-root`;

export const SELECTION_DIALOG_ROOT_ID = `${ELEMENT_NAME}-selection-dialog-root`;
export const SELECTION_DIALOG_SHADOW_ROOT_ID = `${ELEMENT_NAME}-selection-dialog-shadow-root`;

export const MODEL_PROVIDER_OPENAI = "openai";
export const MODEL_PROVIDER_ANTHROPIC = "anthropic";

export const MODEL_PROVIDER_OLLAMA = "ollama";
export const OLLAMA_DEFAULT_BASE_URL = "http://localhost:11434";

export const AI_MODEL_CONFIG_DEFAULT: AIModelConfig = {
  [MODEL_PROVIDER_OPENAI]: {
    chatModels: [
      {
        label: "OpenAI GPT-3.5",
        modelName: "gpt-3.5-turbo",
        maxOutputTokens: undefined,
        temperature: 0,
        hasVision: false,
      },
      {
        label: "OpenAI GPT-4 w/ vision",
        modelName: "gpt-4-vision-preview",
        maxOutputTokens: 4096,
        temperature: 0,
        hasVision: true,
      },
    ],
  },
  [MODEL_PROVIDER_ANTHROPIC]: {
    chatModels: [
      {
        label: "Anthropic Claude 2",
        modelName: "claude-2.1",
        maxOutputTokens: 4096,
        temperature: 0,
        hasVision: false,
      },
      {
        label: "Anthropic Claude Instant",
        modelName: "claude-instant-1.2",
        maxOutputTokens: 4096,
        temperature: 0,
        hasVision: false,
      },
    ],
  },
  [MODEL_PROVIDER_OLLAMA]: {
    baseUrl: OLLAMA_DEFAULT_BASE_URL,
    chatModels: [
      {
        label: "[Local] Ollama Mistral",
        modelName: "mistral",
        maxOutputTokens: undefined,
        temperature: 0,
        hasVision: false,
      },
      {
        label: "[Local] Ollama Bakllava",
        modelName: "bakllava",
        maxOutputTokens: undefined,
        temperature: 0,
        hasVision: true,
      },
    ],
  },
};
