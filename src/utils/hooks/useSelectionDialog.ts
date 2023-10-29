import { useCallback, useEffect } from "react";
import { debounce, getSelectedTextPosition } from "../ui";
import { SELECTION_DIALOG_ROOT_ID } from "../constants";
import { renderSelectionDialog } from "../../chatbot/SelectionDialog";

const generateSelectionDialogPrompt = (
  selectedText: string,
  instructions: string
) => `**Selected Text:**\n${selectedText}\n**Instructions:**\n${instructions}`;

export function useSelectionDialog(
  onUserPrompt: (prompt: string) => void,
  selectionDebounceDelayMs: number
): void {
  const debouncedSelectionHandler = useCallback(
    debounce(() => {
      const selection = getSelectedTextPosition();

      if (!selection) {
        return;
      }

      const closeDialog = (): void => {
        document.querySelector(`#${SELECTION_DIALOG_ROOT_ID}`)?.remove();
      };

      const handleSubmit = (instructions: string) => {
        closeDialog();

        const prompt = generateSelectionDialogPrompt(
          selection.text,
          instructions
        );

        onUserPrompt(prompt);
      };

      closeDialog();

      renderSelectionDialog(selection, handleSubmit, closeDialog);
    }, selectionDebounceDelayMs),
    [onUserPrompt, selectionDebounceDelayMs]
  );

  useEffect(() => {
    document.addEventListener("selectionchange", debouncedSelectionHandler);

    return () => {
      document.removeEventListener(
        "selectionchange",
        debouncedSelectionHandler
      );
    };
  }, [debouncedSelectionHandler]);
}
