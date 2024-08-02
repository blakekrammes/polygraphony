'use client';

import { AudioRecorder } from './audio';
import { MidiEditor } from './midiEditor';
// import { Metronome } from './metronome';
import Providers from './providers';
import { Score } from './score';
import localFont from 'next/font/local';
import { useState } from 'react';

const gaudy = localFont({ src: '../public/fonts/goudy.woff' });

export default function Home() {
  const [notes, setNotes] = useState<string[][] | null>(null);
  return (
    <div className={gaudy.className}>
      <h1 className='text-4xl p-3'>Polygraphony</h1>
      <div className='flex justify-center items-center w-full'>
        <Providers>
          {/* <Metronome /> */}
          <AudioRecorder writeNotes={setNotes} />
          {/* {notes && <Score staves={[[['c4', 'h'], ['d4', 'h']]]} />} */}
          <Score
            staves={[
              [
                ['d3', 'h'],
                ['e3', 'h'],
              ],
              [
                ['d5', 'h'],
                ['e5', 'h'],
              ],
              [
                ['e5', 'h'],
                ['f5', 'h'],
              ],
              [
                ['g5', 'q'],
                ['a5', 'q'],
                ['b5', 'q'],
                ['c6', '8'],
                ['d6', '8'],
              ],
            ]}
          />
          <MidiEditor />
        </Providers>
      </div>
    </div>
  );
}
