import { server } from "./server";
import { performance } from "perf_hooks";
import { readFileSync, appendFileSync, existsSync } from "fs";
import { mode } from "./mode";

const isPi = require("detect-rpi");
const http = require("http");
const socket = http.createServer(server);
const io = require("socket.io")(socket);
const player = require("play-sound")();
const path = require("path");
const Gpio = isPi() ? require("pigpio").Gpio : null;
let OnOff = require("onoff").Gpio; //include onoff to interact with the GPIO

const lineByLine = require("n-readlines");

const LED = new OnOff(25, "out"); //use GPIO pin 4 as output
const pushButton = new OnOff(23, "in", "both"); //use GPIO pin 17 as input, and 'both' button presses, and releases should be handled

const fs = require('fs');
const https = require('https');

const express = require("express");
const verifier = require('alexa-verifier-middleware');
const app = express();
const PORT = process.env.PORT || 3000;
const FredRouter = require("./FredRouter");
const bodyParser = require("body-parser");

// Certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/api.danleach.dev/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/api.danleach.dev/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/api.danleach.dev/chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

app.use(verifier);
app.use(bodyParser.json());
app.use("/fred", FredRouter);

// Starting both http & https servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
	console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});

let audio = null;

const port = 8080;
socket.listen(parseInt(port));
console.info(`Ready to do your bidding on port ${port}`);

const songDefinitions = loadObject("./configuration/songDefinitions.json");
const servoDefinitions = loadConfiguration(
  "./configuration/servoDefinitions.json"
);

let lineReader = null;
let nextLine = null;

let state = {
  startTime: null,
  mode: mode.Idle,
  songDefinition: null
};

io.sockets.on("connection", function(socket) {
  setTimeout(function() {
    socket.emit("send servoDefinitions", servoDefinitions);
    socket.emit("send songDefinitions", songDefinitions);
  }, 500);

  songDefinitions.forEach(function(song) {
    socket.on(song.id, function(data) {
      startSong(song, data);
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
setInterval(playback(), 10);
setInterval(blinkState(), 200);

let blinkValue = 0;
let lastState = -1;

pushButton.watch(function(err, value) {
  //Watch for hardware interrupts on pushButton GPIO, specify callback function
  if (err) {
    //if an error
    console.error("There was an error", err); //output error message to console
    return;
  }
  if (value !== lastState) {
    lastState = value;
    if (value === 0) {
      var song =
        songDefinitions[Math.floor(Math.random() * songDefinitions.length)];
      startSong(song, "play");
    }
  }
});

/**
 * Launch song
 */
function startSong(song, data) {
  if (isPi()) {
    if (audio !== null) {
      audio.kill();
      audio = null;
    }
    audio = player.play(
      path.join(process.cwd(), "assets", song.fileName),
      function(err) {
        console.log("oops" + JSON.stringify(err));
        if (err && !err.killed) throw err;
      }
    );
  }
  state.startTime = performance.now();
  state.songDefinition = song;
  state.mode = data === "play" ? mode.Playing : mode.Recording;
  const moveFile = path.join(
    process.cwd(),
    state.songDefinition.fileName + ".move"
  );
  if (state.mode === mode.Playing && existsSync(moveFile)) {
    lineReader = new lineByLine(moveFile);
  } else {
    lineReader = null;
  }
}

/**
 * Blinks to show what's up
 */
function blinkState() {
  return function() {
    if (state.mode === mode.Playing) {
      LED.writeSync(1);
    } else if (state.mode === mode.Recording) {
      LED.writeSync(blinkValue);
      blinkValue = 1 - blinkValue;
    } else {
      LED.writeSync(0);
    }
  };
}

/**
 * Plays back song
 */
function playback() {
  return function() {
    if (state.mode !== mode.Playing) {
      return;
    }

    if (typeof lineReader === "undefined" || lineReader === null) {
      state.mode = mode.Idle;
      return;
    }

    if (typeof nextLine === "undefined" || nextLine === null) {
      state.startTime = performance.now();
      const dataLine = lineReader.next().toString("ascii");
      if (dataLine === "false") {
        state.mode = mode.Idle;
        nextLine = null;
        return;
      }
      console.log(dataLine);
      nextLine = JSON.parse(dataLine);
    }

    if (performance.now() - state.startTime >= nextLine[0]) {
      for (let i = 1; i < servoDefinitions.length; i++) {
        servoDefinitions[i - 1].desiredPosition = nextLine[i];
        io.sockets.emit(
          servoDefinitions[i - 1].id,
          servoDefinitions[i - 1].currentPosition
        );
      }

      const dataLine = lineReader.next().toString("ascii");
      console.log(dataLine);
      if (dataLine === "false") {
        state.mode === mode.Idle;
        nextLine = null;
        return;
      }
      nextLine = JSON.parse(dataLine);
    }
  };
}

/**
 * Moves servos
 */
function moveServos() {
  return function() {
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
      if (state.mode === mode.Recording) {
        const offset = parseInt(performance.now() - state.startTime);
        if (offset > state.songDefinition.length * 1000) {
          state.mode = mode.Idle;
        } else {
          const positions = servoDefinitions.map(
            servo => servo.currentPosition
          );
          positions.unshift(offset);
          appendFileSync(
            path.join(process.cwd(), state.songDefinition.fileName + ".move"),
            JSON.stringify(positions) + "\n"
          );
        }
      }
    }
  };
}

process.on("SIGINT", unexportOnClose); //function to run when user closes using ctrl+c

function unexportOnClose() {
  //function to run when exiting program
  LED.writeSync(0); // Turn LED off
  LED.unexport(); // Unexport LED GPIO to free resources
  pushButton.unexport(); // Unexport Button GPIO to free resources
}

/**
 * Resets state
 * @param {servoDefinition} servoDefinitions
 */
function reset(servoDefinitions) {
  if (typeof serverDefinitions !== "undefined") {
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
      servo.gpio = new Gpio(servo.pinNumber, { mode: Gpio.OUTPUT });
      servo.gpio.servoWrite(servo.currentPosition);
    });
  }

  if (io.sockets.sockets.length > 0) {
    io.sockets.emit("send servoDefinitions", servoDefinitions);
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
