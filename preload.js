const { contextBridge, ipcRenderer, path, fs, shell } = require('electron');

console.log('Preload script executed');

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
  shell: shell
});
