import {mode} from '../mode';
import {Gpio as OnOff} from 'onoff';
import {EventEmitter} from 'events';

const led = new OnOff(25, 'out');
const pushButton = new OnOff(23, 'in', 'both');

let blinkValue = 0;
let lastState = -1;

export const songEmitter = new EventEmitter();

pushButton.watch(function(err, value) {
  if (err) {
    console.error('There was an error', err);
    return;
  }
  if (value !== lastState) {
    lastState = value;
    if (value === 0) {
      songEmitter.emit('songRequested', null);
    }
  }
});

/**
 * Blinks to show what's up
 * @returns function
 *
 */
export function indicateState(state) {
  return function() {
    if (state.mode === mode.Playing) {
      led.writeSync(1);
    } else if (state.mode === mode.Recording) {
      led.writeSync(blinkValue);
      blinkValue = 1 - blinkValue;
    } else {
      led.writeSync(0);
    }
  };
}
