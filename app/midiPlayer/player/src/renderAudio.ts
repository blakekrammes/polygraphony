import {
  audioDataToAudioBuffer,
  getSampleEventsFromSoundFont,
  renderAudio as render,
} from '@ryohey/wavelet';

import { PlayerEvent } from './PlayerEvent.js';
import { SynthEvent } from '@ryohey/wavelet';

function tickToMillisec(tick: number, bpm: number, timebase: number) {
  return (tick / (timebase / 60) / bpm) * 1000
}

interface Keyframe {
  tick: number;
  bpm: number;
  timestamp: number;
}

const toSynthEvents = (
  events: PlayerEvent[],
  timebase: number,
  sampleRate: number
): SynthEvent[] => {
  events = events.sort((a, b) => a.tick - b.tick);

  let keyframe: Keyframe = {
    tick: 0,
    bpm: 120,
    timestamp: 0,
  };

  const synthEvents: SynthEvent[] = [];

  for (const e of events) {
    const timestamp =
      tickToMillisec(e.tick - keyframe.tick, keyframe.bpm, timebase) +
      keyframe.timestamp;
    const delayTime = (timestamp / 1000) * sampleRate;

    switch (e.type) {
      case 'channel':
        synthEvents.push({
          type: 'midi',
          midi: e,
          delayTime,
        });
      case 'meta':
        switch (e.subtype) {
          case 'setTempo':
            keyframe = {
              tick: e.tick,
              bpm: (60 * 1000000) / e.microsecondsPerBeat,
              timestamp,
            };
            break;
        }
    }
  }

  return synthEvents;
};

export const renderAudio = async (
  soundFontData: ArrayBuffer,
  events: PlayerEvent[],
  timebase: number,
  sampleRate: number,
  options: {
    bufferSize: number;
    cancel?: () => boolean;
    waitForEventLoop?: () => Promise<void>;
    onProgress?: (numFrames: number, totalFrames: number) => void;
  }
): Promise<AudioBuffer> => {
  const sampleEvents = getSampleEventsFromSoundFont(
    new Uint8Array(soundFontData)
  );
  const synthEvents = toSynthEvents(events, timebase, sampleRate);

  const samples = sampleEvents.map((e) => e.event);
  const audioData = await render(samples, synthEvents, {
    sampleRate,
    bufferSize: options.bufferSize,
    cancel: options.cancel,
    waitForEventLoop: options.waitForEventLoop,
    onProgress: options.onProgress,
  });

  return audioDataToAudioBuffer(audioData);
};
