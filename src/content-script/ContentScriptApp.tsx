import React, { useEffect } from "react";
import { useSelectionDialog } from "../utils/hooks";
import { SelectionDialog } from "./SelectionDialog";
import { PageSnipTool } from "./PageSnipTool";
import { useContentScriptMessageListener } from "../utils/hooks/useContentScriptMessageListener";

const SELECTION_DEBOUNCE_DELAY_MS = 800;

export function ContentScriptApp(): JSX.Element {
  const [showSelectionDialog, setShowSelectionDialog] = React.useState(false);
  const [showPageSnipTool, setShowPageSnipTool] = React.useState(false);

  const { selection } = useSelectionDialog(SELECTION_DEBOUNCE_DELAY_MS);

  useEffect(() => {
    if (selection) {
      setShowSelectionDialog(true);
    }
  }, [selection]);

  const handleSelectionDialogSubmit = (prompt: string) => {
    setShowSelectionDialog(false);
  };

  const handlePageSnipToolImage = (imageData: string) => {
    console.log("imageData", imageData);
    setShowPageSnipTool(false);
  };

  const handleStartPageSnipTool = () => {
    setShowPageSnipTool(true);
  };

  useContentScriptMessageListener(handleStartPageSnipTool);

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
