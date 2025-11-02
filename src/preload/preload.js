const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  // === Core ===
  getVersion: () => ipcRenderer.invoke("app:get-version"),

  // === FS helpers (z aliasami używanymi w HTML) ===
  getFolder: () => ipcRenderer.invoke("fs:getFolder"),
  getSaveFolder: () => ipcRenderer.invoke("fs:getFolder"), // alias dla HTML
  chooseFolder: () => ipcRenderer.invoke("fs:chooseFolder"),
  chooseSaveFolder: () => ipcRenderer.invoke("fs:chooseFolder"), // alias dla HTML
  saveFile: (args) => ipcRenderer.invoke("fs:save", args),

  // === External ===
  openExternal: (url) => ipcRenderer.invoke("shell:openExternal", url),

  // === i18n ===
  getLang: () => ipcRenderer.invoke("i18n:getLang"),
  setLang: (lang) => ipcRenderer.invoke("i18n:setLang", lang),

  // === App settings ===
  getSettings: () => ipcRenderer.invoke("app:getSettings"),
  setSettings: (patch) => ipcRenderer.invoke("app:setSettings", patch),

  // === Remote ===
  getRemoteInfo: () => ipcRenderer.invoke("remote:getInfo"),
  openRemoteDrop: () => ipcRenderer.invoke("remote:openDrop"),

  // === Help ===
  getHelpContent: (lang) => ipcRenderer.invoke("help:get-content", lang),

  // === Event listeners for renderer ===
  onSettingsUpdate: (cb) => ipcRenderer.on("settings:update", (_e, data) => cb?.(data)),
  onRemoteTrigger: (cb) => ipcRenderer.on("remote:trigger", () => cb?.()),
  onRemoteInfo: (cb) => ipcRenderer.on("remote:info", (_e, data) => cb?.(data)),
  onRemoteShowModal: (cb) => ipcRenderer.on("remote:showModal", (_e, data) => cb?.(data)),
  
  // DODAJ TĘ LINIĘ:
  onRemoteSetPreset: (cb) => ipcRenderer.on("remote:setPreset", (_e, data) => cb?.(data)),

  // Menu-driven events (HTML używa tych aliasów)
  onMenuSetLang: (cb) => ipcRenderer.on("menu:setLang", (_e, lang) => cb?.(lang)),
  onMenuChooseFolder: (cb) => ipcRenderer.on("menu:chooseFolder", () => cb?.()),
  onDiagnosticLog: (cb) => ipcRenderer.on('diagnostic:log', (_e, msg) => cb?.(msg)),
});
