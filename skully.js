const { server } = require("./server");

var fs = require('fs');
var http = require('http').createServer(server); //require http server, and create server with function handler()
var io = require('socket.io')(http); //require socket.io module and pass the http object (server)

var isPi = require('detect-rpi');
if (isPi()) {
  var Gpio = require('pigpio').Gpio;
}

var path = process.cwd();
var buffer = fs.readFileSync(path + "\\servoDefinitions.json");
let servoDefinitions = JSON.parse(buffer);

if (isPi()) {
  servoDefinitions.forEach(function (servo) {
    servo.gpio = new Gpio(servo.pinNumber, { mode: Gpio.INPUT });
    servo.currentPosition = servo.gpio.input();
    servo.gpio = new Gpio(servo.pinNumber, { mode: Gpio.OUTPUT });
  });
} else {
  servoDefinitions.forEach(function (servo) {
    servo.currentPosition = servo.currentPosition;
  });
}

const port = 8080;
http.listen(parseInt(port));
console.info(`Ready to do your bidding on port ${port}`)

io.sockets.on('connection', function (socket) {
  setTimeout(function () {
    socket.emit("send servoDefinitions", servoDefinitions);
  }, 500);

  servoDefinitions.forEach(function (servo) {
    socket.on(servo.description, function (data) {
      servo.desiredPosition = data;
      if (servo.desiredPosition > servo.maxValue) {
        servo.desiredPosition = servo.maxValue;
      }
      if (servo.desiredPosition < servo.minValue) {
        servo.desiredPosition = servo.minValue;
      }
    })
  })
});

setInterval(function () {
  servoDefinitions.forEach(function (servo) {
    let variance = servo.desiredPosition - servo.currentPosition;
    if (variance != 0) {
      servo.currentPosition += Math.sign(variance) * Math.min(Math.abs(variance), servo.maxMove);
      console.log(`Servo ${servo.description} ${servo.currentPosition} -> ${servo.desiredPosition}`);
      if (isPi()) {
        servo.gpio.servoWrite(servo.currentPosition);
      }
    }
  })
}, 10);
