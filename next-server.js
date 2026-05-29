const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { execSync } = require("child_process");
const Module = require("module");

// 1. BYPASS INSPECTOR AND SWC NATIVE (Pkg compatibility)
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === "inspector" || id === "node:inspector") {
    return { open: () => {}, close: () => {}, console: console };
  }
  if (id.includes("@next/swc")) {
    return { css: { lightning: false } };
  }
  return originalRequire.apply(this, arguments);
};

// 2. FORCE SKIP SWC DOWNLOADS
process.env.NEXT_SKIP_SENTRY_SELF_STRIP = "1";

// 3. DATABASE SETUP
try {
  console.log("Checking Database and Tables...");
  execSync("node setup_db.js", { stdio: "inherit" });
  console.log("Database is ready!");
} catch (err) {
  console.log("Database check finished.");
}

const dev = false;
const app = next({ dev, conf: { distDir: ".next" } });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(3000, (err) => {
      if (err) throw err;
      console.log("> Food Lab System: http://localhost:3000");

      // Auto Open Browser
      if (process.platform === "win32") {
        require("child_process").exec("start http://localhost:3000");
      }
    });
  })
  .catch((err) => {
    console.error("Server Error:", err);
  });
