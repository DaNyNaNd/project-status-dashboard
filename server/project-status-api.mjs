import { collectProjectStatuses } from "../lib/project-status.mjs";

function sendJson(response, statusCode, value) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(value));
}

export function createProjectStatusApi() {
  let cachedResponse = null;
  let cachedAt = 0;
  let pendingCollection = null;
  const cacheTtl = 60_000;

  async function collect({ refresh = false } = {}) {
    const cacheIsFresh = Date.now() - cachedAt < cacheTtl;

    if (!refresh && cachedResponse && cacheIsFresh) return cachedResponse;
    if (pendingCollection) return pendingCollection;

    pendingCollection = collectProjectStatuses()
      .then((result) => {
        cachedResponse = result;
        cachedAt = Date.now();
        return result;
      })
      .finally(() => {
        pendingCollection = null;
      });

    return pendingCollection;
  }

  return {
    name: "project-status-local-api",
    configureServer(server) {
      server.middlewares.use("/api/projects", async (request, response) => {
        if (request.method !== "GET") {
          sendJson(response, 405, { error: "Method not allowed" });
          return;
        }

        try {
          const url = new URL(request.url ?? "/", "http://localhost");
          sendJson(response, 200, await collect({
            refresh: url.searchParams.get("refresh") === "1",
          }));
        } catch (error) {
          sendJson(response, 500, { error: error.message });
        }
      });
    },
  };
}
