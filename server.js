const http = require("node:http");
const path = require("node:path");
const { readFile, writeFile, rename } = require("node:fs/promises");

const host = "127.0.0.1";
const port = Number(process.env.PORT) || 8000;
const projectDirectory = __dirname;
const htmlPath = path.join(projectDirectory, "pccp_week1.html");
const databasePath = path.join(projectDirectory, "pccp_database.json");
const temporaryDatabasePath = path.join(projectDirectory, "pccp_database.json.tmp");
const maxBodySize = 1024 * 1024;

let writeQueue = Promise.resolve();

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(value));
}

async function readDatabase() {
  const contents = await readFile(databasePath, "utf8");
  return JSON.parse(contents);
}

function validateProgress(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    value.checked &&
    typeof value.checked === "object" &&
    value.notes &&
    typeof value.notes === "object" &&
    Array.isArray(value.errors) &&
    value.mock &&
    typeof value.mock === "object" &&
    Array.isArray(value.openDays)
  );
}

function readRequestBody(request) {
  return new Promise(function(resolve, reject) {
    let body = "";
    let tooLarge = false;

    request.setEncoding("utf8");
    request.on("data", function(chunk) {
      if (tooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body, "utf8") > maxBodySize) {
        tooLarge = true;
        reject(new Error("Request body is too large."));
      }
    });
    request.on("end", function() {
      if (!tooLarge) resolve(body);
    });
    request.on("error", reject);
  });
}

function writeProgress(progress) {
  let result;

  writeQueue = writeQueue
    .catch(function() {})
    .then(async function() {
      const database = await readDatabase();
      database.progress = progress;
      database.updatedAt = new Date().toISOString();

      const serialized = JSON.stringify(database, null, 2) + "\n";
      await writeFile(temporaryDatabasePath, serialized, "utf8");
      await rename(temporaryDatabasePath, databasePath);

      result = {
        ok: true,
        updatedAt: database.updatedAt
      };
    });

  return writeQueue.then(function() {
    return result;
  });
}

const server = http.createServer(async function(request, response) {
  const requestUrl = new URL(request.url, "http://" + request.headers.host);

  try {
    if (request.method === "GET" && requestUrl.pathname === "/api/database") {
      const database = await readDatabase();
      sendJson(response, 200, database);
      return;
    }

    if (request.method === "PUT" && requestUrl.pathname === "/api/progress") {
      const body = await readRequestBody(request);
      const progress = JSON.parse(body);

      if (!validateProgress(progress)) {
        sendJson(response, 400, { error: "Progress payload is invalid." });
        return;
      }

      const result = await writeProgress(progress);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (
      request.method === "GET" &&
      (requestUrl.pathname === "/" || requestUrl.pathname === "/pccp_week1.html")
    ) {
      const html = await readFile(htmlPath);
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache"
      });
      response.end(html);
      return;
    }

    sendJson(response, 404, { error: "Not found." });
  } catch (error) {
    console.error(error);
    if (!response.headersSent) {
      sendJson(response, 500, { error: "Unable to process the request." });
    } else {
      response.end();
    }
  }
});

server.listen(port, host, function() {
  console.log("PCCP roadmap is running at http://" + host + ":" + port);
});
