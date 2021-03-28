# League OCR HUD

## Setup
0. Install [Node.js](https://nodejs.org/en/download/current/) `>=15`, Python 3, [C++ Redistributable for x64](https://visualstudio.microsoft.com/downloads/#other-family)
1. Follow the [Cloud Vision API quickstart](https://cloud.google.com/vision/docs/setup#project) up to the point where you get your keys JSON file (make sure to enable billing)
2. Clone (or download) this repo to somewhere to your production PC: `git clone https://github.com/Dan-Shields/League-OCR-HUD.git`
3. Copy the CV keys JSON file into the newly created directory and rename it to `CV.keys.json`
4. Install dependencies: `npm i --production`

## Usage
1. Open a dedicated NDI output for the game feed (it must be 1920x1080)
2. Copy `config.example.json` to `config.json` and edit `ndiFeed` to match your game feed name
3. Start the program with `npm start`
