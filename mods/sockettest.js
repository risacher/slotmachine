var io;
var countdown;
var intervalId;

exports.load = function load(slots) {
    io = slots.io;
    countdown = 1000;

    console.log("loading sockettest");

    intervalId = setInterval(function() {
	console.log("countdown ", countdown);
	countdown--;
	io.sockets.emit('timer', { countdown: countdown });
    }, 1000);

    io.sockets.on('connection', function (socket) {
	socket.on('reset', function (data) {
	    countdown = 1000;
	    io.sockets.emit('timer', { countdown: countdown });
	});
    });
}

exports.unload = function unload(slots) {
    clearInterval(intervalId);
}

exports.httpReq = function httpReq(req, res, next, slots) {
    return next();
}

exports.socket = function socket(message, next, slots) {
    console.log("message: ", message);
    return next();
}