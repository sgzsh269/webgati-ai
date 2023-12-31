export function debounce(
  func: (...args: any[]) => void,
  delay: number
): (...args: any[]) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: any[]) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(args), delay);
  };
}

export function getSelectedTextPosition(): {
  text: string;
  top: number;
  left: number;
  bottom: number;
  right: number;
} | null {
  const selection = window.getSelection();

  if (
    !selection ||
    selection.toString().length === 0 ||
    selection.rangeCount === 0
  ) {
    return null;
  }

  if (selection.anchorNode?.nodeName.toLowerCase() === "html") {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  return {
    text: selection.toString(),
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft,
    bottom: rect.bottom + scrollTop,
    right: rect.right + scrollLeft,
  };
}

export function openSettings(): void {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL("settings.html"));
  }
}
