import { useEffect, useState } from "react";
import {
  MSG_TYPE_BOT_DONE,
  MSG_TYPE_BOT_PROCESSING,
  MSG_TYPE_BOT_TOKEN_RESPONSE,
} from "../constants";
import { SWMessage, SWMessagePayloadToken } from "../types";

const SW_CONNECTION_INTERVAL = 3 * 60 * 1000;

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

    let swConnectionInterval: NodeJS.Timeout | null = null;
    let port: chrome.runtime.Port | null = null;

    const connectToSW = () => {
      if (port) {
        port.disconnect();
      }

      port = chrome.runtime.connect({
        name: `tab-${tabId?.toString()}`,
      });
      port?.onMessage.addListener(handleMessage);

      port?.onDisconnect.addListener(() => {
        setSWPort(null);
      });

      setSWPort(port);
    };

    const startSWConnInterval = () => {
      swConnectionInterval = setInterval(() => {
        // Reconnect to SW every 3 minutes to keep it active active by extending its timeout, ref: https://stackoverflow.com/a/73208288/4869023
        connectToSW();
      }, SW_CONNECTION_INTERVAL);
    };

    const stopSWConnInterval = () => {
      if (swConnectionInterval) {
        clearInterval(swConnectionInterval);
        swConnectionInterval = null;
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

    connectToSW();
    startSWConnInterval();

    return () => {
      port?.onMessage.removeListener(handleMessage);
      port?.disconnect();
      stopSWConnInterval();
    };
  }, [tabId, url, onPayload]);

  return { swPort, isBotProcessing };
}
