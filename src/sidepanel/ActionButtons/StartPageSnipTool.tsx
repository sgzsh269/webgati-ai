import React from "react";
import { ActionButton } from "./ActionButton";
import { useContext } from "react";
import { AppContext } from "../../utils/app-context";
import { AppMessageStartPageSnipTool } from "../../utils/types";

export function StartPageSnipTool(): JSX.Element {
  const { tabId } = useContext(AppContext);

  const handleClick = async () => {
    if (!tabId) {
      return;
    }
    chrome.tabs.sendMessage<AppMessageStartPageSnipTool>(tabId, {
      type: "start-page-snip-tool",
    });
  };

  return (
    <ActionButton
      label="Select using Snip Tool"
      onClick={handleClick}
      notificationMessage=""
      isLoading={false}
    />
  );
}
