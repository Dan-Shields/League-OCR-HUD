// Native
import fs from 'fs'
import path from 'path'

// Packages
import vision from '@google-cloud/vision'
import Jimp from 'jimp'

// Ours
import NDI from './ndi.js'
import { LeagueAPI } from './LeagueAPI.class.js'

let config = {
    outputDir: './output',
    googleCVKeysFile: './CV.keys.json',
}

let sectors

if (fs.existsSync('./config.json')) {
    try {
        const configFileData = JSON.parse(fs.readFileSync('./config.json'))

        if (!typeof configFileData === 'object' && configFileData !== null) {
            console.log('config.json was not an object.')
            process.exit(1)
        }

        config = Object.assign(config, configFileData)
    } catch (err) {
        console.log("Couldn't read config.json")
        process.exit(1)
    }
} else {
    console.log(
        'No config found, please create one (config.json) and specify ndiFeed.'
    )
    process.exit(1)
}

if (fs.existsSync('./sectors.json')) {
    try {
        const sectorsFileData = JSON.parse(fs.readFileSync('./sectors.json'))

        if (!Array.isArray(sectorsFileData) && sectorsFileData !== null) {
            console.log('sectors.json was not an array.')
            process.exit(1)
        }

        sectors = sectorsFileData
    } catch (err) {
        console.log("Couldn't read sectors.json")
        process.exit(1)
    }
} else {
    console.log(
        'No sectors found, please create one (sectors.json) and specify sectors.'
    )
    process.exit(1)
}

if (!config.ndiFeed) {
    console.log('"ndiFeed" key not found in config.json.')
    process.exit(1)
}

const CV_CREDENTIALS_PATH = path.join(process.cwd(), config.googleCVKeysFile)
let cvCredentials

if (!fs.existsSync(CV_CREDENTIALS_PATH)) {
    console.log(`Google CV keys file not found at ${config.googleCVKeysFile}.`)
    process.exit(1)
} else {
    try {
        cvCredentials = JSON.parse(fs.readFileSync(CV_CREDENTIALS_PATH))
    } catch (err) {
        console.log("Couldn't read CV credentials file")
    }
}

const OUTPUT_DIR = path.isAbsolute(config.outputDir)
    ? config.outputDir
    : path.join(process.cwd(), config.outputDir)
fs.mkdirSync(OUTPUT_DIR, { recursive: true })

function isBoundingPolyInSector(boundingPoly, sector) {
    for (let i = 0; i < boundingPoly.vertices.length; i++) {
        if (
            boundingPoly.vertices[i].x < sector.left ||
            boundingPoly.vertices[i].x > sector.left + sector.width ||
            boundingPoly.vertices[i].y < sector.top ||
            boundingPoly.vertices[i].y > sector.top + sector.height
        )
            return false
    }

    return true
}

function getImageSectorNameFromBoundingPoly(boundingPoly) {
    for (let i = 0; i < sectors.length; i++) {
        if (isBoundingPolyInSector(boundingPoly, sectors[i])) {
            return sectors[i].name
        }
    }

    return null
}

let processing = false

async function run() {
    const client = new vision.ImageAnnotatorClient({
        credentials: cvCredentials,
    })

    const leagueapi = new LeagueAPI()

    leagueapi.on('update', (data) => {
        writeData(data)
    })

    const ndi = new NDI()

    const maskImg = await Jimp.read('./src/mask.png')
    new Jimp(1920, 70, '#000000', async (err, blankImg) => {
        if (err) {
            console.log(err)
            return
        }

        ndi.on('frame', async (frame) => {
            if (!frame.data || processing) return

            console.time('OCR process time')

            processing = true
            new Jimp(
                { data: frame.data, width: 1920, height: 1080 },
                async (err, image) => {
                    if (err) {
                        console.log(err)
                        return
                    }

                    const processed = await image
                        .crop(0, 0, 1920, 70)
                        .background(0x000000ff)
                        .mask(maskImg, 0, 0)
                        .contrast(1)
                        .threshold({ max: 50 })
                        .composite(blankImg, 0, 0, {
                            mode: Jimp.BLEND_DESTINATION_OVER,
                        })

                    await processed.write('processed.png')

                    const buffer = await processed.getBufferAsync('image/png')

                    const request = {
                        image: {
                            content: buffer,
                        },
                        imageContext: {
                            // This is to stop it detecting non-latin characters instead of numbers
                            languageHints: ['en'],
                        },
                    }
                    const [result] = await client.textDetection(request)

                    const data = {}
                    console.log(
                        result.textAnnotations.map((annotation) => {
                            return annotation.description
                        })
                    )
                    const annotations = result.textAnnotations.map(
                        // stop '0's being recognized as 'D's
                        (annotation) => {
                            return {
                                ...annotation,
                                description:
                                    annotation.description == 'D'
                                        ? '0'
                                        : annotation.description,
                            }
                        }
                    )

                    let baronAlive = true
                    let drakeAlive = true

                    annotations.forEach((annotation) => {
                        if (!annotation.description) return

                        const sectorName = getImageSectorNameFromBoundingPoly(
                            annotation.boundingPoly
                        )
                        if (
                            sectorName === 'baron_timer' ||
                            sectorName === 'drake_timer'
                        ) {
                            if (sectorName === 'baron_timer') baronAlive = false
                            if (sectorName === 'drake_timer') drakeAlive = false

                            if (
                                annotation.description.match(
                                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
                                )
                            ) {
                                data[sectorName] = annotation.description
                            } else {
                                data[sectorName] = ''
                            }
                        } else if (
                            sectorName === 'left_kills' ||
                            sectorName === 'right_kills' ||
                            sectorName === 'left_towers' ||
                            sectorName === 'right_towers' ||
                            sectorName === 'left_heralds' ||
                            sectorName === 'right_heralds' ||
                            sectorName === 'left_drakes' ||
                            sectorName === 'right_drakes'
                        ) {
                            if (!isNaN(parseInt(annotation.description))) {
                                data[sectorName] = annotation.description
                            }
                        } else if (
                            sectorName === 'left_gold' ||
                            sectorName === 'right_gold'
                        ) {
                            if (annotation.description.match(/^[0-9.]*k$/)) {
                                data[sectorName] = annotation.description
                            }
                        } else if (sectorName !== null) {
                            data[sectorName] = annotation.description
                        }
                    })

                    if (baronAlive) data['baron_timer'] = ''
                    if (drakeAlive) data['drake_timer'] = ''

                    writeData(data)

                    console.timeEnd('OCR process time')

                    processing = false
                }
            )
        })

        ndi.start(config.ndiFeed)
    })
}

run()

process.on('SIGINT', () => {
    console.log('Caught interrupt signal')

    process.exit()
})

const pendingWrites = []

function writeData(data) {
    Object.keys(data).forEach((key) => {
        if (pendingWrites.find((str) => str === key)) {
            console.log(`writing "${key}" too fast!`)
            return
        }

        const txtPath = path.join(OUTPUT_DIR, `${key}.txt`)

        pendingWrites.push(key)

        fs.writeFile(txtPath, String(data[key]), 'utf8', (err) => {
            const index = pendingWrites.indexOf(key)
            pendingWrites.splice(index, 1)
        })
    })
}
