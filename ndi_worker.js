import { parentPort, workerData } from 'worker_threads'

import grandiose from 'grandiose'

const fps = 1

let sources

grandiose.find({
    showLocalSources: true
})
    .then(foundSources => {
        sources = foundSources
        start(workerData)
    })
    .catch(console.error)

async function start(sourceName) {
    const source = sources.find(source => source.name === sourceName)

    if (!source) {
        console.log(`NDI source "${sourceName}" not found.`)
        return
    }

    const receiver = await grandiose.receive({ 
        source: source,
        colorFormat: grandiose.COLOR_FORMAT_RGBX_RGBA,
        allowVideoFields: false
    })

    setInterval(async () => {
        const videoFrame = await receiver.video()
        parentPort.postMessage(videoFrame)
    }, 1000 / fps)
}
