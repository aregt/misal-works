import { defineConfig } from "vite";
import { misalBlogPlugin } from "./scripts/blog-plugin.mjs";

export default defineConfig({
  base: "./",
  plugins: [misalBlogPlugin()],
});
