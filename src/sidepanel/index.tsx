import React from "react";
import ReactDOM from "react-dom/client";
import { SidePanel } from "./SidePanel";
import { MantineProvider } from "@mantine/core";
import { globalTheme } from "../utils/theme";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <MantineProvider theme={globalTheme} withNormalizeCSS withGlobalStyles>
    <SidePanel />
  </MantineProvider>
);
