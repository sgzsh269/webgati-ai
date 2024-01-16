import React, { useCallback, useEffect } from "react";
import { useSelectionDialog } from "../utils/hooks";
import { SelectionDialog } from "./SelectionDialog";
import { PageSnipTool } from "./PageSnipTool";
import { useContentScriptMessageListener } from "../utils/hooks/useContentScriptMessageListener";
import { generatePageMarkdown } from "../utils/markdown";
import {
  AppMessageCheckSidePanelVisible,
  AppMessageGetWebpage,
  AppMessageImageCapture,
  AppMessageSelectionPrompt,
} from "../utils/types";

const SELECTION_DEBOUNCE_DELAY_MS = 800;

export function ContentScriptApp(): JSX.Element {
  const [showSelectionDialog, setShowSelectionDialog] = React.useState(false);
  const [showPageSnipTool, setShowPageSnipTool] = React.useState(false);

  const { selection } = useSelectionDialog(SELECTION_DEBOUNCE_DELAY_MS);

  const checkAndInitSelectionDialog = useCallback(async () => {
    try {
      const result =
        await chrome.runtime.sendMessage<AppMessageCheckSidePanelVisible>({
          type: "cs_check-side-panel-visible",
        });

      if (result) {
        setShowSelectionDialog(true);
      }
    } catch (error) {
      // no-op
    }
  }, []);

  useEffect(() => {
    if (selection) {
      checkAndInitSelectionDialog();
    }
  }, [selection, checkAndInitSelectionDialog]);

  const handleSelectionDialogSubmit = useCallback((prompt: string) => {
    setShowSelectionDialog(false);
    chrome.runtime.sendMessage<AppMessageSelectionPrompt>({
      type: "cs_selection-prompt",
      payload: {
        prompt,
      },
    });
  }, []);

  const handlePageSnipToolImage = useCallback((imageData: string) => {
    setShowPageSnipTool(false);
    chrome.runtime.sendMessage<AppMessageImageCapture>({
      type: "cs_image-capture",
      payload: {
        imageData,
      },
    });
  }, []);

  const handleStartPageSnipTool = useCallback(() => {
    setShowPageSnipTool(true);
  }, []);

  const handleGetWebPage = useCallback(
    async (usageType: AppMessageGetWebpage["payload"]["usageType"]) => {
      return generatePageMarkdown(usageType);
    },
    []
  );

  useContentScriptMessageListener(handleStartPageSnipTool, handleGetWebPage);

  return (
    <>
      <SelectionDialog
        show={showSelectionDialog}
        selection={selection}
        onSubmit={handleSelectionDialogSubmit}
        onClose={() => setShowSelectionDialog(false)}
      />
      <PageSnipTool show={showPageSnipTool} onImage={handlePageSnipToolImage} />
    </>
  );
}
