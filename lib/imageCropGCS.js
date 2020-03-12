var gm = require('gm').subClass({imageMagick: true});
var filename = require('./filename');
var mime= require("mime-types");
const {upload} = require('gcs-resumable-upload');

module.exports= function (filesObj) {
	
	var PromiseArr= filesObj.map(function (fileObj) {
		return new Promise(function (resolve,reject) {

			console.log('fileObj',fileObj);
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
			});

		});
	});

	return Promise.all(PromiseArr);
}