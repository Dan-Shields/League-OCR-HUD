import { EventEmitter } from 'events'
import { Worker } from 'worker_threads'

export default class NDI extends EventEmitter {
    start(gameFeedData) {
        const worker = new Worker('./ndi_worker.js', {
            workerData: gameFeedData
        })
    
        worker.on('message', data => {
            if (data.data) {
                this.emit('frame', data)
            }
        })
    
        worker.on('error', () => {
            console.error('error in ndi worker')
        })
    
        worker.on('exit', (code) => {
            if (code !== 0)
                console.error(new Error(`Worker stopped with exit code ${code}`))
        })
    }
}
