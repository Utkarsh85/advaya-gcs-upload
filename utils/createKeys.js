var created= false;
var fs= require('fs');
var path= require('path');

module.exports= function (private_key,email) {
	if(!created)
	{
		fs.writeFileSync(path.resolve(__dirname,'../gcs-keys.json'),`{"private_key":"${private_key}","email":"${email}"}`);
		created= true;
	}
}