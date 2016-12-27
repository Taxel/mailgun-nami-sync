const {app, BrowserWindow} = require('electron');

function createWindow() {
  let window = new BrowserWindow({ width: 1280, height: 800 });
  window.loadURL('http://localhost:8080');
  window.webContents.openDevTools();
  window.on('closed', () => {
    app.quit();
  });
}

app.on('ready', createWindow);
