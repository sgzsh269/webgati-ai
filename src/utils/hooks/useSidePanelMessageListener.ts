import { useEffect } from "react";
import { AppMessage } from "../types";

export function useSidePanelMessageListener(
  onUrlChange: () => void,
  onSelectionPrompt: (prompt: string) => void,
  onImageCapture: (imageData: string) => void
): void {
  useEffect(() => {
    const listener = (message: AppMessage) => {
      switch (message.type) {
        case "sw_url-change":
          onUrlChange();
          break;
        case "cs_selection-prompt":
          onSelectionPrompt(message.payload.prompt);
          break;
        case "cs_image-capture":
          onImageCapture(message.payload.imageData);
          break;
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [onUrlChange]);
}
