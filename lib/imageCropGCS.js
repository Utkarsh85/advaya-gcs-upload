var gm = require('gm').subClass({imageMagick: true});
var filename = require('./filename');
var mime= require("mime-types");
const {upload} = require('gcs-resumable-upload');
var createKeys= require('../utils/createKeys');

module.exports= function (filesObj) {
	
	var PromiseArr= filesObj.map(function (fileObj) {
		return new Promise(function (resolve,reject) {

			if(!process.env.hasOwnProperty('GCS_PRIVATE_KEY') || !process.env.hasOwnProperty('GCS_CLIENT_EMAIL'))
			{
				reject({err:'GCS Credentials not supplied'});
			}
			createKeys(process.env.GCS_PRIVATE_KEY,process.env.GCS_CLIENT_EMAIL);
			
			if(!fileObj.hasOwnProperty('file') || !fileObj.hasOwnProperty('w') || !fileObj.hasOwnProperty('h')|| !fileObj.hasOwnProperty('top') || !fileObj.hasOwnProperty('left') || !fileObj.hasOwnProperty('bucket') || !fileObj.w || !fileObj.h || !fileObj.top || !fileObj.left || !fileObj.bucket)
			{
				reject({err:'Required parameters w, h, top, left not supplied'});
			}


			var bucket=fileObj.bucket;
			var acl=fileObj.acl || "public-read";
			var resize= fileObj.resize || 60;
			var newFileName;

			if(fileObj.hasOwnProperty('name'))
				newFileName=fileObj.name+'.'+mime.extension(fileObj.file.mimetype);
			else
				newFileName=filename()+'.'+mime.extension(fileObj.file.mimetype);

			
			gm(fileObj.file.buffer)
     		.crop(fileObj.w, fileObj.h, fileObj.top, fileObj.left)
			.resize(resize,resize)
			.stream()
			.pipe(upload({
				bucket: fileObj.bucket,
				file: newFileName,
				public: true,
				authConfig:{
					projectId: fileObj.project,
					keyFilename: path.resolve(__dirname,'../gcs-keys.json')
				},
				metadata:{
					contentDisposition: 'inline',
					contentType: fileObj.file.mimetype
				}
			}))
			.on('finish', () => {
				resolve({
					Location: `https://storage.googleapis.com/${fileObj.bucket}/${newFileName}`
				})
			})
			.on('error', (err) => {
				reject(err)
			});

		});
	});

	return Promise.all(PromiseArr);
}