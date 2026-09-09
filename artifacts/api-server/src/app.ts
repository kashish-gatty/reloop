import path from "node:path";
import fs from "node:fs";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In production or standalone deployments (such as Render), serve the built React frontend
const candidatePaths = [
  path.resolve(process.cwd(), "artifacts/circular-india/dist/public"),
  path.resolve(import.meta.dirname, "../../circular-india/dist/public"),
  path.resolve(import.meta.dirname, "../../../artifacts/circular-india/dist/public"),
];
const clientDist = candidatePaths.find((p) => fs.existsSync(p));

if (clientDist) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.resolve(clientDist, "index.html"));
  });
}

export default app;
