import * as net from 'net'

class SuggestionSocketClient {
  private client: net.Socket
  private readonly host: string
  private readonly port: number

  constructor(host: string = '127.0.0.1', port: number = 65432) {
    this.host = host
    this.port = port
    this.client = new net.Socket()

    this.initializeSocket()
  }

  private initializeSocket(): void {
    this.client.connect(this.port, this.host, () => {
      console.log('Connected to Python socket server')
    })

    this.client.on('error', (err: Error) => {
      console.error('Socket connection error:', err)
    })
  }

  protected sendToSuggestionServer(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('Sending command:', command)
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

  public async getSuggestions(text: string): Promise<string> {
    try {
      if (!text) return ''
      const response = await this.sendToSuggestionServer(`PREDICT:${text}`)
      if (response.startsWith('PREDICTION:')) {
        return response.substring('PREDICTION:'.length)
      } else {
        console.error('Unexpected response from Python:', response)
        return ''
      }
    } catch (error) {
      console.error('Error while getting suggestions:', error)
      return ''
    }
  }

  public async getAutoCorrected(textBuffer: string): Promise<string> {
    try {
      if (!textBuffer) return ''
      const response = await this.sendToSuggestionServer(`AUTOCORRECT:${textBuffer}`)
      if (response.startsWith('CORRECTED:')) {
        return response.substring('CORRECTED:'.length)
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
