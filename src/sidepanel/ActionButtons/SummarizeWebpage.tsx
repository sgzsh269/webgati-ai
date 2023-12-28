import React, { useState } from "react";
import { ActionButton } from "./ActionButton";
import { useContext } from "react";
import { AppContext } from "../../utils/app-context";
import { generatePageMarkdown } from "../../utils/markdown";
import { SWMessageBotExecute } from "../../utils/types";

export function SummarizeWebPage(): JSX.Element {
  const { swPort } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    const markdownContent = await generatePageMarkdown("summary");

    swPort?.postMessage({
      type: "bot-execute",
      payload: {
        queryMode: "summary",
        markdownContent,
      },
    } as SWMessageBotExecute);
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
