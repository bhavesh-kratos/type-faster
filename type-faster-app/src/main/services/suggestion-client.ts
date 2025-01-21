import * as net from 'net'

class SuggestionSocketClient {
  private client: net.Socket
  private readonly host: string
  private readonly port: number
  private reconnectInterval: NodeJS.Timeout | null = null

  constructor(host: string = '127.0.0.1', port: number = 65432) {
    this.host = host
    this.port = port
    this.client = new net.Socket()

    this.initializeSocket()
  }

  private initializeSocket(): void {
    this.client.connect(this.port, this.host, () => {
      console.log('Connected to Python socket server')
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval)
        this.reconnectInterval = null
      }
    })

    this.client.on('error', (err: Error) => {
      console.error('Socket connection error:', err)
      this.reconnect()
    })

    this.client.on('close', () => {
      console.warn('Socket connection closed. Attempting to reconnect...')
      this.reconnect()
    })
  }

  private reconnect(): void {
    if (this.reconnectInterval) return

    this.reconnectInterval = setInterval(() => {
      console.log('Attempting to reconnect...')
      this.client.connect(this.port, this.host, () => {
        console.log('Reconnected to Python socket server')
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval)
          this.reconnectInterval = null
        }
      })
    }, 5000)
  }

  private sendToSuggestionServer(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('Sending command:', command)
      if (!this.client.writable) {
        console.error('Socket is not writable. Reconnecting...')
        this.reconnect()
        reject(new Error('Socket is not writable.'))
        return
      }

      this.client.write(command + '\n')
      this.client.once('data', (data: Buffer) => {
        console.log('Received data:', data.toString())
        resolve(data.toString().trim())
      })

      this.client.once('error', (error: Error) => {
        console.error('Error sending command to Python:', error)
        reject(error)
      })
    })
  }

  public async getSuggestions(
    text: string,
    callback?: (suggestion: string) => void,
  ): Promise<string> {
    try {
      if (!text) return ''
      const response = await this.sendToSuggestionServer(`PREDICT:${text}`)
      if (response.startsWith('PREDICTION:')) {
        const suggestion = response.substring('PREDICTION:'.length)
        if (callback) callback(suggestion)
        return suggestion
      } else {
        console.error('Unexpected response from Python:', response)
        return ''
      }
    } catch (error) {
      console.error('Error while getting suggestions:', error)
      return ''
    }
  }

  public async getAutoCorrected(
    textBuffer: string,
    callback?: (correctedText: string) => void,
  ): Promise<string> {
    try {
      if (!textBuffer) return ''
      const response = await this.sendToSuggestionServer(`AUTOCORRECT:${textBuffer}`)
      if (response.startsWith('CORRECTED:')) {
        const correctedText = response.substring('CORRECTED:'.length)
        if (callback) callback(correctedText)
        return correctedText
      } else {
        console.error('Unexpected response from Python:', response)
        return ''
      }
    } catch (error) {
      console.error('Error while getting auto-corrected text:', error)
      return ''
    }
  }
}

const suggestionSocketClient = new SuggestionSocketClient()

export default suggestionSocketClient
