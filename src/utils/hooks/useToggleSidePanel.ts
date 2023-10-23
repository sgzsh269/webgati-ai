import { useEffect, useState } from "react";
import { MSG_TYPE_TOGGLE_SIDE_PANEL } from "../constants";

export function useToggleSidePanel(): {
  showSidePanel: boolean;
  setShowSidePanel: React.Dispatch<boolean>;
} {
  const [showSidePanel, setShowSidePanel] = useState<boolean>(false);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === MSG_TYPE_TOGGLE_SIDE_PANEL) {
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
