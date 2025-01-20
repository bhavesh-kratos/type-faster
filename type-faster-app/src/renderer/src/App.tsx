import { useEffect, useState } from 'react'
import Tesseract from 'tesseract.js'

import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): JSX.Element {
  const [mainState, setMainState] = useState<any>(null)

  useEffect(() => {
    window.electron.ipcRenderer.on('set-main-state', (event, data) => {
      // eslint-disable-next-line no-console
      console.log('scrnsht--', data)
      setMainState(data)
    })
  }, [])

  return (
    <>
      <button onClick={() => window.electron.ipcRenderer.send('get-main-state')}>
        Get main state
      </button>
      <textarea
        rows={10}
        onKeyDown={(e) => {
          window.electron.ipcRenderer.send('get-main-state')
        }}
      />

      <div
        style={{
          overflowY: 'auto',
          maxHeight: '500px',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          width: '800px',
          padding: '40px',
        }}
      >
        <pre>{JSON.stringify(mainState, null, '\t')}</pre>
      </div>

      <Versions></Versions>
    </>
  )
}

export default App
