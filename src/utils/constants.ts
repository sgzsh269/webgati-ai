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

export const MSG_TYPE_TOGGLE_SIDE_PANEL = "toggle-side-panel";
export const MSG_TYPE_URL_CHANGE = "url-change";
export const MSG_TYPE_GET_TAB_ID = "get-tab-id";
export const MSG_TYPE_INDEX_WEBPAGE = "index-webpage";
export const MSG_TYPE_SUMMARIZE_WEBPAGE = "summarize-webpage";
export const MSG_TYPE_BOT_EXECUTE = "bot-execute";
export const MSG_TYPE_BOT_PROCESSING = "bot-processing";
export const MSG_TYPE_BOT_TOKEN_RESPONSE = "bot-token-response";
export const MSG_TYPE_BOT_DONE = "bot-done";
export const MSG_TYPE_BOT_STOP = "bot-stop";
export const MSG_TYPE_BOT_CLEAR_MEMORY = "bot-clear-memory";
export const MSG_TYPE_KEEP_ALIVE = "keep-alive";
