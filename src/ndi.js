import { EventEmitter } from 'events'
import { Worker } from 'worker_threads'

export default class NDI extends EventEmitter {
    start(gameFeedName) {
        const worker = new Worker(new URL('./ndi_worker.js', import.meta.url), {
            workerData: gameFeedName
        })
    
        worker.on('message', data => {
            if (data.data) {
                this.emit('frame', data)
            }
        })
    
        worker.on('error', (e) => {
            console.error(`error in ndi worker: ${e}`)
        })
    
        worker.on('exit', (code) => {
            if (code !== 0)
                console.error(new Error(`Worker stopped with exit code ${code}`))
        })
    }
}
