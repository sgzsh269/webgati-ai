import React from "react";
import { ActionButton } from "./ActionButton";
import { useContext } from "react";
import { AppContext } from "../../utils/app-context";
import { MSG_TYPE_SUMMARIZE_WEBPAGE } from "../../utils/constants";
import { generatePageMarkdown } from "../../utils/markdown";

export function SummarizeWebPage(): JSX.Element {
  const { swPort, webpageMarkdown } = useContext(AppContext);

  const handleClick = async () => {
    const markdownContent = await generatePageMarkdown("summary");

    swPort?.postMessage({
      type: MSG_TYPE_SUMMARIZE_WEBPAGE,
      payload: {
        markdownContent,
      },
    });
  };

  return (
    <ActionButton
      label={`Summarize Web Page`}
      onClick={handleClick}
      notificationMessage=""
      isLoading={false}
      color="blue"
      disabled={!webpageMarkdown}
    />
  );
}
