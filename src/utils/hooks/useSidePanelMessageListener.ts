import { useEffect } from "react";
import { AppMessage } from "../types";

export function useSidePanelMessageListener(
  onUrlChange: () => void,
  onSelectionPrompt: (prompt: string) => void,
  onImageCapture: (imageData: string) => void
): void {
  useEffect(() => {
    const listener = (
      message: AppMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: any) => void
    ) => {
      switch (message.type) {
        case "sw_url-change":
          onUrlChange();
          sendResponse("OK");
          break;
        case "cs_selection-prompt":
          onSelectionPrompt(message.payload.prompt);
          sendResponse("OK");
          break;
        case "cs_image-capture":
          onImageCapture(message.payload.imageData);
          sendResponse("OK");
          break;
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [onUrlChange, onSelectionPrompt, onImageCapture]);
}
