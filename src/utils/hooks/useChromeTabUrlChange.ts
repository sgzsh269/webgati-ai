import { useEffect, useRef } from "react";
import { SWMessage } from "../types";

export function useChromeTabUrlChange(callback: () => void): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const listener = (message: SWMessage) => {
      if (message.type === "url-change") {
        callbackRef.current();
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);
}
