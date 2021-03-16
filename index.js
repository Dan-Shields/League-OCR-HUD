// Native

// Packages
const { createWorker } = require('tesseract.js');
const Jimp = require('jimp');

// Ours
const ndi = require('./ndi_worker');
const tesseractWorker = createWorker();

const GAME_FEED = {
	name: 'DAN-PC (LeagueIGD)',
	urlAddress: '192.168.0.24:5961'
};

const imageSectors = [
	{
		left: 760,
		top: 17,
		width: 85,
		height: 20,
		name: 'blue_gold'
	}
];

let processing = false;

async function run () {
	await tesseractWorker.load();
	await tesseractWorker.loadLanguage('eng');
	await tesseractWorker.initialize('eng');

	ndi.on('frame', async frame => {
		if (!frame.data || processing) return;

		processing = true;

		console.log('started processing frame');

		new Jimp({ data: frame.data, width: 1920, height: 1080 }, async (err, image) => {
			if (err) {
				console.log(err);
				return;
			}

			const buffer = await image.getBufferAsync('image/png');

			console.log('encoded frame');

			console.time('tesseract recog');

			const { data: { text } } = await tesseractWorker.recognize(buffer, { rectangle: imageSectors[0] });
			console.log('result: ', text);
			
			console.timeEnd('tesseract recog');

			processing = false;
		});

		return;

		imageSectors.forEach(async rectangle => {
			const { data: { text } } = await tesseractWorker.recognize(frame.data, { rectangle });
			values[rectangle] = text;
		});

		console.log(values);
	});

	ndi.startNDICapture(GAME_FEED);
}

run();

process.on('SIGINT', async () => {
	console.log("Caught interrupt signal");

	await tesseractWorker.terminate();
	process.exit();        
});
