//handle setupevents as quickly as possible
const setupEvents = require('../installers/setupEvents')
const MenuBuilder = require('./menu')
//import MenuBuilder from "./menu";
if (setupEvents.handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

// require('babel-polyfill')
const {app, BrowserWindow} = require('electron');
const url = require('url');
const path = require('path');
// import MenuBuilder from './menu';

let mainWindow = null;

// const installExtensions = async () => {
//   const installer = require('electron-devtools-installer');
//   const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
//   const extensions = [
//     'REACT_DEVELOPER_TOOLS',
//     'REDUX_DEVTOOLS'
//   ];
//
//   return Promise
//     .all(extensions.map(name => installer.default(installer[name], forceDownload)))
//     .catch(console.log);
// };

function callBackFunc(res) {
  switch(res) {
    case 'MessageSegment':
      mainWindow.loadURL(url.format ({
        pathname: path.join(__dirname, '/../client/src/modules/segment-set-editor/index.html'),
        protocol: 'file:',
        slashes: true
      }));
    break;
    case 'MessageSpec':
      mainWindow.loadURL(url.format ({
        pathname: path.join(__dirname, '/../client/src/modules/graph-library/index.html'),
        protocol: 'file:',
        slashes: true
      }));
    break;
    case 'MessageMapping':
      mainWindow.loadURL(url.format ({
        pathname: path.join(__dirname, '/../client/src/modules/message-mapping-gui/index.html'),
        protocol: 'file:',
        slashes: true
      }));
    break;
    case 'SampleMessage':
      mainWindow.loadURL(url.format ({
        pathname: path.join(__dirname, '/../client/src/modules/sample-message-viewer/index.html'),
        protocol: 'file:',
        slashes: true
      }));
    break;
  }
  
}

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  // await installExtensions();
  mainWindow = new BrowserWindow({
    titleBarStyle: 'hidden',
    width: 1366,
    height: 800,
    minWidth: 1366,
    minHeight: 800,
    show: false,
    icon: path.join(__dirname, '/../client/assets/icons/png/64x64.png')
  });



  mainWindow.loadURL(url.format ({
    pathname: path.join(__dirname, '/../client/src/modules/message-mapping-gui/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    // app.quit()
  });

  const menuBuilder = new MenuBuilder({
    mainWindow: mainWindow,
    parent: this
  }
    
  );
  menuBuilder.buildMenu(callBackFunc);
});
