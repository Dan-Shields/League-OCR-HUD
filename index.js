// Native
import fs from 'fs'
import path from 'path'

// Packages
import vision from '@google-cloud/vision'
import Jimp from 'jimp'

// Ours
import NDI from './ndi.js'
import { LeagueAPI } from './LeagueAPI.class.js'

const GAME_FEED = {
    name: 'DAN-PC (LeagueIGD)',
    urlAddress: '192.168.0.24:5963'
}

const imageSectors = [
    {
        left: 758,
        top: 7,
        width: 90,
        height: 45,
        name: 'left_gold'
    },
    {
        left: 1140,
        top: 7,
        width: 90,
        height: 45,
        name: 'right_gold'
    },
    {
        left: 1804,
        top: 33,
        width: 81,
        height: 45,
        name: 'baron_timer'
    },
    {
        left: 70,
        top: 33,
        width: 81,
        height: 45,
        name: 'drake_timer'
    }
]

function isBoundingPolyInSector(boundingPoly, sector) {
    for (let i = 0; i < boundingPoly.vertices.length; i++) {
        if (boundingPoly.vertices[i].x < sector.left || boundingPoly.vertices[i].x > sector.left + sector.width ||
            boundingPoly.vertices[i].y < sector.top  || boundingPoly.vertices[i].y > sector.top + sector.height) 
            return false
    }

    return true
}

function getImageSectorNameFromBoundingPoly(boundingPoly) {
    for (let i = 0; i < imageSectors.length; i++) {
        if (isBoundingPolyInSector(boundingPoly, imageSectors[i])) {
            return imageSectors[i].name
        }
    }

    return null
}

let processing = false

async function run () {
    const client = new vision.ImageAnnotatorClient({
        credentials: JSON.parse(fs.readFileSync('./CV.keys.json'))
    })

    const leagueapi = new LeagueAPI()

    leagueapi.on("update", data => {
        writeData(data)
    })


    const ndi = new NDI()

    ndi.on('frame', async frame => {
        if (!frame.data || processing) return

        console.time('process time')

        processing = true

        console.log('started processing frame')

        new Jimp({ data: frame.data, width: 1920, height: 1080 }, async (err, image) => {
            if (err) {
                console.log(err)
                return
            }

            const cropped = await image.crop(0, 0, 1920, 100)

            const buffer = await cropped.getBufferAsync('image/png')

            console.log('encoded frame')
            console.time('cv api recog')

            const request = {
                image: {
                    content: buffer
                }
            }
            const [result] = await client.textDetection(request)

            const data = {}

            result.textAnnotations.forEach(annotation => {
                if (!annotation.description) return

                const sectorName = getImageSectorNameFromBoundingPoly(annotation.boundingPoly)
                if (sectorName) {
                    if (sectorName === 'baron_timer' || sectorName === 'drake_timer') {
                        if (annotation.description.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
                            data[sectorName] = annotation.description
                        }
                    } else if (sectorName === 'left_kills' || sectorName === 'right_kills') {
                        if (!isNaN(parseInt(annotation.description))) {
                            data[sectorName] = annotation.description
                        }
                    } else if (sectorName === 'left_gold' || sectorName === 'right_gold') {
                        if (annotation.description.match(/^[0-9.]*k$/)) {
                            data[sectorName] = annotation.description
                        }
                    } else {
                        data[sectorName] = annotation.description
                    }
                }
            })

            console.log(data)
            writeData(data)

            console.timeEnd('cv api recog')
            console.timeEnd('process time')

            processing = false
        })
    })

    ndi.start(GAME_FEED)
}

run()

process.on('SIGINT', async () => {
    console.log("Caught interrupt signal")

    process.exit()     
})

const pendingWrites = []

function writeData(data) {
    Object.keys(data).forEach(key => {
        if (pendingWrites.find(str => str === key)) {
            console.log('writing too fast!')
            return
        }

        const txtPath = path.join(process.cwd(), '/output/', `${key}.txt`)

        pendingWrites.push(key)

        fs.writeFile(txtPath, data[key], 'utf8', () => {
            const index = pendingWrites.indexOf(key)
            pendingWrites.splice(index, 1)
        })
    })
}
