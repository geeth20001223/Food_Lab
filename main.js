const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { fork } = require("child_process");
const http = require("http");
require("dotenv").config();

let serverProcess = null;
let mainWindow = null;

const APP_ROOT = app.getAppPath();
const SERVER_SCRIPT = path.join(APP_ROOT, "server.js");

function waitForServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function tryConnect() {
      http
        .get(url, (res) => {
          if (res.statusCode < 500) {
            resolve();
          } else {
            retry();
          }
        })
        .on("error", retry);
    }

    function retry() {
      if (Date.now() - startTime > timeout) {
        reject(new Error("Next.js server startup timed out."));
      } else {
        setTimeout(tryConnect, 500);
      }
    }

    tryConnect();
  });
}

function startServer() {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PORT: "3000",
      NODE_ENV: "production",
      NEXT_MANUAL_SIG_HANDLE: "true",
    };

    console.log("Starting Next.js server...");
    console.log("APP_ROOT:", APP_ROOT);
    console.log("SERVER_SCRIPT:", SERVER_SCRIPT);

    serverProcess = fork(SERVER_SCRIPT, [], {
      cwd: APP_ROOT,
      env,
      silent: true,
    });

    let finished = false;

    if (serverProcess.stdout) {
      serverProcess.stdout.on("data", (data) => {
        console.log("[Next.js]", data.toString().trim());
      });
    }

    if (serverProcess.stderr) {
      serverProcess.stderr.on("data", (data) => {
        console.error("[Next.js Error]", data.toString().trim());
      });
    }

    serverProcess.on("error", (err) => {
      if (!finished) {
        finished = true;
        reject(err);
      }
    });

    serverProcess.on("exit", (code) => {
      if (!finished && code !== 0) {
        finished = true;
        reject(new Error(`Server process exited with code ${code}`));
      }
    });

    waitForServer("http://127.0.0.1:3000", 30000)
      .then(() => {
        if (!finished) {
          finished = true;
          resolve();
        }
      })
      .catch((err) => {
        if (!finished) {
          finished = true;
          reject(err);
        }
      });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    backgroundColor: "#ffffff",
    icon: path.join(APP_ROOT, "public", "icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("http://127.0.0.1:3000");

  // Intercept window.open calls to open reports in system default web browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes("/api/view-report")) {
      require("electron").shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function cleanup() {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {
      console.error("Error while killing server process:", e.message);
    }
    serverProcess = null;
  }
}

function runDatabaseSetup() {
  return new Promise((resolve, reject) => {
    const setupScript = path.join(APP_ROOT, "setup_db.js");
    console.log("Running database setup script:", setupScript);

    const setupProcess = fork(setupScript, [], {
      cwd: APP_ROOT,
      env: process.env,
      silent: true,
    });

    setupProcess.stdout.on("data", (data) => {
      console.log("[DB Setup]", data.toString().trim());
    });

    setupProcess.stderr.on("data", (data) => {
      console.error("[DB Setup Error]", data.toString().trim());
    });

    setupProcess.on("exit", (code) => {
      if (code === 0) {
        console.log("Database setup finished successfully.");
        resolve();
      } else {
        reject(new Error(`Database setup failed with exit code ${code}`));
      }
    });

    setupProcess.on("error", (err) => {
      reject(err);
    });
  });
}

app.whenReady().then(async () => {
  try {
    console.log("Initializing Food Lab System...");

    // Run database setup first
    await runDatabaseSetup();

    // Then start the server
    await startServer();
    createWindow();
  } catch (err) {
    console.error("Startup Error:", err);

    dialog.showErrorBox(
      "Startup Error",
      `The application failed to start.\n\nDetails: ${
        err.message
      }\n\nPlease check:\n1. XAMPP MySQL is running\n2. Database '${process.env.DB_NAME || "food_lab_system"}' exists\n3. SQL dump is imported correctly`,
    );

    cleanup();
    app.quit();
  }
});

app.on("window-all-closed", () => {
  cleanup();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  cleanup();
});
