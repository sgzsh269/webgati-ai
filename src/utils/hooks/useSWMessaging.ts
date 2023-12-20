import { useEffect, useState } from "react";
import {
  SWMessage,
  SWMessageBotTokenResponse,
  SWMessageKeepAlive,
} from "../types";

const SW_CONNECTION_INTERVAL = 15 * 1000;

export function useSWMessaging(
  showSidePanel: boolean,
  tabId: number | null,
  url: string | null,
  onMessage: (
    payload: SWMessageBotTokenResponse["payload"],
    isDone: boolean
  ) => void
): {
  swPort: chrome.runtime.Port | null;
  isBotProcessing: boolean;
} {
  const [swPort, setSWPort] = useState<chrome.runtime.Port | null>(null);
  const [isBotProcessing, setIsBotProcessing] = useState(false);

  useEffect(() => {
    if (!showSidePanel || !tabId) {
      return;
    }

    let swKeepAliveInterval: NodeJS.Timeout | null = null;
    let port: chrome.runtime.Port | null = null;

    const connectToSW = () => {
      if (port) {
        port.disconnect();
      }

      port = chrome.runtime.connect({
        name: `tab-${tabId?.toString()}`,
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

    const handleMessage = (msg: SWMessage) => {
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
      await chrome.runtime.sendMessage<SWMessageKeepAlive>({
        type: "keep-alive",
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
  }, [showSidePanel, tabId, url, onMessage]);

  return { swPort, isBotProcessing };
}
