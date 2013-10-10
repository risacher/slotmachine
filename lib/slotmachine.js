"use strict";

var express = require('express');
var util = require("util");
var http = require('http');
var socketio = require('socket.io');

function slotmachine() {
    this.modDir = process.cwd()+"/mods/";
    this.app = express();
    this.server = http.createServer(this.app);

    this.io = socketio.listen(this.server);

    this.io.sockets.on('connection', function (socket) {
	socket.on('message', invokeSocketIOModules);
	socket.on('disconnect', function () { });
    } );

    this.express = express;
    this.mods = {};
    this.mod_names = [];

    var self = this;
    this.app.use(function() { return invokeHttpModules.apply(self, arguments); } );
    return this;
};

// A module should be able to catch socket.io events as well as URLs.
// Or even events for some other type of object (such as mpd sockets).
// Since socket.io connections are long-lived, it should be the case
// that reloading a module will change the API for all *new*
// connections, but not for existing ones.  

// What is the right API for loading a module (or invoking it?)  In
// the original (perl) Priscilla architecture, I used namespaces
// (packages), so that I could delete the module by deleting
// everything in the namespace.  Javascript doesn't have as clean of
// an implementation of namespaces, as far as I can tell.  But it does
// have hash objects, which I guess is about the same.

// So... loading a module could just return an object.  The object
// would have methods for web requests, socket.io events, etc.

// For web events, we iterate through the modules and call
// module.httpReq(req, res, next) for each one, much like express
// does.  The only advantage of doing it as a priscilla module
// (instead of express middleware) would be the ability to unload or
// reload the module.

// NO NO NO NO NO!  Just use the connect middleware processor that
// already exists, dammit.  To unload the module, break the connect
// abstraction barrier and delete your functions from the rep.

// For socket.io events, we should do the same thing, except that we
// should call the module.sockMsg() method on receiving the
// socket.on('message'...) event.  Fuck a duck.  This is confusing.  I
// think I should go back to the iterative plan I had before.

// So... then how do we do something like 'connect' but for socket.io?
// I could replicate connect for socket.io, but it seems worthwhile to
// see if it has already been done.  Hell, connect might already do
// it.

// Maybe I need two kinds of modules - "modules" and "plugins".  A
// plugin would be the dispatch mechanism for some async protocol,
// such as http, socket.io, irc, mpdsocket, etc.

// Also need to think through what kind of template engine I want to
// use.

var http_next = new String ("next return value");
function invokeHttpModules(req, res, next) { 
    // call next() to invoke the next middleware. return without calling
    // next() if you handle the request and no further middleware
    // should run

    // these are String objects instead of string literals for a reason.
    function next_internal (err) {
	if (!err) {
	    return http_next;
	}
	if (Object.prototype.toString.call(err) == "[object Error]") {
	    return err;
	}
	if (typeof(err) == 'string') {
	    return new Error(err);
	}
	console.log("This should never happen: typeof(err) = ", typeof(err));
	return false;
     }

    for (var i=0; i< this.mod_names.length; i++) {
	var modName = this.mod_names[i];
	if (typeof this.mods[modName]['httpReq'] == 'function') {
	    var r;
	    try {
 		r = this.mods[modName]['httpReq'](req, res, next_internal, this);
	    } catch (e) {
		console.log("error in httpReq of module ",modName);
		r = e;
	    }
	    if (r === http_next) { continue ; }
	    if (Object.prototype.toString.call(r) == "[object Error]") {
		//  What do I do? Do I continue or error out?  
		// Presumably, if there was an error in some module, I should log it and go on.
		console.log("Error in module ", modName, ": ", r);
		console.log(r.stack);
		this.lastErr = r;
		continue;
	    }
	    // if the module didn't return next() and it didn't return
	    // an error then it handled the request and we should
	    // stop processing. 
	    console.log("request:", req.url, "handled by",modName);
	    return r;
	}
    }

    // this is the "connect/express" next, not mine
    console.log("fell through for request:", req.url);
    return next();
};

var socketio_next = new String ("SocketIO next");
function invokeSocketIOModules(message) { 
    function next_internal (err) {
	if (!err) {
	    return socketio_next;
	}
	if (Object.prototype.toString.call(err) == "[object Error]") {
	    return err;
	}
	if (typeof(err) == 'string') {
	    return new Error(err);
	}
	console.log("This should never happen: typeof(err) = ", typeof(err));
	return false;
     }

    for (var i=0; i< this.mod_names.length; i++) {
	var modName = this.mod_names[i];
	if (typeof this.mods[modName]['socket'] == 'function') {
	    var r;
	    try {
 		r = this.mods[modName]['socket'](req, res, next_internal, this);
	    } catch (e) {
		console.log("error in httpReq of module ",modName);
		r = e;
	    }
	    if (r === socketio_next) { continue ; }
	    if (Object.prototype.toString.call(r) == "[object Error]") {
		//  What do I do? Do I continue or error out?  
		// Presumably, if there was an error in some module, I should log it and go on.
		console.log("Error in module ", modName, ": ", r);
		console.log(r.stack);
		this.lastErr = r;
		continue;
	    }
	    // if the module didn't return next() and it didn't return
	    // an error then it handled the request and we should
	    // stop processing. 
	    return r;
	}
    }
};

slotmachine.prototype.loadMod = function(modName) {
    // What if the module was already loaded?  Reload it, I guess.
    this.unloadMod(modName);

    var path = this.modDir+modName;
    try {
	console.log("begin loading "+modName);
	this.mods[modName] = require(path);
	this.mod_names.push(modName);
	if (typeof this.mods[modName]['load'] == 'function') {
	    console.log("calling load "+modName);
	    this.mods[modName]['load'](this);
	}
	console.log("done loading "+modName);
    } catch (e) {
	console.log("error while loading module "+modName);
	console.log(e);
	this.lastErr = e;
	return e;
    }
    return;
}

slotmachine.prototype.use = function(middleware) { this.app.use(middleware); };

slotmachine.prototype.unuse = function(middleware) {
    var app = this.app;
    for(var i = app.stack.length-1; i >0; i--) {
	if (app.stack[i].handle === middleware) {
	    app.stack.splice(i,1);
	}
    }
}

slotmachine.prototype.unloadMod = function(modName) {
    console.log("req unload '%s'",modName);
    if (this.mods[modName]) {
	if (typeof this.mods[modName]['unload'] == 'function') {
	    console.log("calling unload "+modName);
	    try {
		this.mods[modName]['unload'](this);
	    } catch (e) {
		console.log("error while loading module "+modName);
		console.log(e);
		this.lastErr = e;
		// don't return the error because we still should try to unload it.
		// return e;
	    }
	}
	delete this.mods[modName];
	var index = this.mod_names.indexOf(modName);    
	if (index !== -1) {
	    this.mod_names.splice(index, 1);
	}
    }
    var path = this.modDir+modName;
    if (! /\.js$/.test(path)) { path += '.js'; };
//    console.log("path to unload: ",path);
    if (require.cache[require.resolve(path)]) {
	delete require.cache[require.resolve(path)];
    };
}


slotmachine.prototype.listen = function(port) {
    this.server.listen(port);
}


exports = module.exports = slotmachine;
