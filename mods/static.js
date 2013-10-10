
var static_middleware = false;

var load = function(slots) {
    console.log("dirname: "+__dirname);
    if (! static_middleware) {
	static_middleware = slots.express.static(__dirname+'/../static');
    }
    slots.use(static_middleware);
};

var unload = function(slots) { slots.unuse(static_middleware); };


exports.load = load;
exports.unload = unload;