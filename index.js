var fileGCS = require('./lib/fileGCS');
var imageGCS = require('./lib/imageGCS');
var imageCropGCS = require('./lib/imageCropGCS');
var imageResizeGCS = require('./lib/imageResizeGCS');

module.exports={
	file: fileGCS,
	image: imageGCS,
	imageCrop: imageCropGCS,
	imageResize: imageResizeGCS,
}