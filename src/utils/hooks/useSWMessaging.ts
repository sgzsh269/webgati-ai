import { useEffect, useState } from "react";
import {
  MSG_TYPE_BOT_DONE,
  MSG_TYPE_BOT_PROCESSING,
  MSG_TYPE_BOT_TOKEN_RESPONSE,
  MSG_TYPE_KEEP_ALIVE,
} from "../constants";
import { SWMessage, SWMessagePayloadToken } from "../types";

const SW_CONNECTION_INTERVAL = 15 * 1000;

export function useSWMessaging(
  tabId: number | null,
  url: string | null,
  onPayload: (payload: SWMessagePayloadToken, error?: string) => void
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

    const processTokenPayload = (payload: SWMessagePayloadToken) => {
      onPayload(payload);
    };

    const handleMessage = (msg: SWMessage) => {
      switch (msg.type) {
        case MSG_TYPE_BOT_PROCESSING:
          setIsBotProcessing(true);
          break;
        case MSG_TYPE_BOT_TOKEN_RESPONSE:
          processTokenPayload(msg.payload);
          break;
        case MSG_TYPE_BOT_DONE:
          processTokenPayload({ token: "", isEnd: true });
          setIsBotProcessing(false);
          break;
        default:
          break;
      }
    };

    const swKeepAlive = async () => {
      await chrome.runtime.sendMessage({ type: MSG_TYPE_KEEP_ALIVE });
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
  }, [tabId, url, onPayload]);

  return { swPort, isBotProcessing };
}
