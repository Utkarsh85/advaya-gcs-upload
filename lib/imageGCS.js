var gm = require('gm').subClass({imageMagick: true});
var filename = require('./filename');
var mime= require("mime-types");
const {upload} = require('gcs-resumable-upload');
var path= require('path');
var createKeys= require('../utils/createKeys');

module.exports= function (filesObj) {
	
	var PromiseArr= filesObj.map(function (fileObj) {
		return new Promise(function (resolve,reject) {

			if(!process.env.hasOwnProperty('GCS_PRIVATE_KEY') || !process.env.hasOwnProperty('GCS_CLIENT_EMAIL'))
			{
				reject({err:'GCS Credentials not supplied'});
			}
			createKeys(process.env.GCS_PRIVATE_KEY,process.env.GCS_CLIENT_EMAIL);

			if(!fileObj.hasOwnProperty('file') && !fileObj.hasOwnProperty('bucket'))
			{
				reject({err:'Bucket not supplied'});
			}

			var bucket=fileObj.bucket;
			var newFileName;

			if(fileObj.hasOwnProperty('name'))
				newFileName=fileObj.name+'.'+mime.extension(fileObj.file.mimetype);
			else
				newFileName=filename()+'.'+mime.extension(fileObj.file.mimetype);
			
			gm(fileObj.file.buffer)
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