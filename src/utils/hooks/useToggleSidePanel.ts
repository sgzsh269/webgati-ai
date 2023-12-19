import { useEffect, useState } from "react";
import { SWMessage } from "../types";

export function useToggleSidePanel(): {
  showSidePanel: boolean;
  setShowSidePanel: React.Dispatch<boolean>;
} {
  const [showSidePanel, setShowSidePanel] = useState<boolean>(false);

  useEffect(() => {
    const handleMessage = (message: SWMessage) => {
      if (message.type === "toggle-side-panel") {
        setShowSidePanel((prevDisplay) => !prevDisplay);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return { showSidePanel, setShowSidePanel };
}
