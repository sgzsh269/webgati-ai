import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider, createEmotionCache } from "@mantine/core";
import {
  WEBGATI_AI_ROOT_ID,
  WEBGATI_AI_SHADOW_ROOT_ID,
} from "../utils/constants";
import { globalTheme } from "../utils/theme";
import { ContentScriptApp } from "./ContentScriptApp";

const root = document.createElement(WEBGATI_AI_ROOT_ID);
root.id = WEBGATI_AI_ROOT_ID;
root.style.visibility = "visible";
root.style.display = "block";

document.documentElement.appendChild(root);

const shadowRoot = root.attachShadow({ mode: "open" });
const shadowRootDiv = document.createElement("div");
shadowRootDiv.style.height = "100%";

const emotionRoot = document.createElement("div");

shadowRootDiv.id = WEBGATI_AI_SHADOW_ROOT_ID;
shadowRoot.appendChild(emotionRoot);
shadowRoot.appendChild(shadowRootDiv);

const emotionCache = createEmotionCache({
  key: "mantine-shadow",
  container: emotionRoot,
});

ReactDOM.createRoot(shadowRootDiv).render(
  <MantineProvider theme={globalTheme} emotionCache={emotionCache}>
    <ContentScriptApp />
  </MantineProvider>
);
