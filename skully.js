const { server } = require("./server");

var fs = require('fs');
var http = require('http').createServer(server); //require http server, and create server with function handler()
var io = require('socket.io')(http); //require socket.io module and pass the http object (server)
var player = require('play-sound')(opts = {})

var isPi = require('detect-rpi');
if (isPi()) {
  var Gpio = require('pigpio').Gpio;
}

const port = 8080;
http.listen(parseInt(port));
console.info(`Ready to do your bidding on port ${port}`)

var path = process.cwd();
var configPath = path + "/servoDefinitions.json";

let servoDefinitions = loadConfiguration(configPath);
fs.watchFile(configPath, (curr, prev) => {
  console.info('Reloading file');
  servoDefinitions = loadConfiguration(configPath);
});

console.log(JSON.stringify(servoDefinitions));

io.sockets.on('connection', function (socket) {
  setTimeout(function () {
    socket.emit("send servoDefinitions", servoDefinitions);
  }, 500);

  socket.on("center", function (data) {
    servoDefinitions.forEach(function (servo) {
      servo.centerPosition = servo.currentPosition;
      servo.desiredPosition = servo.centerPosition;
    });

    var text = JSON.stringify(servoDefinitions, (key, value) => { if (key==="gpio") return undefined; else return value }, 1);
    fs.writeFile(configPath, text);
  });

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

function reset() {
  if (typeof serverDefinitions !== 'undefined') {
    servoDefinitions.forEach(function (servo) {
      if (server.gpio !== null) {
        servo.gpio.destroy();
      }
    });
  }
}

function loadConfiguration(configPath) {
  reset();

  var buffer = fs.readFileSync(configPath);
  let servoDefinitions = JSON.parse(buffer);

  if (isPi()) {
    servoDefinitions.forEach(function (servo) {
      servo.gpio = new Gpio(servo.pinNumber, { mode: Gpio.OUTPUT });
      servo.gpio.servoWrite(servo.currentPosition);
    });
  }

  if (io.sockets.sockets.length > 0) {
    io.sockets.emit("send servoDefinitions", servoDefinitions);
  }
  return servoDefinitions;
}