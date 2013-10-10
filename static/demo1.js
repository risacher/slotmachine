"use strict";
/* global $:false, jQuery:false */

var socket;

$.getScript("socket.io/socket.io.js", function() {

    var
    pathComponents = document.location.pathname.split('/'),
    // Strip last part (either index.html or "", presumably)
    baseURL = pathComponents.slice(0,pathComponents.length-1).join('/') + '/',
    resource = baseURL.substring(1) + "socket.io";
    socket = io.connect(null, { resource: resource });
    

});