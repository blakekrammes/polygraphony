'use client';

import {
  BasicPitch,
  addPitchBendsToNoteEvents,
  noteFramesToTime,
  outputToNotesPoly,
} from '@spotify/basic-pitch';

import { Midi } from '@tonejs/midi';

export const processAudio = async (ab: AudioBuffer) => {
  const frames: number[][] = [];
  const onsets: number[][] = [];
  const contours: number[][] = [];
  let pct: number = 0;
  const basicPitch = new BasicPitch(
    'https://unpkg.com/@spotify/basic-pitch@1.0.1/model/model.json'
  );

  await basicPitch.evaluateModel(
    ab,
    (f: number[][], o: number[][], c: number[][]) => {
      frames.push(...f);
      onsets.push(...o);
      contours.push(...c);
    },
    (p: number) => {
      pct = p;
    }
  );

  const notes = noteFramesToTime(
    addPitchBendsToNoteEvents(
      contours,
      outputToNotesPoly(frames, onsets)
    )
  );

  const midi = new Midi();
  const track = midi.addTrack();
  notes.forEach((note) => {
    track.addNote({
      midi: note.pitchMidi,
      time: note.startTimeSeconds,
      duration: note.durationSeconds,
      velocity: note.amplitude,
    });
  });
  console.log(notes);
  const ns = midi.tracks[0].notes.map(n => {
    return n.name.toLowerCase();
  });
  console.log(ns);
  return ns;
};
