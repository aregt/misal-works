import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleBlogUrl, writeBlog } from "./build-blog.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function misalBlogPlugin() {
  return {
    name: "misal-blog",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const result = handleBlogUrl(req.url || "");
        if (!result) return next();
        res.statusCode = result.status;
        res.setHeader("Content-Type", result.type);
        res.end(result.body);
      });
    },
    closeBundle() {
      writeBlog(path.join(ROOT, "dist"));
    },
  };
}
