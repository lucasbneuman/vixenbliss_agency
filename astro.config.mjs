// @ts-check
import node from "@astrojs/node";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.SITE_URL || "https://agency.vixenbliss.com",
  output: "server",
  adapter: node({
    mode: "standalone",
  }),
  server: {
    host: true,
    port: 4321,
  },
  vite: {
    server: {
      host: true,
    },
  },
});
