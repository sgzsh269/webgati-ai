import { useEffect } from "react";
import { AppMessage, AppMessageGetWebpage } from "../types";

export function useContentScriptMessageListener(
  onStartPageSnipTool: () => void,
  onGetWebpage: (
    usageType: AppMessageGetWebpage["payload"]["usageType"]
  ) => Promise<string>
): void {
  useEffect(() => {
    const handleMessage = (
      message: AppMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: any) => void
    ) => {
      switch (message.type) {
        case "sp_start-page-snip-tool":
          onStartPageSnipTool();
          sendResponse("OK");
          break;
        case "sp_get-webpage":
          onGetWebpage(message.payload.usageType).then((webpage) => {
            sendResponse(webpage);
          });
          break;
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [onStartPageSnipTool, onGetWebpage]);
}
