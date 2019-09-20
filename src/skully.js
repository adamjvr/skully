import {server} from './server';
import {performance} from 'perf_hooks';
import {readFileSync, appendFileSync} from 'fs';
import {mode} from './mode';

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
  'mode': mode.Idle,
  'songDefinition': null,
}

io.sockets.on('connection', function(socket) {
  setTimeout(function() {
    socket.emit('send servoDefinitions', servoDefinitions);
    socket.emit('send songDefinitions', songDefinitions);
  }, 500);

  songDefinitions.forEach(function(song) {
    socket.on(song.id, function(data) {
      if (isPi()) {
        const audio = player.play(path.join(process.cwd(), 'assets', song.fileName), function(err) {
          console.log('oops' + JSON.stringify(err));
          if (err && !err.killed) throw err;
        });
      }
      state.startTime = performance.now();
      state.songDefinition = song;
      state.mode = (data === 'play') ? mode.Playing : mode.Recording;
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

setInterval(moveServos(), 10);

/**
 * Moves servos
 */
function moveServos() {
  return function () {
    let changed = false;
    servoDefinitions.forEach(function (servo) {
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
        positions.unshift(parseInt(performance.now() - state.startTime));
        appendFileSync(path.join(process.cwd(), state.songDefinition.fileName + '.move'), JSON.stringify(positions) + '\n');
      }
    }
  };
}

/**
 * Resets state
 * @param {servoDefinition} servoDefinitions
 */
function reset(servoDefinitions) {
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
