var filename = require('./filename');
var mime= require("mime-types");
const {upload} = require('gcs-resumable-upload');
var Readable= require('stream').Readable;

module.exports= function (filesObj) {
	
	var PromiseArr= filesObj.map(function (fileObj) {
		return new Promise(function (resolve,reject) {

			if(!fileObj.hasOwnProperty('file') && !fileObj.hasOwnProperty('bucket'))
			{
				reject({err:'Bucket not supplied'});
			}

			var bucket=fileObj.bucket;
			var newFileName;


			const myBucket = new GcsFileUpload({
			  keyFilename: fileObj.servicekey,
			  projectId: fileObj.project,
			}, fileObj.bucket);

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
					keyFilename: fileObj.servicekey
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