import { useCallback, useEffect, useState } from "react";
import { debounce, getSelectedTextPosition } from "../ui";

export function useSelectionDialog(selectionDebounceDelayMs: number): {
  selection: ReturnType<typeof getSelectedTextPosition>;
} {
  const [selection, setSelection] = useState<ReturnType<
    typeof getSelectedTextPosition
  > | null>(null);

  const debouncedSelectionHandler = useCallback(
    debounce(() => {
      const selection = getSelectedTextPosition();

      if (!selection) {
        return;
      }

      setSelection(selection);
    }, selectionDebounceDelayMs),
    [selectionDebounceDelayMs]
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

  return { selection };
}
