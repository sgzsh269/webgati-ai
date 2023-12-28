// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { defineManifest } from "@crxjs/vite-plugin";

import packageJson from "./package.json";

const APP_NAME = "Webgati AI";

const { version } = packageJson;

const [major, minor, patch] = version.replace(/[^\d.-]+/g, "").split(/[.-]/);

const icons = {
  "16": "icon.png",
  "32": "icon.png",
  "48": "icon.png",
  "128": "icon.png",
};

export default defineManifest(async (env) => ({
  manifest_version: 3,
  name: env.mode === "development" ? `[DEV] ${APP_NAME}` : APP_NAME,
  version: `${major}.${minor}.${patch}`,
  version_name: version,
  icons,
  action: {
    default_icon: icons,
    default_title: APP_NAME,
  },
  options_page: "settings.html",
  // content_scripts: [
  //   {
  //     js: ["src/content-script/index.tsx"],
  //     matches: ["http://*/*", "https://*/*"],
  //   },
  // ],
  background: {
    service_worker: "src/background/sw.ts",
    type: "module",
    persistent: false,
  },
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'",
  },
  host_permissions: ["<all_urls>"],
  permissions: ["activeTab", "storage", "tabs", "sidePanel"],
  web_accessible_resources: [
    {
      resources: ["settings.html"],
      matches: ["http://*/*", "https://*/*"],
    },
  ],
}));
