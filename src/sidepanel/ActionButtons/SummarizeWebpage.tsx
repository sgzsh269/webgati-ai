import React, { useState } from "react";
import { ActionButton } from "./ActionButton";
import { useContext } from "react";
import { AppContext } from "../../utils/app-context";
import { AppMessageBotExecute, AppMessageGetWebpage } from "../../utils/types";

export function SummarizeWebPage(): JSX.Element {
  const { swPort, tabId } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    const markdownContent = await chrome.tabs.sendMessage<AppMessageGetWebpage>(
      tabId!,
      {
        type: "sp_get-webpage",
        payload: {
          usageType: "summary",
        },
      }
    );

    swPort?.postMessage({
      type: "sp_bot-execute",
      payload: {
        queryMode: "summary",
        markdownContent,
      },
    } as AppMessageBotExecute);
    setIsLoading(false);
  };

  return (
    <ActionButton
      label={`Summarize Web Page`}
      onClick={handleClick}
      notificationMessage="Summarizing..."
      isLoading={isLoading}
      color="blue"
    />
  );
}
