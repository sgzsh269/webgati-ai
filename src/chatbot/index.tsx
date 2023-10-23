import React from "react";
import ReactDOM from "react-dom/client";
import { Chatbot } from "./Chatbot";
import { MantineProvider, createEmotionCache } from "@mantine/core";
import { CHATBOT_ROOT_ID, CHATBOT_SHADOW_ROOT_ID } from "../utils/constants";
import { globalTheme } from "../utils/theme";

const root = document.createElement(CHATBOT_ROOT_ID);
root.id = CHATBOT_ROOT_ID;
root.style.visibility = "visible";
root.style.display = "block";

document.documentElement.appendChild(root);

const shadowRoot = root.attachShadow({ mode: "open" });
const shadowRootDiv = document.createElement("div");
shadowRootDiv.style.height = "100%";

const emotionRoot = document.createElement("div");

shadowRootDiv.id = CHATBOT_SHADOW_ROOT_ID;
shadowRoot.appendChild(emotionRoot);
shadowRoot.appendChild(shadowRootDiv);

const emotionCache = createEmotionCache({
  key: "mantine-shadow",
  container: emotionRoot,
});

ReactDOM.createRoot(shadowRootDiv).render(
  <React.StrictMode>
    <MantineProvider theme={globalTheme} emotionCache={emotionCache}>
      <Chatbot />
    </MantineProvider>
  </React.StrictMode>
);
