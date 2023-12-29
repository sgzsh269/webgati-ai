import React from "react";
import { ActionButton } from "./ActionButton";
import { useContext, useState } from "react";
import { AppContext } from "../../utils/app-context";
import { AppMessageCaptureVisibleScreen } from "../../utils/types";

export function PageCapture(): JSX.Element {
  const { handleImageCapture } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    const imageData =
      await chrome.runtime.sendMessage<AppMessageCaptureVisibleScreen>({
        type: "any_capture-visible-screen",
      });
    handleImageCapture(imageData);
    setIsLoading(false);
  };

  return (
    <ActionButton
      label="Screenshot visible page"
      onClick={handleClick}
      notificationMessage="Page captured!"
      isLoading={isLoading}
    />
  );
}
