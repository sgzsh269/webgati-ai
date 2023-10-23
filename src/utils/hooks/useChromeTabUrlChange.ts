import { useEffect, useRef } from "react";
import { MSG_TYPE_URL_CHANGE } from "../constants";

export function useChromeTabUrlChange(callback: (url: string) => void): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === MSG_TYPE_URL_CHANGE) {
        callbackRef.current(message.payload.url);
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);
}
