import { useEffect } from "react";
import { AppMessage } from "../types";

export function useSidePanelMessageListener(
  tabId: number | null,
  onUrlChange: () => void,
  onSelectionPrompt: (prompt: string) => void,
  onImageCapture: (imageData: string) => void
): void {
  useEffect(() => {
    if (!tabId) {
      return;
    }

    const listener = (
      message: AppMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: any) => void
    ) => {
      const messageType = message.type;

      if (messageType.includes("sw")) {
        if (
          messageType === "sw_url-change" &&
          message.payload.tabId === tabId
        ) {
          onUrlChange();
          sendResponse("OK");
        }
      } else {
        if (sender.tab?.id === tabId) {
          switch (messageType) {
            case "cs_selection-prompt":
              onSelectionPrompt(message.payload.prompt);
              sendResponse("OK");
              break;
            case "cs_image-capture":
              onImageCapture(message.payload.imageData);
              sendResponse("OK");
              break;
          }
        }
      }

      return true;
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [tabId, onUrlChange, onSelectionPrompt, onImageCapture]);
}
