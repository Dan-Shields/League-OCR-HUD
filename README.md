# League OCR HUD

## Setup
0. Install Node.js >= v15
1. Follow the [Cloud Vision API quickstart](https://cloud.google.com/vision/docs/setup#project) up to the point where you get your keys JSON file
2. Clone (or download) this repo to somewhere to your production PC: `git clone https://github.com/Dan-Shields/League-OCR-HUD.git`
3. Copy the CV keys JSON file into the newly created directory
4. Install dependencies: `npm i --production`

## Usage
1. Open a dedicated NDI output for the game feed (it must be 1920x1080)
2. Configure the `GAME_FEED` constant in index.js according to the NDI info (all visible NDI feeds are printed by the program on start)
3. Start the program with `npm start`
