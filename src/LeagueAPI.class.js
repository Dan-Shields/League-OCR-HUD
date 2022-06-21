import EventEmitter from 'events'
import https from 'https'

const emitter = new EventEmitter()
export default emitter

const params = {
    hostname: '127.0.0.1',
    port: 2999,
    path: '/liveclientdata/allgamedata',
    method: 'GET',
    rejectUnauthorized: false,
    agent: false
}

function httpRequest() {
    return new Promise(function (resolve, reject) {
        const req = https.request(params, res => {
            if (res.statusCode != 200) {
                reject(`statusCode: ${res.statusCode}`)
            }
            //create an empty buffer to add the new data to
            let data = Buffer.from("")

            res.on('data', d => {
                //".concat" adds the new buffered data to my empty buffer
                data = Buffer.concat([data, d])
            })
            res.on('close', () => {
                //result is an object from the json of a string from the buffer
                const result = JSON.parse(data.toString())
                //resolve the promise with the new object
                resolve(result)
            })
        })

        req.on('error', error => {
            //reject the promise with the error of why it is rejected
            reject(error)
        })
        req.end()
    })
}

export class LeagueAPI extends EventEmitter {
    constructor() {
        super()

        this.disconnected = false

        setInterval(() => { this.fetch() }, 500)
    }

    async fetch() {
        try {
            const data = await httpRequest()

            this.disconnected = false

            const time_minutes = Math.floor(data.gameData.gameTime / 60).toString().padStart(2, 0)
            const time_seconds = Math.floor(data.gameData.gameTime - (time_minutes * 60)).toString().padStart(2, 0)
            const gametime = `${time_minutes}:${time_seconds}`

            this.emit("update", { gametime })
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                if (!this.disconnected) {
                    console.log("COULDN'T CONNECT TO LEAGUE API")
                    this.disconnected = true
                }
            } else {
                console.error(error)
            }
        }
    }
}