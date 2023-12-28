import { useEffect } from "react";
import { SWMessage } from "../types";

export function useContentScriptMessageListener(
  onStartPageSnipTool: () => void
): void {
  useEffect(() => {
    const handleMessage = (message: SWMessage, sender, sendResponse) => {
      if (message.type === "start-page-snip-tool") {
        onStartPageSnipTool();
        sendResponse("OK");
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [onStartPageSnipTool]);
}
