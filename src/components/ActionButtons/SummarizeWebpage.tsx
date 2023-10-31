import React, { useState } from "react";
import { ActionButton } from "./ActionButton";
import { useContext } from "react";
import { AppContext } from "../../utils/app-context";
import { MSG_TYPE_SUMMARIZE_WEBPAGE } from "../../utils/constants";
import { generatePageMarkdown } from "../../utils/markdown";

export function SummarizeWebPage(): JSX.Element {
  const { swPort, webpageMarkdown } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    const markdownContent = await generatePageMarkdown("summary");

    swPort?.postMessage({
      type: MSG_TYPE_SUMMARIZE_WEBPAGE,
      payload: {
        markdownContent,
      },
    });
    setIsLoading(false);
  };

  return (
    <ActionButton
      label={`Summarize Web Page`}
      onClick={handleClick}
      notificationMessage="Summarizing..."
      isLoading={isLoading}
      color="blue"
      disabled={!webpageMarkdown}
    />
  );
}
