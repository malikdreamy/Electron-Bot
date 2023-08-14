const { contextBridge, ipcRenderer } = require('electron');

// Expose the insertText and sendMessageToMain function to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  insertText: (text) => {
    ipcRenderer.send('insertText', text);
  },
  sendMessageToMain: (message) => {
    ipcRenderer.send('messageFromRenderer', message);
  }
});


ipcRenderer.on('messageFromMain', (event, message) => {
  console.log('Received message from main:', message);
});