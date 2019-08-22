const { server } = require("./server");

var http = require('http').createServer(server); //require http server, and create server with function handler()
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
const Gpio = require('pigpio').Gpio;
const rotateMotor = new Gpio(26, { mode: Gpio.OUTPUT });
const tiltMotor = new Gpio(6, { mode: Gpio.OUTPUT });
const nodMotor = new Gpio(13, { mode: Gpio.OUTPUT });
const mouthMotor = new Gpio(5, { mode: Gpio.OUTPUT });
const port = 8080;

http.listen(parseInt(port));
console.info(`Ready to do your bidding ${port}`)

var positions = {
  rotate: 1500,
  tilt: 1400,
  nod: 1400,
  mouth: 1000
}

move(positions);

io.sockets.on('connection', function (socket) {
  socket.on('rotate', function (data) {
    positions.rotate = data;
    move(positions);
  });
  socket.on('tilt', function (data) {
    positions.tilt = data;
    move(positions);
  });
  socket.on('nod', function (data) {
    positions.nod = data;
    move(positions);
  });
  socket.on('mouth', function (data) {
    positions.mouth = data;
    move(positions);
  });

});

function move(positions) {
  limit(positions);
  console.log(JSON.stringify(positions));
  rotateMotor.servoWrite(positions.rotate);
  tiltMotor.servoWrite(positions.tilt);
  nodMotor.servoWrite(positions.nod);
  mouthMotor.servoWrite(positions.mouth);
}

function limit(positions) {
  if (positions.nod < 1100) positions.nod = 1100;
  if (positions.nod > 1600) positions.nod = 1600;
  if (positions.tilt < 1100) positions.tilt = 1100;
  if (positions.tilt > 1600) positions.tilt = 1600;
}