import { desktopCapturer, screen } from 'electron'

const captureCurrentApplication = async (): Promise<string> => {
  try {
    // TODO: make config adjustments in vite instead for esm modules
    const activeWindow = (await import('get-windows')).activeWindow
    const activeWin = await activeWindow()

    if (!activeWin) {
      console.error('No active window found')
      throw new Error('No active window found')
    }

    const { bounds } = activeWin
    const { x, y, width, height } = bounds

    const activeDisplay = screen.getDisplayNearestPoint({ x, y })
    const {
      x: displayX,
      y: displayY,
      width: displayWidth,
      height: displayHeight,
    } = activeDisplay.bounds

    const region = {
      x: Math.max(x - displayX, 0),
      y: Math.max(y - displayY, 0),
      width: Math.min(width, displayWidth),
      height: Math.min(height, displayHeight),
    }

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: displayWidth, height: displayHeight },
    })

    const matchingSource = sources.find((source) => source.display_id === String(activeDisplay.id))

    if (!matchingSource) {
      throw new Error('No matching source found for the active display.')
    }

    const screenImage = matchingSource.thumbnail
    const croppedImage = screenImage.crop(region)
    const screenshotDataURL = croppedImage.toDataURL()

    return screenshotDataURL
  } catch (error) {
    console.error('Error capturing active window region:', error)
    throw error
  }
}

export default captureCurrentApplication
