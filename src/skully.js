import {server} from './server';
import {performance} from 'perf_hooks';
import {readFileSync, writeFile} from 'fs';

const isPi = require('detect-rpi');
const http = require('http').createServer(server);
const io = require('socket.io')(http);
const player = require('play-sound');
const path = require('path');

const Gpio = isPi() ? require('pigpio').Gpio : null;

const port = 8080;
http.listen(parseInt(port));
console.info(`Ready to do your bidding on port ${port}`);

const songDefinitions = loadObject('./configuration/songDefinitions.json');
const servoDefinitions = loadConfiguration('./configuration/servoDefinitions.json');

let state = {
  'startTime': null,
  'recording': false,
  'songDefinition': null,
}

io.sockets.on('connection', function(socket) {
  setTimeout(function() {
    socket.emit('send servoDefinitions', servoDefinitions);
    socket.emit('send songDefinitions', songDefinitions);
  }, 500);

  songDefinitions.forEach(function(song) {
    socket.on(song.id, function(data) {
      if (data === 'play') {
        const audio = player.play(path.join(process.cwd(), 'assets', song.fileName), function(err) {
          console.log('oops' + JSON.stringify(err));
          if (err && !err.killed) throw err;
        });
      } else if (data === 'record') {
      }
    });
  });

  servoDefinitions.forEach(function(servo) {
    socket.on(servo.description, function(data) {
      servo.desiredPosition = data;
      if (servo.desiredPosition > servo.maxValue) {
        servo.desiredPosition = servo.maxValue;
      }
      if (servo.desiredPosition < servo.minValue) {
        servo.desiredPosition = servo.minValue;
      }
    });
  });
});

setInterval(function() {
  let changed = false;
  servoDefinitions.forEach(function(servo) {
    const variance = servo.desiredPosition - servo.currentPosition;
    if (variance != 0) {
      changed = true;
      servo.currentPosition +=
        Math.sign(variance) * Math.min(Math.abs(variance), servo.maxMove);
      if (isPi()) {
        servo.gpio.servoWrite(servo.currentPosition);
      }
    }
  });
  if (changed) {
    if (state.recording) {
      const positions = servoDefinitions.map((servo) => servo.currentPosition);
      positions.unshift(parseInt(performance.now() - start));
      console.log(JSON.stringify(positions));
    }
  }
}, 10);

/**
 * Resets state
 */
function reset() {
  if (typeof serverDefinitions !== 'undefined') {
    servoDefinitions.forEach(function(servo) {
      if (server.gpio !== null) {
        servo.gpio.destroy();
      }
    });
  }
}

/**
 * Loads configuration
 * @param {string} configPath
 * @return {servoDefinition} servoDefinitions
 */
function loadConfiguration(configPath) {
  reset();

  const servoDefinitions = loadObject(configPath);

  if (isPi()) {
    servoDefinitions.forEach(function(servo) {
      servo.gpio = new Gpio(servo.pinNumber, {mode: Gpio.OUTPUT});
      servo.gpio.servoWrite(servo.currentPosition);
    });
  }

  if (io.sockets.sockets.length > 0) {
    io.sockets.emit('send servoDefinitions', servoDefinitions);
  }
  return servoDefinitions;
}

/**
 * Loads JSON object from file
 * @param {string} fileName
 * @return {any} deserialized object
 */
function loadObject(fileName) {
  const configPath = path.join(process.cwd(), fileName);
  const buffer = readFileSync(configPath);
  return JSON.parse(buffer);
}
