# League OCR HUD


## About
This program creates and updates several .txt files with the latest game state data available, including tower kills, gold, timers etc. These files can then be used in OBS or vMix to update a HUD graphic.

It takes as much data as possible from the [League Game Client API](https://developer.riotgames.com/docs/lol#game-client-api), and supplements that with Optical Character Recognition (OCR) using Google's [Cloud Vision API](https://cloud.google.com/vision).

Right now, the available data is as follows:
- gametime
- left_towers, right_towers
- left_kills, right_kills
- left_gold, right_gold
- baron_timer
- drake_timer

The output filenames are the above values plus `.txt`.

## Setup Assistance
If you're struggling to setup this program or want professional installation I'm available for hire. Please contact me at <hello@danielshields.uk>

## Prerequisites
- Windows 10 64-bit
- NDI x64 Runtime 4 or newer
- A Cloud Vision API account with billing enabled and a JSON credentials file (follow the [Cloud Vision API quickstart](https://cloud.google.com/vision/docs/setup#project) until you get the file)
- League of Legends on the production PC

## Installation

### Option 1: From Release (recommended)
Download and unzip the [latest release](https://github.com/Dan-Shields/League-OCR-HUD/releases/latest)

### Option 2: From Source
1. Install [Node.js](https://nodejs.org/en/download/current/) `>=15`, Python 3, [C++ Redistributable for x64](https://visualstudio.microsoft.com/downloads/#other-family)
2. Clone this repo to somewhere to your production PC
3. Install dependencies: `npm i --production`

## Usage
1. Open a dedicated NDI output for the game feed (it must be 1920x1080)
2. Copy the CV private key JSON file into the project directory and rename it to `CV.keys.json`
3. Copy `config.example.json` to `config.json` and edit `ndiFeed` to match your game feed name
4. Run the executable if present or run `npm start`
5. Start spectating a game in League and the output files should populate

## Future plans
- Improve reliability of NDI receiver
- Support resolutions other than 1920x1080 for the NDI feed
- Improve logging and error reporting
- See if OCR processing time can be improved
- Write some kind of tests
