var util = require('util');

function httpReq(req, res, next, slots) {
    if (/^\/hello\/?$/.test(req.url) ) {
	var body = "slots.app = \n";
	body += util.inspect(slots.app);
	res.setHeader('Content-Type', 'text/plain');
	res.setHeader('Content-Length', body.length);
	res.end(body);
	return;
    }
    return next();
}

exports.httpReq = httpReq;
