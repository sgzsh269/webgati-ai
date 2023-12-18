import React from "react";
import { AppContextType } from "./types";

export const AppContext = React.createContext<AppContextType>({
  swPort: null,
  webpageMarkdown: "",
  modelProvider: null,
  analyzeWebpage: async () => {},
  clearChatContext: async () => {},
});
