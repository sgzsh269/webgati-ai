import { useEffect } from "react";

export function useStorageOnChanged(
  callback: (changes: Record<string, chrome.storage.StorageChange>) => void
): void {
  useEffect(() => {
    const listener = (changes: any) => {
      if (changes) {
        const filteredChanges: typeof changes = {};
        for (const [key, change] of Object.entries<any>(changes)) {
          if (change.newValue !== undefined) {
            filteredChanges[key] = {
              oldValue: change.oldValue,
              newValue: change.newValue,
            };
          }
        }
        callback(filteredChanges);
      }
    };

    chrome.storage.local.onChanged.addListener(listener);
    return () => {
      chrome.storage.local.onChanged.removeListener(listener);
    };
  }, [callback]);
}
