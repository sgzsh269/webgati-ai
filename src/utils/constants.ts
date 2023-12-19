const manifest = chrome.runtime.getManifest();

export const APP_NAME = manifest.name;
const ELEMENT_NAME = APP_NAME.toLowerCase()
  .replace(/ /g, "-")
  // eslint-disable-next-line no-useless-escape
  .replace(/[\[\]]/g, "");

export const SIDE_PANEL_WIDTH = 400;

export const STORAGE_FIELD_OPENAI = "openai";
export const STORAGE_FIELD_MODEL_PROVIDER = "modelProvider";
export const STORAGE_FIELD_AI_MODEL_CONFIG = "aiModelConfig";

export const CHATBOT_ROOT_ID = `${ELEMENT_NAME}-chatbot-root`;
export const CHATBOT_SHADOW_ROOT_ID = `${ELEMENT_NAME}-chatbot-shadow-root`;

export const SELECTION_DIALOG_ROOT_ID = `${ELEMENT_NAME}-selection-dialog-root`;
export const SELECTION_DIALOG_SHADOW_ROOT_ID = `${ELEMENT_NAME}-selection-dialog-shadow-root`;
