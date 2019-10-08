const express = require('express');
export const alexaRouter = express.Router();
import {EventEmitter} from 'events';

export const songEmitter = new EventEmitter();

const response = {
  version: '1.0',
  response: {
    outputSpeech: {
      type: 'PlainText',
      text: 'Let\'s rock!',
      playBehavior: 'REPLACE_ENQUEUED',
    },
    shouldEndSession: true,
  },
};

alexaRouter.route('/activate').post(function(req, res) {
  res.json(JSON.stringify(response));
  let songId = null;

  const resolutions = ((((((req.body || {}).request || {}).intent || {}).slots || {}).song || {}).resolutions || {}).resolutionsPerAuthority;
  if (!!resolutions !== null && resolutions.length > 0) {
    const resolution = resolutions[0];
    if (!!resolution.values !== null && resolution.length > 0) {
      const value = resolution.values[0];
      songId = (value.value || {}).id;
    }
  }
  songEmitter.emit('songRequested', songId);
});

