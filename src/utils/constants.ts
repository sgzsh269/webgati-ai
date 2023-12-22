import { AIModelConfig } from "./types";

const manifest = chrome.runtime.getManifest();

export const APP_NAME = manifest.name;
const ELEMENT_NAME = APP_NAME.toLowerCase()
  .replace(/ /g, "-")
  // eslint-disable-next-line no-useless-escape
  .replace(/[\[\]]/g, "");

export const SIDE_PANEL_WIDTH = 400;

export const STORAGE_FIELD_AI_MODEL_CONFIG = "aiModelConfig";

export const CHATBOT_ROOT_ID = `${ELEMENT_NAME}-chatbot-root`;
export const CHATBOT_SHADOW_ROOT_ID = `${ELEMENT_NAME}-chatbot-shadow-root`;

export const SELECTION_DIALOG_ROOT_ID = `${ELEMENT_NAME}-selection-dialog-root`;
export const SELECTION_DIALOG_SHADOW_ROOT_ID = `${ELEMENT_NAME}-selection-dialog-shadow-root`;

export const MODEL_PROVIDER_OPENAI = "openai";
export const OPENAI_MODEL_ID_GPT3 = "openai_gpt-3";
export const OPENAI_MODEL_ID_GPT4 = "openai_gpt-4";

export const MODEL_PROVIDER_ANTHROPIC = "anthropic";
export const ANTHROPIC_MODEL_ID_CLAUDE_2 = "anthropic_claude-2";
export const ANTHROPIC_MODEL_ID_CLAUDE_INSTANT = "anthropic_claude-instant";

export const MODEL_PROVIDER_OLLAMA = "ollama";
export const OLLAMA_MODEL_ID_MISTRAL = "ollama_mistral";
export const OLLAMA_DEFAULT_BASE_URL = "http://localhost:11434";

export const SUPPORTED_MODELS = [
  {
    value: OPENAI_MODEL_ID_GPT3,
    label: "OpenAI GPT-3.5",
  },
  {
    value: OPENAI_MODEL_ID_GPT4,
    label: "OpenAI GPT-4 w/ vision",
  },
  {
    value: ANTHROPIC_MODEL_ID_CLAUDE_2,
    label: "Anthropic Claude 2",
  },
  {
    value: ANTHROPIC_MODEL_ID_CLAUDE_INSTANT,
    label: "Anthropic Claude Instant",
  },
] as const;

export const VISION_COMPATIBLE_MODELS = [OPENAI_MODEL_ID_GPT4];

export const AI_MODEL_CONFIG_DEFAULT: AIModelConfig = {
  [MODEL_PROVIDER_OPENAI]: {
    models: [],
  },
  [MODEL_PROVIDER_ANTHROPIC]: {
    models: [],
  },
};
