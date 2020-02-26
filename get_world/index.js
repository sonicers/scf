'use strict'

const zmq = require("zeromq")

exports.main_handler = async (event, context) => {

sock = zmq.socket("push");

sock.bindSync("tcp://127.0.0.1:3000");
console.log("Producer bound to port 3000");

setInterval(function() {
    console.log("sending work");
    sock.send("some work");
    }, 500);
}