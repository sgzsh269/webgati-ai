import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import defineManifest from "./manifest.config";

export default defineConfig(async ({ mode }) => {
  console.log("Env mode", mode);

  return {
    plugins: [react(), crx({ manifest: defineManifest })],
  };
});
