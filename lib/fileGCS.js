var filename = require('./filename');
var mime= require("mime-types");
const {upload} = require('gcs-resumable-upload');
var Readable= require('stream').Readable;
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


			var readable = new Readable({

				read: function () {

				}
			});


			readable
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
			})


			readable.push(fileObj.file.buffer);
			readable.push(null);

		});
	});

	return Promise.all(PromiseArr);
}