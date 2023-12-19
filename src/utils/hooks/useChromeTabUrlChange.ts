import { useEffect, useRef } from "react";
import { SWMessage } from "../types";

export function useChromeTabUrlChange(callback: (url: string) => void): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const listener = (message: SWMessage) => {
      if (message.type === "url-change") {
        callbackRef.current(message.payload.url);
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);
}
