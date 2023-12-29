import { useEffect, useState } from "react";
import {
  AppMessage,
  AppMessageBotTokenResponse,
  AppMessageKeepAlive,
} from "../types";

const SW_CONNECTION_INTERVAL = 15 * 1000;

export function useChatMessaging(
  tabId: number | null,
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

  useEffect(() => {
    if (!tabId) {
      return;
    }

    let swKeepAliveInterval: NodeJS.Timeout | null = null;
    let port: chrome.runtime.Port | null = null;

    const connectToSW = () => {
      if (port) {
        port.disconnect();
      }

      port = chrome.runtime.connect({
        name: `tab-${tabId.toString()}`,
      });

      port?.onMessage.addListener(handleMessage);

      port?.onDisconnect.addListener(handleDisconnect);

      setSWPort(port);
    };

    const startSWKeepAliveInterval = () => {
      swKeepAliveInterval = setInterval(() => {
        // Send keep alive message every 15 sec to reset service worker's 30 sec idle timer, ref: https://developer.chrome.com/blog/longer-esw-lifetimes/
        swKeepAlive();
      }, SW_CONNECTION_INTERVAL);
    };

    const stopSWKeepAliveInterval = () => {
      if (swKeepAliveInterval) {
        clearInterval(swKeepAliveInterval);
        swKeepAliveInterval = null;
      }
    };

    const handleMessage = (msg: AppMessage) => {
      switch (msg.type) {
        case "bot-processing":
          setIsBotProcessing(true);
          break;
        case "bot-token-response":
          onMessage(msg.payload, false);
          break;
        case "bot-done":
          onMessage({ token: "" }, true);
          setIsBotProcessing(false);
          break;
        default:
          break;
      }
    };

    const swKeepAlive = async () => {
      await chrome.runtime.sendMessage<AppMessageKeepAlive>({
        type: "sp_keep-alive",
      });
    };

    const handleDisconnect = () => {
      connectToSW();
    };

    connectToSW();
    startSWKeepAliveInterval();

    return () => {
      port?.onMessage.removeListener(handleMessage);
      port?.disconnect();
      stopSWKeepAliveInterval();
    };
  }, [tabId, onMessage]);

  return { swPort, isBotProcessing };
}
