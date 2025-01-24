// import Tesseract from 'tesseract.js'
// const TESSDATA_ENG = require('@tess-data/eng')
import TESSDATA_ENG from '@tess-data/eng'
import { createWorker } from 'tesseract.js'

const getText = async (imagePath: string): Promise<string> => {
  try {
    const worker = await createWorker('eng')
    const { data } = await worker.recognize(imagePath, [TESSDATA_ENG] as any)
    return data.text.trim()
  } catch (err) {
    throw new Error(`Error extracting text: ${err}`)
  }
}

export { getText }
