import React from "react";
import { AppContextType } from "./types";

export const AppContext = React.createContext<AppContextType>({
  tabId: null,
  swPort: null,
  webpageMarkdown: "",
  analyzeWebpage: async () => {},
  clearChatContext: async () => {},
});
