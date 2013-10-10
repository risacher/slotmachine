"use strict";

var slotmachine = require('./lib/slotmachine');
var slots = new slotmachine(); 


slots.loadMod("test");
slots.loadMod("diagnostic");
slots.loadMod("static");
slots.loadMod("hello");
slots.loadMod("mods");

slots.app.get('/', function(req, res){
    var body = 'Hello World';
    body += JSON.stringify(slots.mods);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', body.length);
    res.end(body);
});



slots.listen(3001);
console.log('Listening on port 3001');

