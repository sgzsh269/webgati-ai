import { useEffect } from "react";
import { EXTENSION_Z_INDEX } from "../utils/constants";
import { AppMessageCaptureVisibleScreen } from "../utils/types";

interface PageSnipToolProps {
  show: boolean;
  onImage: (imageData: string) => void;
}

export function PageSnipTool({ show, onImage }: PageSnipToolProps): null {
  useEffect(() => {
    if (show) {
      startClipTool(onImage);
    }
  });

  return null;
}

function startClipTool(onImage: (imageData: string) => void) {
  let startX: number, startY: number, currentX: number, currentY: number;
  let dragging = false;

  document.body.style.cursor = "crosshair";

  // Create a label attached to the cursor
  const label = document.createElement("div");
  label.style.position = "absolute";
  label.style.zIndex = `${EXTENSION_Z_INDEX}`;
  label.style.color = "white";
  label.style.backgroundColor = "black";
  label.style.padding = "2px";
  label.innerHTML =
    "Webgati AI Snip Tool <br/> Click and Drag cursor to select an area";
  document.body.appendChild(label);

  // Create background overlay
  const background = document.createElement("div");
  background.style.position = "absolute";
  background.style.top = "0";
  background.style.left = "0";
  background.style.width = "100%";
  background.style.height = document.documentElement.scrollHeight + "px";
  background.style.backgroundColor = "rgba(0, 0, 255, 0.05)";
  background.style.zIndex = `${EXTENSION_Z_INDEX}`;
  document.body.appendChild(background);

  // Create the bounding box element
  const boundingBox = document.createElement("div");
  boundingBox.style.position = "absolute";
  boundingBox.style.border = "4px dotted red";
  boundingBox.style.display = "none";
  document.body.appendChild(boundingBox);

  // Function to update the overlay's dimensions
  function updateBoundingBox() {
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const width = Math.abs(startX - currentX);
    const height = Math.abs(startY - currentY);

    boundingBox.style.left = x + "px";
    boundingBox.style.top = y + "px";
    boundingBox.style.width = width + "px";
    boundingBox.style.height = height + "px";
  }

  // Mouse down event to start the drag
  document.addEventListener("mousedown", function (e) {
    startX = e.pageX;
    startY = e.pageY;
    currentX = startX;
    currentY = startY;
    dragging = true;
    boundingBox.style.display = "block";
    updateBoundingBox();

    label.remove();
  });

  // Mouse move event to update the overlay size
  document.addEventListener("mousemove", function (e) {
    label.style.left = e.pageX + 4 + "px";
    label.style.top = e.pageY + 4 + "px";

    if (!dragging) return;
    currentX = e.pageX;
    currentY = e.pageY;
    updateBoundingBox();
  });

  // Mouse up event to finalize the selection
  document.addEventListener("mouseup", async function () {
    const bounds = boundingBox.getBoundingClientRect();

    if (!dragging || bounds.width === 0) return;

    dragging = false;

    document.body.style.cursor = "default";
    boundingBox.remove();
    background.remove();

    const imageData = await new Promise<string>((resolve) => {
      setTimeout(async () => {
        chrome.runtime.sendMessage<AppMessageCaptureVisibleScreen>(
          {
            type: "cs_capture-visible-screen",
          },
          (imageData) => {
            resolve(imageData);
          }
        );
      }, 1000);
    });

    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set canvas size to the size of the selected area
      canvas.width = bounds.width;
      canvas.height = bounds.height;

      // Calculate the ratio of the original image to the canvas
      const ratioX = img.width / window.innerWidth;
      const ratioY = img.height / window.innerHeight;

      // Adjust the bounds for the ratio
      const sourceX = bounds.left * ratioX;
      const sourceY = bounds.top * ratioY;
      const sourceWidth = bounds.width * ratioX;
      const sourceHeight = bounds.height * ratioY;

      // Draw and crop the image on the canvas
      ctx?.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Convert the canvas image to a data URL
      const dataURL = canvas.toDataURL("image/jpeg");
      onImage(dataURL);
    };
    img.src = imageData;
  });
}
