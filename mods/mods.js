"use strict";

var util = require('util');
var fs = require('fs');


function httpReq(req, res, next, slots) {
    if (/^\/mods\/$/.test(req.url)) return modDir(req, res, next, slots);
    if (/^\/mods\/load\/[a-zA-Z]+$/.test(req.url)) return loadMod (req, res, next, slots);
    if (/^\/mods\/unload\/[a-zA-Z]+$/.test(req.url)) return unloadMod (req, res, next, slots);
    return next();
}

exports.httpReq = httpReq;

function loadMod(req, res, next, slots) {
    var matches = /^\/mods\/load\/([a-zA-Z]+)$/.exec(req.url);
    var r = slots.loadMod(matches[1]);
    var body = "";
    if (r) {
	body += util.inspect(r);
	res.setHeader('Content-Type', 'text/plain');
	res.setHeader('Content-Length', body.length);
	res.end(body);
	return;
    }
    res.writeHead(302, {
	'Location': '..'
	//add other headers here...
    });
    res.end();
}

function unloadMod(req, res, next, slots) {
    var matches = /^\/mods\/unload\/([a-zA-Z]+)$/.exec(req.url);
    var r = slots.unloadMod(matches[1]);
    var body = "";
    if (r) {
	body += util.inspect(r);
	res.setHeader('Content-Type', 'text/plain');
	res.setHeader('Content-Length', body.length);
	res.end(body);
	return;
    }
    res.writeHead(302, {
	'Location': '..'
	//add other headers here...
    });
    res.end();
}

	
function modDir (req, res, next, slots) {
    var dirents = fs.readdirSync(slots.modDir);
    var modsAvailable = [];
    dirents.forEach(function (e) {
	if (/.js$/.test(e)) {
	    modsAvailable.push(e.replace('.js',''));
	}
    });
    
    var body = "";
    // time to use a template engine.
    // put them in order
    modsAvailable.forEach(function (m) {
	body += "<p>" + m;
	if (slots.mods[m]) {
	    body += " <a href=\'./load/"+m+"'>reload</a>";
	    body += " <a href=\'./unload/"+m+"'>unload</a>";
	} else {
	    body += " <a href=\'./load/"+m+"'>load</a>";
	}
	body += "</p>";
    });	    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', body.length);
    res.end(body);
    return;
}

