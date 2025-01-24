import { app, BrowserWindow, ipcMain, screen } from 'electron'
import KeyboardListener from './keylogger'

let overlayWindow
let keyboardListener

app.on('ready', () => {
  const { width } = screen.getPrimaryDisplay().workAreaSize

  // Create overlay window
  overlayWindow = new BrowserWindow({
    width: 600,
    height: 50,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    x: Math.floor((width - 600) / 2),
    y: 50,
  })

  overlayWindow.loadURL(`data:text/html;charset=utf-8,
    <html>
      <body style="margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: rgba(0, 0, 0, 0);">
        <div id="suggestion-box" style="
          background: rgba(0, 0, 0, 0.8);
          color: white;
          font-size: 18px;
          font-family: Arial, sans-serif;
          padding: 10px 20px;
          border-radius: 20px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
          text-align: center;
          max-width: 90%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;">
        </div>
        <script>
          const { ipcRenderer } = require('electron');
          ipcRenderer.on('update-suggestions', (event, suggestion) => {
            document.getElementById('suggestion-box').innerText = suggestion || '';
          });
        </script>
      </body>
    </html>`)

  overlayWindow.setIgnoreMouseEvents(true)
  overlayWindow.hide()

  // Initialize KeyboardListener
  keyboardListener = new KeyboardListener()

  // Forward suggestions to overlay
  ipcMain.on('update-suggestions', (suggestion) => {
    console.log('Received suggestion: ', suggestion)
    overlayWindow.webContents.send('update-suggestions', suggestion)
    overlayWindow.showInactive()
  })
})

app.on('window-all-closed', () => {
  keyboardListener.stopListening()
  app.quit()
})
