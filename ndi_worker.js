import { parentPort, workerData } from 'worker_threads'

import grandiose from 'grandiose'

const fps = 1

grandiose.find({
    showLocalSources: true
})
    .then(sources => {
        console.log(sources)
        start(workerData)
    })
    .catch(console.error)

async function start(source) {
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
