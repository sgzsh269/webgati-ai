import React from "react";
import { ActionButton } from "./ActionButton";
import { useContext, useState } from "react";
import { AppContext } from "../../utils/app-context";

export function AnalyzeWebpage(): JSX.Element {
  const { webpageMarkdown, analyzeWebpage } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    await analyzeWebpage();
    setIsLoading(false);
  };

  return (
    <ActionButton
      label={`${webpageMarkdown ? "Re-analyze" : "Analyze"} webpage for chat`}
      onClick={handleClick}
      notificationMessage="Webpage analyzed!"
      isLoading={isLoading}
    />
  );
}
