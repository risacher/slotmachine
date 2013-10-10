var util = require('util');

function diagnose (req, res){
    var body = 'Diagnostic module:\n\n';
    body += util.inspect(slots);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', body.length);
    res.end(body);
};

var load = function(slots) {
    slots.app.get('/diagnostic', diagnose);
}

var unload = function(slots) {
    deleteRoute(slots.app, "/diagnostic");
}

function deleteRoute(app, url) {
    for (var i = app.routes.get.length - 1; i >= 0; i--) {
	console.log(app.routes.get[i].path);
	if (app.routes.get[i].path == url) {
	    console.log('deleting');
	    app.routes.get.splice(i, 1);
	}
    }
}

exports.load = load;
exports.unload = unload;