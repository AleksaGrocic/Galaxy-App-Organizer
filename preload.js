const { contextBridge, ipcRenderer, path, fs } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      ipcRenderer.send(channel, data);
    },
    on: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
    },
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    },
  },
  __dirname: __dirname,
  path: path,
  fs: fs,
});

// Add the following line to expose 'draggable' globally
window.Draggable = require('draggable');
