const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const webpack = require('webpack');
const config = require('./webpack.config.js');

config.plugins.push(
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify('production')
    }
  })
);

function createWindow() {
  let window = new BrowserWindow({ width: 600, height: 800 });
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
