var gm = require('gm').subClass({imageMagick: true});
var filename = require('./filename');
var mime= require("mime-types");
const {upload} = require('gcs-resumable-upload');

module.exports= function (filesObj) {
	
	var PromiseArr= filesObj.map(function (fileObj) {
		return new Promise(function (resolve,reject) {

			if(!fileObj.hasOwnProperty('file') || !fileObj.hasOwnProperty('resize') )
			{
				reject({err:'Required parameters resize not supplied'});
			}


			var bucket=fileObj.bucket;
			var resize= fileObj.resize || 60;
			var newFileName;

			if(fileObj.hasOwnProperty('name'))
				newFileName=fileObj.name+'.'+mime.extension(fileObj.file.mimetype);
			else
				newFileName=filename()+'.'+mime.extension(fileObj.file.mimetype);

			gm(fileObj.file.buffer)
			.size(function (err,size) {
				if(err)
					return reject(err);
				if(fileObj.hasOwnProperty('minWidth') && fileObj.hasOwnProperty('minHeight'))
				{
					// console.log(size);
					if(size.width< fileObj.minWidth || size.height <fileObj.minHeight)
						return reject({msg:'Image file should be '+fileObj.minWidth+'x'+fileObj.minHeight+' minimum.'});

					else
					{
						gm(fileObj.file.buffer)
						.resize(null,resize)
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
					}
				}

				else
				{
					gm(fileObj.file.buffer)
					.resize(null,resize)
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
						resolve([{
							Location: `https://storage.googleapis.com/${fileObj.bucket}/${newFileName}`
						}])
					})
					.on('error', (err) => {
						reject(err)
					});
				}
			})
			
			

		});
	});

	return Promise.all(PromiseArr);
}