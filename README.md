# Type faster ⚡⌨️

Offline-first desktop app with auto suggestion and auto correct feature to help you type faster.

## Libraries and packages

**App**

Packaged using [Electron vite](https://github.com/alex8088/electron-vite) \
Electron\
Electron builder\
React\
Typescript\
Vite\
Eslint + prettier

**server**

python

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## Languages supported

Currently only supports English keyboard layouts

## Supported devices

MacOS and windows

Currently tested only on MacOS

## License

GNU GPL v3

## Roadmap

- ~~Finalize the project structure~~
- ~~setup dev scripts at root level to start the app with python server~~
- ~~UI: show suggestions ahead in the screen~~
- making sure FE application works as intended and then optimize the backend
- finetune and optimize the Python server for suggestions and auto-correct
- customization options in app and onboarding ui
- setup build scripts to package python server with app
- optimize the build size, processes memory consumption
