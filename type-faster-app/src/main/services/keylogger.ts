import { GlobalKeyboardListener } from 'node-global-key-listener'
import { ipcMain } from 'electron'

import captureCurrentApplication from './screen-capture'
import { getText } from './ocr'
import suggestionSocketClient from './suggestion-client'

class KeyboardListener {
  private gkl: GlobalKeyboardListener
  private textBuffer: string = ''
  private isCapturing: boolean = false
  private isDetecting: boolean = false

  private socketClient = suggestionSocketClient

  private latestenvTextBuffer: string = ''
  private initialEnvTextBuffer: string = ''

  constructor() {
    this.gkl = new GlobalKeyboardListener()
    this.startListening()
    if (process.env.NODE_ENV === 'development') {
      this.renderLogger()
    }
  }

  private renderLogger(): void {
    ipcMain.on('get-main-state', (event) => {
      event.reply('set-main-state', {
        textBuffer: this.textBuffer,
        isCapturing: this.isCapturing,
        initialEnvTextBuffer: this.initialEnvTextBuffer,
        latestenvTextBuffer: this.latestenvTextBuffer,
      })
    })
  }

  private findDifferenceFromStart(text1: string, text2: string): string {
    let i = 0
    while (i < text1.length && i < text2.length && text1[i] === text2[i]) {
      i++
    }
    return text1.substring(0, i)
  }

  private async handleKeyPress(event): void {
    if (this.isDetecting) return

    if (event.state === 'DOWN') {
      const isAlphaNumericOrSymbol =
        /^[\w\s\p{P}]$/u.test(event.name) ||
        event.name.toLowerCase() === 'backspace' ||
        event.name.toLowerCase() === 'space'

      if (!this.isCapturing) {
        if (!this.initialEnvTextBuffer) {
          this.initialEnvTextBuffer = await this.takeScreenshotAndExtractText()
          return
        }

        if (!this.latestenvTextBuffer) {
          this.latestenvTextBuffer = await this.takeScreenshotAndExtractText()
        }

        this.textBuffer = this.findDifferenceFromStart(
          this.initialEnvTextBuffer,
          this.latestenvTextBuffer,
        )
        this.isCapturing = true
      }

      if (isAlphaNumericOrSymbol) {
        this.appendToBuffer(event.name)
        this.sendBufferForSuggestions() // Send text buffer for suggestions
      } else {
        this.resetBuffer()
      }
    }
  }

  private sendBufferForSuggestions(): void {
    if (!this.socketClient) return

    this.socketClient.getSuggestions(this.textBuffer, (suggestion: string) => {
      ipcMain.emit('update-suggestions', suggestion)
    })
  }

  private startListening(): void {
    try {
      this.gkl.addListener(this.handleKeyPress.bind(this))
    } catch (error) {
      console.error('Error starting keyboard listener:', error)
    }
  }

  private appendToBuffer(key: string): void {
    this.textBuffer += key
  }

  private resetBuffer(): void {
    this.isCapturing = false
    this.textBuffer = ''
    this.initialEnvTextBuffer = ''
    this.latestenvTextBuffer = ''
  }

  private async takeScreenshotAndExtractText(): Promise<string> {
    this.isDetecting = true
    try {
      const screenshot = await captureCurrentApplication()
      const extractedText = await getText(screenshot)
      return extractedText
    } catch (error) {
      console.error('Error capturing screenshot or extracting text:', error)
      throw error
    } finally {
      this.isDetecting = false
    }
  }

  getTextBuffer(): string {
    return this.textBuffer
  }

  stopListening(): void {
    if (!this.gkl) return

    this.gkl.removeListener(this.handleKeyPress.bind(this))
    console.log('Keyboard listener stopped.')
  }
}

export default KeyboardListener
