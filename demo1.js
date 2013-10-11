"use strict";

var slotmachine = require('./lib/slotmachine');
var slots = new slotmachine(); 


slots.loadMod("test");
slots.loadMod("diagnostic");
slots.loadMod("static");
slots.loadMod("hello");
slots.loadMod("mods");

slots.app.get('/', function(req, res){
    res.writeHead(302, {
	'Location': './index.html'
    });
    res.end();
});

slots.listen(3001);
console.log('Listening on port 3001');

