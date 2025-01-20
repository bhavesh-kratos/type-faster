import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { join } from 'path'
import AutoLaunch from 'auto-launch'
const net = require('net')

import KeyboardListener from './services/keylogger'
import icon from '../../resources/icon.png?asset'

// 1. Auto launch the app
const autoLauncher = new AutoLaunch({
  name: 'Type Faster',
})

autoLauncher.isEnabled().then((isEnabled: boolean) => {
  if (!isEnabled) {
    autoLauncher.enable()
  }
})

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
    },
  })

  const keyboardListener = new KeyboardListener()

  mainWindow.on('closed', () => {
    keyboardListener.stopListening()
    // mainWindow = null
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

/* 3. suggestions handler */

const HOST = '127.0.0.1' // Localhost
const PORT = 65432 // Match with Python socket port

const client = new net.Socket()

client.connect(PORT, HOST, () => {
  console.log('Connected to Python socket server')
})

client.on('error', (err: Error) => {
  console.error('Socket connection error:', err)
})

// Utility function to communicate with Python server
// function sendToPython(command: string): Promise<string> {
//   return new Promise((resolve, reject) => {
//     console.log('Sending command:', command)
//     client.write(command + '\n')
//     client.once('data', (data: Buffer) => {
//       console.log(data.toString())
//       resolve(data.toString().trim())
//     })
//   })
// }

// ipcMain.on('get-suggestions', async (event, text) => {
//   try {
//     console.log('Received text:', text)
//     if (!text) {
//       return
//     }
//     const response = await sendToPython(`PREDICT:${text}`)
//     if (response.startsWith('PREDICTION:')) {
//       return response.substring('PREDICTION:'.length)
//     } else {
//       console.error('Unexpected response from Python:', response)
//       return ''
//     }
//   } catch (error) {
//     console.error('Error communicating with Python server:', error)
//     return ''
//   }
// })

// ipcMain.on('get-auto-corrected', async (event, textBuffer) => {
//   try {
//     console.log('Received text:', textBuffer)
//     if (!textBuffer) {
//       return
//     }
//     const response = await sendToPython(`AUTOCORRECT:${textBuffer}`)
//     if (response.startsWith('CORRECTED:')) {
//       return response.substring('CORRECTED:'.length)
//     } else {
//       console.error('Unexpected response from Python:', response)
//       return ''
//     }
//   } catch (error) {
//     console.error('Error communicating with Python server:', error)
//     return ''
//   }
// })

// ipcMain.on('capture-screenshot', async (event, arg) => {
//   try {
//     console.log('Capture request received with data:', arg)

//     // // Get the primary display's resolution
//     // const primaryDisplay = screen.getPrimaryDisplay()
//     // const { width, height } = primaryDisplay.workAreaSize

//     // console.log('Capturing screenshot with resolution:', width, height)

//     // const sources = await desktopCapturer.getSources({
//     //   types: ['screen'],
//     //   thumbnailSize: { width, height }
//     // })

//     // if (sources.length === 0) {
//     //   throw new Error('No screen sources found.')
//     // }

//     const image = await captureCurrentApplication()

//     Tesseract.recognize(image, 'eng', {
//       // logger: (m: any) => console.log(m),
//       cachePath: './lang-data',
//     }).then(({ data }) => {
//       console.log('recoginzed:: ', { translationData: data })
//       return null
//     })

//     // Send the thumbnail data as a Base64 string
//     event.reply('screenshot-data', image)
//   } catch (error) {
//     console.error('Error capturing screenshot:', error)
//     event.reply('screenshot-data', { error: error?.message })
//   }
// })
