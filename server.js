const http = require("node:http");
const path = require("node:path");
const { readFile } = require("node:fs/promises");

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.join(__dirname, ".env"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const supabase = require("./supabase");

const host = "127.0.0.1";
const port = Number(process.env.PORT) || 8000;
const projectDirectory = __dirname;
const htmlPath = path.join(projectDirectory, "pccp_week1.html");
const week2Path = path.join(projectDirectory, "week2_data.json");
const databaseId = "week1";
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
  const { data, error } = await supabase
    .from("pccp_databases")
    .select("document")
    .eq("id", databaseId)
    .single();

  if (error) throw error;

  const document = data.document;
  if (!Array.isArray(document.checklists.week2)) {
    document.checklists.week2 = JSON.parse(await readFile(week2Path, "utf8"));
  }
  return document;
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
      const { data, error } = await supabase.rpc("update_pccp_progress", {
        p_id: databaseId,
        p_progress: progress
      });

      if (error) throw error;
      result = data;
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
      await readDatabase();
      sendJson(response, 200, { ok: true, database: "supabase" });
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
