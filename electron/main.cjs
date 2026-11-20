const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#102522",
    title: "Mint OS Desktop",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) shell.openExternal(url);
    return { action: "deny" };
  });

  const appRoot = app.isPackaged ? app.getAppPath() : path.join(__dirname, "..");
  const distPath = path.join(appRoot, "dist");
  const wallpaperUrl = pathToFileURL(path.join(distPath, "wallpaper-mint.png")).href;
  const wallpaperOverrides = `
    .desktop-wallpaper {
      background-image: linear-gradient(180deg, rgba(12, 32, 29, .06) 0%, rgba(6, 20, 19, .12) 48%, rgba(5, 17, 17, .28) 100%), url("${wallpaperUrl}") !important;
    }
    .wallpaper-dusk .desktop-wallpaper {
      background-image: linear-gradient(180deg, rgba(40, 17, 28, .08), rgba(17, 13, 24, .55)), url("${wallpaperUrl}") !important;
    }
    .preview-lake {
      background-image: linear-gradient(180deg, rgba(18, 52, 45, .05), rgba(7, 26, 24, .2)), url("${wallpaperUrl}") !important;
    }
    .session-backdrop {
      background-image: linear-gradient(180deg, rgba(4, 18, 16, .42), rgba(3, 13, 13, .7)), url("${wallpaperUrl}") center / cover !important;
    }
  `;

  mainWindow.loadFile(path.join(distPath, "index.html")).then(async () => {
    if (mainWindow.isDestroyed()) return;
    await mainWindow.webContents.insertCSS(wallpaperOverrides);
    if (!mainWindow.isDestroyed()) mainWindow.show();
  }).catch((error) => {
    console.error("Could not load Mint OS:", error);
  });

  return mainWindow;
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});