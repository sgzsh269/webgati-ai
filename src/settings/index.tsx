import React from "react";
import ReactDOM from "react-dom/client";
import Settings from "./Settings";
import { MantineProvider } from "@mantine/core";
import { HashRouter } from "react-router-dom";
import { NotificationsProvider } from "@mantine/notifications";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider withNormalizeCSS withGlobalStyles>
      <HashRouter>
        <NotificationsProvider position="top-center">
          <Settings />
        </NotificationsProvider>
      </HashRouter>
    </MantineProvider>
  </React.StrictMode>
);
