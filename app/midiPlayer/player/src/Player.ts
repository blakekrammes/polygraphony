import { AnyEvent, MIDIControlEvents } from 'midifile-ts';
import { SendableEvent, SynthOutput } from './SynthOutput.js';
import { computed, makeObservable, observable } from 'mobx';

import { ControllerEvent } from 'midifile-ts';
import { DistributiveOmit } from './types.js';
import { PlayerEvent } from './PlayerEvent.js';
import range from 'lodash/range.js';
import throttle from 'lodash/throttle.js';

export function tickToMillisec(tick: number, bpm: number, timebase: number) {
  return (tick / (timebase / 60) / bpm) * 1000;
}

function controllerMidiEvent(
  deltaTime: number,
  channel: number,
  controllerType: number,
  value: number
): ControllerEvent {
  return {
    deltaTime,
    type: 'channel',
    subtype: 'controller',
    channel,
    controllerType,
    value,
  };
}

type SchedulableEvent = {
  tick: number;
};

interface EventSchedulerLoop {
  begin: number;
  end: number;
}

type WithTimestamp<E> = {
  event: E;
  timestamp: number;
};

/**
 * Class for reading chronological events.
 * Perform lookahead to schedule accurately.
 * https://www.html5rocks.com/ja/tutorials/audio/scheduling/
 */
class EventScheduler<E extends SchedulableEvent> {
  lookAheadTime = 100;

  // Number of ticks per 1/4 beat
  timebase = 480;

  loop: EventSchedulerLoop | null = null;

  private _currentTick = 0;
  private _scheduledTick = 0;
  private _prevTime: number | undefined = undefined;
  private _getEvents: (startTick: number, endTick: number) => E[];
  private _createLoopEndEvents: () => Omit<E, 'tick'>[];

  constructor(
    getEvents: (startTick: number, endTick: number) => E[],
    createLoopEndEvents: () => Omit<E, 'tick'>[],
    tick = 0,
    timebase = 480,
    lookAheadTime = 100
  ) {
    this._getEvents = getEvents;
    this._createLoopEndEvents = createLoopEndEvents;
    this._currentTick = tick;
    this._scheduledTick = tick;
    this.timebase = timebase;
    this.lookAheadTime = lookAheadTime;
  }

  get scheduledTick() {
    return this._scheduledTick;
  }

  millisecToTick(ms: number, bpm: number) {
    return (((ms / 1000) * bpm) / 60) * this.timebase;
  }

  seek(tick: number) {
    this._currentTick = this._scheduledTick = Math.max(0, tick);
  }

  readNextEvents(bpm: number, timestamp: number): WithTimestamp<E>[] {
    const withTimestamp =
      (currentTick: number) =>
      (e: E): WithTimestamp<E> => {
        const waitTick = e.tick - currentTick;
        const delayedTime =
          timestamp + Math.max(0, tickToMillisec(waitTick, bpm, this.timebase));
        return { event: e, timestamp: delayedTime };
      };

    const getEventsInRange = (
      startTick: number,
      endTick: number,
      currentTick: number
    ) => this._getEvents(startTick, endTick).map(withTimestamp(currentTick));

    if (this._prevTime === undefined) {
      this._prevTime = timestamp;
    }
    const delta = timestamp - this._prevTime;
    const deltaTick = Math.max(0, this.millisecToTick(delta, bpm));
    const nowTick = this._currentTick + deltaTick;
    const lookAheadTick = this.millisecToTick(this.lookAheadTime, bpm);

    // Process from the last scheduled point to the lookahead time
    const startTick = this._scheduledTick;
    const endTick = nowTick + lookAheadTick;

    this._prevTime = timestamp;

    if (
      this.loop !== null &&
      startTick < this.loop.end &&
      endTick >= this.loop.end
    ) {
      const loop = this.loop;
      const offset = endTick - loop.end;
      const endTick2 = loop.begin + offset;
      const currentTick = loop.begin - (loop.end - nowTick);
      this._currentTick = currentTick;
      this._scheduledTick = endTick2;

      return [
        ...getEventsInRange(startTick, loop.end, nowTick),
        ...this._createLoopEndEvents().map((e) =>
          withTimestamp(currentTick)({ ...e, tick: loop.begin } as E)
        ),
        ...getEventsInRange(loop.begin, endTick2, currentTick),
      ];
    } else {
      this._currentTick = nowTick;
      this._scheduledTick = endTick;

      return getEventsInRange(startTick, endTick, nowTick);
    }
  }
}

export interface LoopSetting {
  begin: number;
  end: number;
  enabled: boolean;
}

const TIMER_INTERVAL = 50;
const LOOK_AHEAD_TIME = 50;
export const DEFAULT_TEMPO = 120;

export interface IEventSource {
  timebase: number;
  endOfSong: number;
  getEvents(startTick: number, endTick: number): PlayerEvent[];
  getCurrentStateEvents(tick: number): SendableEvent[];
}

export class Player {
  private scheduler: EventScheduler<PlayerEvent> | null = null;
  private interval: number | null = null;

  private _currentTempo = DEFAULT_TEMPO;
  private _currentTick = 0;
  private _isPlaying = false;

  disableSeek: boolean = false;
  loop: LoopSetting | null = null;

  constructor(
    private readonly output: SynthOutput,
    private readonly eventSource: IEventSource
  ) {
    makeObservable<Player, '_currentTick' | '_isPlaying'>(this, {
      _currentTick: observable,
      _isPlaying: observable,
      loop: observable,
      position: computed,
      isPlaying: computed,
    });
  }

  play() {
    if (this.isPlaying) {
      console.warn('called play() while playing. aborted.');
      return;
    }
    this.scheduler = new EventScheduler<PlayerEvent>(
      (startTick, endTick) => this.eventSource.getEvents(startTick, endTick),
      () => this.allNotesOffEvents(),
      this._currentTick,
      this.eventSource.timebase,
      TIMER_INTERVAL + LOOK_AHEAD_TIME
    );
    this._isPlaying = true;
    this.output.activate();
    this.interval = window.setInterval(() => this._onTimer(), TIMER_INTERVAL);
    this.output.activate();
  }

  set position(tick: number) {
    if (!Number.isInteger(tick)) {
      console.warn('Player.tick should be an integer', tick);
    }
    if (this.disableSeek) {
      return;
    }
    tick = Math.min(Math.max(Math.floor(tick), 0), this.eventSource.endOfSong);
    if (this.scheduler) {
      this.scheduler.seek(tick);
    }
    this._currentTick = tick;

    if (this.isPlaying) {
      this.allSoundsOff();
    }

    this.sendCurrentStateEvents();
  }

  get position() {
    return this._currentTick;
  }

  get isPlaying() {
    return this._isPlaying;
  }

  get numberOfChannels() {
    return 0xf;
  }

  allSoundsOffChannel(ch: number) {
    this.sendEvent(
      controllerMidiEvent(0, ch, MIDIControlEvents.ALL_SOUNDS_OFF, 0)
    );
  }

  allSoundsOff() {
    for (const ch of range(0, this.numberOfChannels)) {
      this.allSoundsOffChannel(ch);
    }
  }

  allSoundsOffExclude(channel: number) {
    for (const ch of range(0, this.numberOfChannels)) {
      if (ch !== channel) {
        this.allSoundsOffChannel(ch);
      }
    }
  }

  private allNotesOffEvents(): DistributiveOmit<PlayerEvent, 'tick'>[] {
    return range(0, this.numberOfChannels).map((ch) => ({
      ...controllerMidiEvent(0, ch, MIDIControlEvents.ALL_NOTES_OFF, 0),
      trackId: -1, // do not mute
    }));
  }

  private resetControllers() {
    for (const ch of range(0, this.numberOfChannels)) {
      this.sendEvent(
        controllerMidiEvent(0, ch, MIDIControlEvents.RESET_CONTROLLERS, 0x7f)
      );
    }
  }

  stop() {
    this.scheduler = null;
    this.allSoundsOff();
    this._isPlaying = false;

    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  reset() {
    this.resetControllers();
    this.stop();
    this._currentTick = 0;
  }

  /*
   to restore synthesizer state (e.g. pitch bend)
   collect all previous state events
   and send them to the synthesizer
  */
  sendCurrentStateEvents() {
    this.eventSource.getCurrentStateEvents(this._currentTick).forEach((e) => {
      this.applyPlayerEvent(e);
      this.sendEvent(e);
    });
  }

  get currentTempo() {
    return this._currentTempo;
  }

  set currentTempo(value: number) {
    this._currentTempo = value;
  }

  // delayTime: seconds, timestampNow: milliseconds
  sendEvent(
    event: SendableEvent,
    delayTime: number = 0,
    timestampNow: number = performance.now(),
    trackId?: number
  ) {
    this.output.sendEvent(event, delayTime, timestampNow, trackId);
  }

  private syncPosition = throttle(() => {
    if (this.scheduler !== null) {
      this._currentTick = this.scheduler.scheduledTick;
    }
  }, 50);

  private applyPlayerEvent(
    e: DistributiveOmit<AnyEvent, 'deltaTime' | 'channel'>
  ) {
    if (e.type !== 'channel' && 'subtype' in e) {
      switch (e.subtype) {
        case 'setTempo':
          this._currentTempo = 60000000 / e.microsecondsPerBeat;
          break;
        default:
          break;
      }
    }
  }

  private _onTimer() {
    if (this.scheduler === null) {
      return;
    }

    const timestamp = performance.now();

    this.scheduler.loop =
      this.loop !== null && this.loop.enabled ? this.loop : null;
    const events = this.scheduler.readNextEvents(this._currentTempo, timestamp);

    events.forEach(({ event: e, timestamp: time }) => {
      if (e.type === 'channel') {
        const delayTime = (time - timestamp) / 1000;
        this.sendEvent(e, delayTime, timestamp, e.trackId);
      } else {
        this.applyPlayerEvent(e);
      }
    });

    if (this.scheduler.scheduledTick >= this.eventSource.endOfSong) {
      this.stop();
    }

    this.syncPosition();
  }
}
