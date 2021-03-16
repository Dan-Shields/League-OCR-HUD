const EventEmitter = require('events').EventEmitter;
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

const fps = 1;

if (isMainThread) {
	module.exports = new EventEmitter();

	module.exports.startNDICapture = function startNDICapture(gameFeed) {
		const worker = new Worker(__filename, {
			workerData: gameFeed
		});

		worker.on('message', data => {
			if (data.data) {
				module.exports.emit('frame', data);
			}
		});

		worker.on('error', () => {
			console.error('error in ndi worker');
		});

		worker.on('exit', (code) => {
			if (code !== 0)
			console.error(new Error(`Worker stopped with exit code ${code}`));
		});
	};
} else {
	// Packages
	const grandiose = require('grandiose');
	
	grandiose.find({
		showLocalSources: true
	})
		.then(sources => {
			console.log(sources);
			start(workerData);
		})
		.catch(console.error);

	async function start(source) {
		const receiver = await grandiose.receive({ 
			source: source,
			colorFormat: grandiose.COLOR_FORMAT_RGBX_RGBA,
			allowVideoFields: false
		});

		setInterval(async () => {
			const videoFrame = await receiver.video();
			parentPort.postMessage(videoFrame);
		}, 1000 / fps);
	}
}
