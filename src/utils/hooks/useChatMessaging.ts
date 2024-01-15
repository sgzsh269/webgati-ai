import { useCallback, useEffect, useState } from "react";
import { AppMessage, AppMessageBotTokenResponse } from "../types";

export function useChatMessaging(
  tabId: number | null,
  onTabStateInit: () => void,
  onMessage: (
    payload: AppMessageBotTokenResponse["payload"],
    isDone: boolean
  ) => void
): {
  swPort: chrome.runtime.Port | null;
  isBotProcessing: boolean;
} {
  const [swPort, setSWPort] = useState<chrome.runtime.Port | null>(null);
  const [isBotProcessing, setIsBotProcessing] = useState(false);

  const handleMessage = useCallback(
    (msg: AppMessage) => {
      switch (msg.type) {
        case "sw_tab-state-init":
          onTabStateInit();
          break;
        case "sw_bot-processing":
          setIsBotProcessing(true);
          break;
        case "sw_bot-token-response":
          onMessage(msg.payload, false);
          break;
        case "sw_bot-done":
          onMessage({ queryMode: null, token: "" }, true);
          setIsBotProcessing(false);
          break;
        default:
          break;
      }
    },
    [onMessage, onTabStateInit]
  );

  useEffect(() => {
    if (!tabId) {
      return;
    }

    const connectToSW = () => {
      const port = chrome.runtime.connect({
        name: `tab-${tabId.toString()}`,
      });

      setSWPort(port);
    };

    const handleDisconnect = () => {
      swPort?.onMessage.removeListener(handleMessage);
      connectToSW();
    };

    swPort?.onMessage.addListener(handleMessage);

    swPort?.onDisconnect.addListener(handleDisconnect);

    if (swPort === null) {
      connectToSW();
    }

    return () => {
      swPort?.onMessage.removeListener(handleMessage);
      swPort?.onDisconnect.removeListener(handleDisconnect);
    };
  }, [tabId, swPort, handleMessage]);

  return { swPort, isBotProcessing };
}
