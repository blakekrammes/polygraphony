// import {
//   BasicPitch,
//   addPitchBendsToNoteEvents,
//   noteFramesToTime,
//   outputToNotesPoly,
// } from '@spotify/basic-pitch';

import AudioRecorder from './audio';
import Providers from './providers';
import localFont from 'next/font/local';
const gaudy = localFont({ src: '../public/fonts/goudy.woff' });

// import { Midi } from '@tonejs/midi';
// import fs from 'fs/promises';
// import model from '../public/model.json';

export default async function Home() {
  // while (audioBuffer === undefined) {
  //   await new Promise((r) => setTimeout(r, 1));
  // }

  // const frames: number[][] = [];
  // const onsets: number[][] = [];
  // const contours: number[][] = [];
  // let pct: number = 0;

  // const basicPitch = new BasicPitch(model as unknown as string);

  // await basicPitch.evaluateModel(
  //   audioBuffer as unknown as AudioBuffer,
  //   (f: number[][], o: number[][], c: number[][]) => {
  //     frames.push(...f);
  //     onsets.push(...o);
  //     contours.push(...c);
  //   },
  //   (p: number) => {
  //     pct = p;
  //   }
  // );

  // const notes = noteFramesToTime(
  //   addPitchBendsToNoteEvents(
  //     contours,
  //     outputToNotesPoly(frames, onsets, 0.25, 0.25, 5)
  //   )
  // );

  // const midi = new Midi();
  // const track = midi.addTrack();
  // notes.forEach((note) => {
  //   track.addNote({
  //     midi: note.pitchMidi,
  //     time: note.startTimeSeconds,
  //     duration: note.durationSeconds,
  //     velocity: note.amplitude,
  //   });
  // });

  // await fs.writeFile('test.mid', midi.toArray());

  return (
    <main className={gaudy.className}>
      <h1 className='text-4xl p-3'>Polygraphony</h1>
      <div className='flex justify-center w-full'>
        <Providers>
          <AudioRecorder />
        </Providers>
      </div>
    </main>
  );
}
