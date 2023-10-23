import React from "react";
import { useClipboard } from "@mantine/hooks";
import { ActionButton } from "./ActionButton";
import { useContext } from "react";
import { AppContext } from "../../utils/app-context";

export function CopyWebpageMarkdown(): JSX.Element {
  const { webpageMarkdown } = useContext(AppContext);

  const clipboard = useClipboard({ timeout: 500 });

  const handleClick = () => {
    clipboard.copy(webpageMarkdown);
  };

  return (
    <ActionButton
      label="Copy webpage in markdown format"
      onClick={handleClick}
      notificationMessage="Copied to clipboard!"
      errorMessage={
        !webpageMarkdown
          ? "ERROR: Webpage not copied, has not been analyzed as yet."
          : undefined
      }
      isLoading={clipboard.copied}
      disabled={!webpageMarkdown}
    />
  );
}
