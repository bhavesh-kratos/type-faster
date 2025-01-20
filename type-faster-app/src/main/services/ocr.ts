import Tesseract from 'tesseract.js'

const getText = (imagePath): Promise<string> => {
  return new Promise((resolve, reject) => {
    Tesseract.recognize(imagePath, 'eng', {
      cachePath: '../lang-data',
    })
      .then(({ data }) => {
        resolve(data.text.trim())
      })
      .catch((err) => {
        reject(`Error extracting text: ${err}`)
      })
  })
}

export { getText }
