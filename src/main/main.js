'use strict';

/**
 * DJ MIDI Capture – main.js (final)
 * - Remote server with mobile page & trigger
 * - Help window
 * - Creates default save dir on first run
 * - Custom app icon
 * - IPC: app:get-version
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const fsPromises = fs.promises;
const os = require("os");
const http = require("http");
const url = require("url");
const { marked } = require("marked");

// -----------------------------
// Config
// -----------------------------
const CONFIG_PATH = path.join(app.getPath("userData"), "config.json");
const DEFAULTS = {
  lang: "en",
  saveDir: path.join(app.getPath("documents"), "DJ Captures"),
  bufferLenMs: 30000,
  forwardLenSec: 10,
  ignoreRealtime: true,
  showQRModal: true,
  showVirtualPorts: false,
  saveFormat: 'midi',
  theme: 'default-dark',
  font: 'system'
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
      return { ...DEFAULTS, ...data };
    }
  } catch (e) {
    console.error("Config load error:", e);
  }
  return { ...DEFAULTS };
}

function saveConfig(cfg) {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");
  } catch (e) {
    console.error("Config save error:", e);
  }
}

let CFG = loadConfig();

// -----------------------------
// Main window
// -----------------------------
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    title: "DJ MIDI Capture",
    icon: path.join(__dirname, "icon.png"),
    backgroundColor: '#1c1c1c', // Prevents white flash on load
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
        mainWindow.on("closed", () => { mainWindow = null; });
        mainWindow.maximize(); // Start the window maximized
  // Ensure default save directory exists on startup
  if (!fs.existsSync(CFG.saveDir)) {
    try {
      fs.mkdirSync(CFG.saveDir, { recursive: true });
      console.log(`Default save directory created at: ${CFG.saveDir}`);
    } catch (e) {
      console.error("Could not create default save directory:", e);
    }
  }

  buildMenu();
  startRemoteServer()
    .then(() => {
      broadcastRemoteInfo();
    })
    .catch(console.error);
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (mainWindow === null) createWindow(); });

// -----------------------------
// Remote server (Dynamic Port)
// -----------------------------
let remoteServer = null;
let remoteURL = null; // Will hold the full URL with the dynamic port

function getLocalIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const ni of nets[name] || []) {
      if (ni.family === "IPv4" && !ni.internal && ni.address.startsWith("192.168.")) {
        return ni.address;
      }
    }
  }
  for (const name of Object.keys(nets)) {
    for (const ni of nets[name] || []) {
      if (ni.family === "IPv4" && !ni.internal) {
        return ni.address;
      }
    }
  }
  return "127.0.0.1";
}

function getRemoteURL() {
  return remoteURL;
}

function isMobile(userAgent) {
  if (!userAgent) return false;
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

function generateRemotePageHTML(userAgent, lang) {
  const T = (en, pl) => (lang === "pl" ? pl : en);
  const remoteURL = getRemoteURL();

  if (isMobile(userAgent)) {
    return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no"/>
<title>DJ Remote Drop</title>
<style>
  :root { --bg:#181c22; --accent:#1ed760; --accent-dark:#1db954; --shadow-color:rgba(30,215,96,0.4); --text:#fff; }
  html,body{ height:100%; margin:0; padding:0; font-family:system-ui,-apple-system,sans-serif; background:var(--bg); }
  .container{ display:flex; align-items:center; justify-content:center; height:100%; padding:20px; }
  .btn{
    -webkit-tap-highlight-color: transparent;
    appearance:none; border:none; outline:none; cursor:pointer;
    width:240px; height:240px; border-radius:999px;
    background:radial-gradient(circle at 30% 30%, var(--accent), var(--accent-dark));
    color:#001a0b; font-weight:900; font-size:38px; letter-spacing:.5px;
    box-shadow:0 16px 40px var(--shadow-color), inset 0 4px 10px rgba(255,255,255,.25);
    transition: transform .06s ease;
  }
  .btn:active { transform: scale(.98); }
  .hint{ margin-top:24px; color:#a2efc3; font-size:14px; text-align:center }
  .url{ margin-top:14px; color:#cdebd9; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:12px; text-align:center; word-break:break-all }
</style>
</head>
<body>
  <div class="container">
    <div style="text-align:center">
      <button class="btn" onclick="fire()">${T("DROP","ZAPIS")}</button>
      <div class="hint">📶 ${T("Phone and PC must be on the same Wi-Fi","Telefon i komputer muszą być w tej samej sieci Wi-Fi")}</div>
      <div class="url">${remoteURL}</div>
    </div>
  </div>
<script>
  async function fire(){
    try{
      const res = await fetch('/trigger', { method:'POST' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
    }catch(e){ alert('Trigger failed: '+e.message); }
  }
</script>
</body>
</html>`;
  }

  // Desktop: QR page
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>DJ Remote Drop (Desktop)</title>
<style>
  :root { --bg:#101419; --card:#1b2028; --text:#e8eef5; }
  html,body{ height:100%; margin:0; background:var(--bg); color:var(--text); font-family:system-ui,-apple-system,sans-serif; }
  .wrap{ display:flex; align-items:center; justify-content:center; height:100%; flex-direction:column; gap:14px; }
  h1{ margin:0 0 8px 0; font-size:24px; font-weight:800; }
  .qr-box{background:var(--card);padding:16px;border-radius:12px;border:1px solid #2a323d;display:inline-block;box-shadow:0 10px 30px rgba(0,0,0,0.3);}
  .url{font-family:monospace;word-break:break-all;background:var(--card);border:1px solid #333;padding:12px;border-radius:8px;margin:20px 0;}
</style>
</head>
<body>
  <div class="wrap">
    <h1>🎛️ ${T("DJ Remote Control", "DJ Zdalne Sterowanie")}</h1>
    <p>${T("Scan this QR code with your phone.", "Zeskanuj ten kod QR telefonem.")}</p>
    <div class="qr-box">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(remoteURL)}"
           alt="QR Code" style="width:200px;height:200px;display:block"/>
    </div>
    <p>${T("Or manually enter this URL:", "Lub wpisz ręcznie ten adres:")}</p>
    <div class="url">${remoteURL}</div>
  </div>
</body></html>`;
}

async function startRemoteServer() {
  if (remoteServer && remoteServer.listening) return;

  // Wczytaj szablon remote.html RAZ przy starcie serwera
  let remoteHtmlTemplate = '';
  try {
    // Użyj logiki app.isPackaged, aby ścieżka działała w dev i po spakowaniu
    const remotePath = app.isPackaged
      ? path.join(app.getAppPath(), 'src', 'renderer', 'remote.html')
      : path.join(__dirname, '..', 'renderer', 'remote.html');

    remoteHtmlTemplate = await fsPromises.readFile(remotePath, 'utf8');
    console.log(`✅ Szablon remote.html załadowany z: ${remotePath}`);
  } catch (e) {
    console.error("❌ KRYTYCZNY BŁĄD: Nie można wczytać pliku remote.html!", e);
    // Fallback na starą stronę, jeśli plik remote.html zniknie
    remoteHtmlTemplate = generateRemotePageHTML(null, CFG.lang); 
  }

  return new Promise((resolve, reject) => {
    remoteServer = http.createServer(async (req, res) => {
      const clientIP = req.connection.remoteAddress || req.socket.remoteAddress;
      console.log(`🌐 ${req.method} ${req.url} from ${clientIP}`);

      const parsed = url.parse(req.url, true);

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      // === Trasa GET / ===
      if (req.method === "GET" && parsed.pathname === "/") {
        const userAgent = req.headers["user-agent"];

        if (isMobile(userAgent)) {
          // Telefon: Wysyłamy nowy plik remote.html z presetami
          const T = (en, pl) => (CFG.lang === "pl" ? pl : en);
          let html = remoteHtmlTemplate
            .replace("{{LANG}}", CFG.lang)
            .replace("{{DROP_TEXT}}", T("DROP", "ZAPIS"))
            .replace("{{HINT_TEXT}}", T("Phone and PC must be on the same Wi-Fi", "Telefon i komputer muszą być w tej samej sieci Wi-Fi"))
            .replace("{{URL}}", getRemoteURL() || "N/A");

          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(html);

        } else {
          // Desktop: Wysyłamy starą stronę z kodem QR
          const html = generateRemotePageHTML(userAgent, CFG.lang);
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(html);
        }
        return;
      }

      // === Trasa POST /trigger (Działający DROP) ===
      if (req.method === "POST" && parsed.pathname === "/trigger") {
        console.log("🔥 TRIGGER received!");
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("remote:trigger");
        }
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("ok");
        return;
      }

      // === NOWA Trasa POST /preset (dla presetów) ===
      if (req.method === "POST" && parsed.pathname === "/preset") {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.maxCapture !== undefined) {
              console.log(`🔥 PRESET received: ${data.maxCapture}s, ${data.preRollMs}ms pre-roll`);

              const newForwardSec = parseInt(data.maxCapture, 10) || 30;
              const newPreRollMs = parseInt(data.preRollMs, 10) || 3000;

              CFG.forwardLenSec = newForwardSec;
              CFG.preRollMs = newPreRollMs; // Assuming preRollMs is part of CFG
              saveConfig(CFG);

              if (mainWindow && !mainWindow.isDestroyed()) {
                // Wyślij polecenie do app.js, aby zaktualizował UI
                mainWindow.webContents.send("remote:setPreset", { maxCapture: newForwardSec, preRollMs: newPreRollMs });
              }
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ ok: true, received: data }));
            } else {
              throw new Error("Invalid preset data");
            }
          } catch (e) {
            console.error("Błąd parsowania JSON dla /preset:", e.message);
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Bad Request");
          }
        });
        return;
      }

      if (req.method === "GET" && parsed.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", url: getRemoteURL() }));
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    });

    remoteServer.on("error", (err) => {
      console.error("❌ Server error:", err);
  dialog.showErrorBox("Remote Server Error", `Server failed to start: ${err.message}\n\nThis might be due to a firewall blocking the connection. Please ensure your firewall allows connections to this application.`);
      remoteServer = null;
      remoteURL = null;
      reject(err);
    });

    remoteServer.listen(0, '0.0.0.0', () => { // Nasłuchuj na wszystkich interfejsach sieciowych
      const { port } = remoteServer.address();
      const host = getLocalIPv4(); // Nadal używamy getLocalIPv4 do wyświetlenia poprawnego adresu dla użytkownika
      remoteURL = `http://${host}:${port}/`;
      console.log(`✅ Serwer zdalny uruchomiony na porcie ${port}. URL: ${remoteURL}`);
      console.log(`[DIAGNOSTIC] Remote Server URL: ${remoteURL}`);
      console.log(`[DIAGNOSTIC] Local IPv4: ${getLocalIPv4()}`);
      broadcastRemoteInfo(); // Nadaj info do renderera
      resolve();
    });
  });
}

function broadcastRemoteInfo() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const port = remoteServer?.address()?.port || null;
    const info = {
      ip: getLocalIPv4(),
      port: port,
      url: getRemoteURL()
    };
    console.log("📡 Broadcasting remote info:", info);
    mainWindow.webContents.send("remote:info", info);
    mainWindow.webContents.send('diagnostic:log', `[DIAGNOSTIC] Remote URL is: ${info.url}`);
  }
}

let lastIP = getLocalIPv4();
setInterval(() => {
  const currentIP = getLocalIPv4();
  if (currentIP !== lastIP) {
    lastIP = currentIP;
    console.log(`🔄 IP changed to: ${currentIP}`);
    broadcastRemoteInfo();
  }
}, 5000);

// -----------------------------
// IPC
// -----------------------------
ipcMain.handle("app:get-version", () => app.getVersion());

ipcMain.handle("fs:getFolder", async () => CFG.saveDir);

ipcMain.handle("fs:chooseFolder", async () => {
  const res = await dialog.showOpenDialog({
    title: CFG.lang === "pl" ? "Wybierz folder zapisu" : "Choose save folder",
    properties: ["openDirectory", "createDirectory"],
    defaultPath: CFG.saveDir
  });
  if (res.canceled || !res.filePaths?.length) return null;
  CFG.saveDir = res.filePaths[0];
  saveConfig(CFG);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("settings:update", { saveDir: CFG.saveDir });
  }
  return CFG.saveDir;
});

ipcMain.handle("fs:save", async (_e, { filename, bytes }) => {
  try {
    const dir = CFG.saveDir || DEFAULTS.saveDir;
    fs.mkdirSync(dir, { recursive: true });
    const full = path.join(dir, filename);
    const buffer = Array.isArray(bytes) ? Buffer.from(bytes) : Buffer.from(new Uint8Array(bytes));
    await fs.promises.writeFile(full, buffer);
    return { ok: true, path: full };
  } catch (e) {
    console.error("fs:save error", e);
    return { ok: false, error: String(e) };
  }
});

ipcMain.handle("shell:openExternal", async (_e, target) => {
  try {
    await shell.openExternal(target);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

ipcMain.handle("i18n:getLang", async () => CFG.lang);
ipcMain.handle("i18n:setLang", async (_e, lang) => {
  CFG.lang = (lang === "pl" ? "pl" : "en");
  saveConfig(CFG);
  buildMenu();
  broadcastRemoteInfo();
  return CFG.lang;
});

ipcMain.handle("app:getSettings", async () => ({
  saveDir: CFG.saveDir,
  bufferLenMs: CFG.bufferLenMs,
  forwardLenSec: CFG.forwardLenSec,
  ignoreRealtime: CFG.ignoreRealtime,
  showQRModal: CFG.showQRModal,
  showVirtualPorts: CFG.showVirtualPorts,
  saveFormat: CFG.saveFormat,
  theme: CFG.theme,
  font: CFG.font
}));

ipcMain.handle("app:setSettings", async (_e, patch) => {
  CFG = { ...CFG, ...patch };
  saveConfig(CFG);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("settings:update", patch);
  }
  return { ok: true };
});

ipcMain.handle("remote:getInfo", async () => {
  const port = remoteServer?.address()?.port || null;
  return {
    ip: getLocalIPv4(),
    port: port,
    url: getRemoteURL()
  };
});

ipcMain.handle("remote:openDrop", async () => {
  try {
    const url = getRemoteURL();
    if (!url) throw new Error("Remote URL not available yet.");
    console.log(`🚀 Opening remote drop in external browser: ${url}`);
    await shell.openExternal(url);

    return { ok: true, url };
  } catch (e) {
    dialog.showErrorBox("Remote Drop Error", `Failed to open remote drop: ${e.message}`); // Dodana linia
  }
});

// Optional: help content
ipcMain.handle("help:get-content", async (_e, lang = "en") => {
  const file = lang === "pl" ? "help_pl.md" : "help_en.md";
  let filePath;

  if (app.isPackaged) {
    // In production, construct the path from the app's root.
    filePath = path.join(app.getAppPath(), 'src', 'main', file);
  } else {
    // In development, __dirname is in the correct `src/main` directory.
    filePath = path.join(__dirname, file);
  }

  console.log(`[DEBUG] help:get-content (isPackaged: ${app.isPackaged}) - Trying to load: ${filePath}`);
  try {
    const markdownContent = fs.readFileSync(filePath, "utf8");
    return marked.parse(markdownContent);
  } catch (e) {
    console.error(`[DEBUG] Help file loading error for ${filePath}:`, e);
    return `<h1>Help file not found</h1><p>${e.message}</p>`;
  }
});

// -----------------------------
// Menu
// -----------------------------
function buildMenu() {
  const isPL = CFG.lang === "pl";
  const T = (en, pl) => (isPL ? pl : en);

  const template = [
    {
      label: T("File", "Plik"),
      submenu: [
        {
          label: T("Choose Save Folder…", "Wybierz folder zapisu…"),
          click: () => mainWindow && mainWindow.webContents.send("menu:chooseFolder")
        },
        {
          label: T("Open Save Folder", "Otwórz folder zapisu"),
          click: () => CFG.saveDir && shell.openPath(CFG.saveDir)
        },
        { type: "separator" },
        { role: "quit", label: T("Quit", "Zakończ") }
      ]
    },
    {
      label: T("Edit", "Edycja"),
      submenu: [
        { role: 'undo', label: T("Undo", "Cofnij") },
        { role: 'redo', label: T("Redo", "Ponów") },
        { type: 'separator' },
        { role: 'cut', label: T("Cut", "Wytnij") },
        { role: 'copy', label: T("Copy", "Kopiuj") },
        { role: 'paste', label: T("Paste", "Wklej") },
      ]
    },
    {
      label: T("View", "Widok"),
      submenu: [
        { role: "reload", label: T("Reload", "Odśwież") },
        { role: "toggleDevTools", label: T("Toggle DevTools", "Pokaż DevTools") },
        { type: "separator" },
        { role: "resetZoom", label: T("Actual Size", "Domyślny zoom") },
        { role: "zoomIn", label: T("Zoom In", "Powiększ"), accelerator: "CommandOrControl+=" },
        { role: "zoomOut", label: T("Zoom Out", "Pomniejsz") },
        { type: "separator" },
        { role: "togglefullscreen", label: T("Toggle Full Screen", "Pełny ekran") }
      ]
    },
    {
      label: T("Tools", "Narzędzia"),
      submenu: [
        {
          label: T("Open Remote Drop", "Otwórz Remote Drop"),
          click: async () => {
            try {
              const url = getRemoteURL();
              if (!url) throw new Error("Remote URL not available yet.");
              await shell.openExternal(url);
            } catch (e) {
              dialog.showErrorBox("Remote Drop Error", `Failed to open remote drop from menu: ${e.message}`); // Dodana linia
              dialog.showErrorBox("Remote Drop Error", e.message);
            }
          }
        }
      ]
    },
    {
      label: T("Settings", "Ustawienia"),
      submenu: [
        {
          label: T("Theme", "Motyw"),
          submenu: [
            {
              label: T("Default Dark", "Domyślny Ciemny"),
              type: "radio",
              checked: CFG.theme === 'default-dark',
              click: () => {
                CFG.theme = 'default-dark';
                saveConfig(CFG);
                buildMenu();
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("settings:update", { theme: CFG.theme });
                }
              }
            },
            {
              label: T("Midnight Blue", "Nocny Niebieski"),
              type: "radio",
              checked: CFG.theme === 'midnight-blue',
              click: () => {
                CFG.theme = 'midnight-blue';
                saveConfig(CFG);
                buildMenu();
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("settings:update", { theme: CFG.theme });
                }
              }
            },
            {
              label: T("Light", "Jasny"),
              type: "radio",
              checked: CFG.theme === 'light',
              click: () => {
                CFG.theme = 'light';
                saveConfig(CFG);
                buildMenu();
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("settings:update", { theme: CFG.theme });
                }
              }
            }
          ]
        },
        { type: "separator" },
        {
          label: T("Font", "Czcionka"),
          submenu: [
            {
              label: T("System (Default)", "Systemowa (Domyślna)"),
              type: "radio",
              checked: CFG.font === 'system',
              click: () => {
                CFG.font = 'system';
                saveConfig(CFG);
                buildMenu();
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("settings:update", { font: CFG.font });
                }
              }
            },
            {
              label: "Roboto",
              type: "radio",
              checked: CFG.font === 'roboto',
              click: () => {
                CFG.font = 'roboto';
                saveConfig(CFG);
                buildMenu();
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("settings:update", { font: CFG.font });
                }
              }
            },
            {
              label: "Roboto Mono",
              type: "radio",
              checked: CFG.font === 'roboto-mono',
              click: () => {
                CFG.font = 'roboto-mono';
                saveConfig(CFG);
                buildMenu();
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("settings:update", { font: CFG.font });
                }
              }
            }
          ]
        },
        { type: "separator" },
        {
          label: T("Save Format", "Format zapisu"),
          submenu: [
            {
              label: "MIDI",
              type: "radio",
              checked: CFG.saveFormat === 'midi',
              click: () => {
                CFG.saveFormat = 'midi';
                saveConfig(CFG);
                buildMenu();
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("settings:update", { saveFormat: 'midi' });
                }
              }
            },
            {
              label: "JSON",
              type: "radio",
              checked: CFG.saveFormat === 'json',
              click: () => {
                CFG.saveFormat = 'json';
                saveConfig(CFG);
                buildMenu();
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("settings:update", { saveFormat: 'json' });
                }
              }
            },
            {
              label: T("Both", "Oba"),
              type: "radio",
              checked: CFG.saveFormat === 'both',
              click: () => {
                CFG.saveFormat = 'both';
                saveConfig(CFG);
                buildMenu();
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send("settings:update", { saveFormat: 'both' });
                }
              }
            }
          ]
        },
        {
          label: T("Language", "Język"),
          submenu: [
            {
              label: "English",
              type: "radio",
              checked: !isPL,
              click: () => {
                if (CFG.lang !== "en") {
                  CFG.lang = "en";
                  saveConfig(CFG);
                  buildMenu();
                  if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send("menu:setLang", "en");
                  }
                }
              }
            },
            {
              label: "Polski",
              type: "radio",
              checked: isPL,
              click: () => {
                if (CFG.lang !== "pl") {
                  CFG.lang = "pl";
                  saveConfig(CFG);
                  buildMenu();
                  if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send("menu:setLang", "pl");
                  }
                }
              }
            }
          ]
        },

        {
          label: T("Ignore Realtime Messages", "Ignoruj komunikaty Realtime"),
          type: "checkbox",
          checked: !!CFG.ignoreRealtime,
          click: (item) => {
            CFG.ignoreRealtime = item.checked;
            saveConfig(CFG);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("settings:update", { ignoreRealtime: CFG.ignoreRealtime });
            }
          }
        }
      ]
    },
    {
      label: T("Help", "Pomoc"),
      submenu: [
        {
          label: T("Show Help", "Pokaż Pomoc"),
          click: () => {
            const helpWindow = new BrowserWindow({
              width: 900,
              height: 650,
              title: T("DJ MIDI Capture - Help", "DJ MIDI Capture - Pomoc"),
              parent: mainWindow,
              webPreferences: {
                preload: path.join(__dirname, "..", "preload", "preload.js"),
                nodeIntegration: false,
                contextIsolation: true
              }
            });
            helpWindow.loadFile(path.join(__dirname, '..', 'renderer', 'help.html'));
          }
        },
        { type: "separator" },
        {
          label: T('About', 'O Aplikacji'),
          click: () => {
            const version = app.getVersion();
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: T('About DJ MIDI Capture', 'O DJ MIDI Capture'),
              message: `DJ MIDI Capture v${version}`,
              detail: T('A tool for capturing MIDI events from DJ controllers.', 'Narzędzie do przechwytywania zdarzeń MIDI z kontrolerów DJ.'),
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}