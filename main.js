const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

function createWindow() {
  let window = new BrowserWindow({ width: 800, height: 600 });
  window.loadURL(url.format({
    pathname: path.join(__dirname, './build/index.html'),
    protocol: 'file:',
    slashes: true
  }));
  window.on('closed', () => {
    app.quit();
  });
}

app.on('ready', createWindow);
