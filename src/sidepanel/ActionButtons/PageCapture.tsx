import React from "react";
import { ActionButton } from "./ActionButton";
import { useContext, useState } from "react";
import { AppContext } from "../../utils/app-context";
import html2canvas from "html2canvas";

export function PageCapture(): JSX.Element {
  const { setImageData } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    const canvas = await html2canvas(document.body, { useCORS: true });
    const imgData = canvas.toDataURL("image/jpeg");
    setImageData(imgData);
    setIsLoading(false);
  };

  return (
    <ActionButton
      label="Capture entire page"
      onClick={handleClick}
      notificationMessage="Page captured!"
      isLoading={isLoading}
    />
  );
}
