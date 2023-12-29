import { useEffect } from "react";
import { AppMessage } from "../types";

export function useSidePanelMessageListener(onUrlChange: () => void): void {
  useEffect(() => {
    const listener = (message: AppMessage) => {
      if (message.type === "url-change") {
        onUrlChange();
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [onUrlChange]);
}
