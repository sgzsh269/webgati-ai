import { useEffect } from "react";
import { SWMessage } from "../types";

export function useToggleSidePanel(onToggleSidePanel: () => void): void {
  useEffect(() => {
    const handleMessage = (message: SWMessage) => {
      if (message.type === "toggle-side-panel") {
        onToggleSidePanel();
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [onToggleSidePanel]);
}
