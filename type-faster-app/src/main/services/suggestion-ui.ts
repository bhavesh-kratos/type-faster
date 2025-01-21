import { screen, app, BrowserWindow } from 'electron'
import { GlobalKeyboardListener } from 'node-global-key-listener'

let overlayWindow
let typingBuffer = ''
let suggestionTimeout

app.on('ready', () => {
  overlayWindow = new BrowserWindow({
    width: 600,
    height: 50,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  overlayWindow.loadURL(`data:text/html;charset=utf-8,
    <html>
      <body style="margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: rgba(0, 0, 0, 0); height: 100%; font-size: 16px;">
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

  overlayWindow.setIgnoreMouseEvents(true) // ensure overlay doesn't intercept input
  overlayWindow.hide() // hide overlay initially

  const gkl = new GlobalKeyboardListener()

  // TODO: replace with keyboardlistener
  gkl.addListener((e) => {
    if (e.state === 'DOWN') {
      const key = e.name

      if (key?.toLowerCase() === 'backspace') {
        typingBuffer = typingBuffer.slice(0, -1)
      } else if (key.length === 1) {
        typingBuffer += key
      }

      clearTimeout(suggestionTimeout)

      // show suggestions after a 100ms delay
      suggestionTimeout = setTimeout(() => {
        const suggestion = getSuggestion(typingBuffer)

        const { width } = screen.getPrimaryDisplay().workAreaSize

        overlayWindow.setBounds({
          x: Math.floor((width - 600) / 2),
          y: 50,
          width: 600,
          height: 50,
        })

        overlayWindow.webContents.send('update-suggestions', suggestion)

        // show the overlay without taking focus
        overlayWindow.showInactive()
      }, 100)
    }
  })
})

app.on('window-all-closed', () => {
  app.quit()
})

/**
 * TODO: replace with actual suggestions
 */
function getSuggestion(text) {
  if (!text) return ''
  return `You typed: ${text}?`
}
