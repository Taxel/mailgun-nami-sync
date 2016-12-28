const {app, BrowserWindow} = require('electron');
const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const config = require('./webpack.config.js');

config.output.pathinfo = true;
config.entry.unshift(
  'webpack-dev-server/client?http://localhost:8080/',
  'webpack/hot/dev-server'
);
config.plugins.push(new webpack.HotModuleReplacementPlugin());

function createWindow() {
  let window = new BrowserWindow({ width: 1280, height: 800 });
  window.loadURL('http://localhost:8080');
  window.webContents.openDevTools();
  window.on('closed', () => {
    app.quit();
  });
}

app.on('ready', () => {
  const server = new WebpackDevServer(webpack(config), {
    hot: true,
    quiet: false,
    inline: true,
    stats: { colors: true }
  });
  server.listen(8080, 'localhost', createWindow);
});
