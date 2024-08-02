import React, { useEffect, useRef } from 'react';

import VexFlow from 'vexflow';
import { partition } from 'lodash';

interface Score {
  staves: string[][][] | [];
  clef?: 'treble' | 'bass';
  timeSignature?: string;
  width?: number;
  height?: number;
}

const VF = VexFlow.Flow;
const { Formatter, Renderer, Stave, StaveNote, StaveConnector, Voice } = VF;

const clefWidth = 30;
const timeWidth = 30;

export const Score: React.FC<Score> = ({
  staves = [],
  clef = 'treble',
  timeSignature = '4/4',
  width = 1000,
  height = 200,
}) => {
  const container = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<InstanceType<typeof Renderer> | null>(null);

  useEffect(() => {
    if (!rendererRef.current && container.current) {
      rendererRef.current = new Renderer(
        container.current,
        Renderer.Backends.SVG
      );
    } else {
      return;
    }
    const renderer = rendererRef.current;
    renderer.resize(width, height);
    const context = renderer.getContext();
    context.setFont('Arial', 10, '').setBackgroundFillStyle('#eed');
    const clefAndTimeWidth =
      (clef ? clefWidth : 0) + (timeSignature ? timeWidth : 0);
    const braceWidth = 20;
    let currX = braceWidth;
    const staveWidth =
      (width - clefAndTimeWidth - currX / (staves.length - 1)) / staves.length;
    const finalStaveWidth = (width - clefAndTimeWidth) / staves.length;
    staves.forEach((notes, i) => {
      const trebleStave = new Stave(
        currX,
        0,
        i === staves.length - 1 ? finalStaveWidth : staveWidth
      );
      const bassStave = new Stave(
        currX,
        100,
        i === staves.length - 1 ? finalStaveWidth : staveWidth
      );

      if (i === 0) {
        const brace = new StaveConnector(trebleStave, bassStave).setType(3);
        trebleStave.setWidth(staveWidth + clefAndTimeWidth);
        bassStave.setWidth(staveWidth + clefAndTimeWidth);
        brace.setContext(context).draw();
        if (clef) {
          trebleStave.addClef(clef);
          bassStave.addClef('bass');
        }
        if (timeSignature) {
          trebleStave.addTimeSignature(timeSignature);
          bassStave.addTimeSignature(timeSignature);
        }
      }
      const lineLeft = new StaveConnector(trebleStave, bassStave).setType(1);
      lineLeft.setContext(context).draw();

      currX += trebleStave.getWidth();
      trebleStave.setContext(context).draw();
      bassStave.setContext(context).draw();

      if (i === staves.length - 1) {
        const double = new StaveConnector(trebleStave, bassStave).setType(
          'boldDoubleRight'
        );
        // // a bit hacky, but it works...
        const staveWidthDiff = Math.round(finalStaveWidth - staveWidth);
        const doubleBarOffset = Math.round(
          staveWidth - (braceWidth - staveWidthDiff)
        );
        trebleStave.setX(
          currX - (Math.round(staveWidth) + braceWidth - staveWidthDiff)
        );
        double.setContext(context).draw();
        trebleStave.setBegBarType(7);
        trebleStave.draw();
        trebleStave.setX(currX - doubleBarOffset - braceWidth);
      }
      let currentClef: 'treble' | 'bass' = 'treble';
      const processedNotes = notes
        .map((note) => (typeof note === 'string' ? { key: note } : note))
        .map((note) =>
          Array.isArray(note) ? { key: note[0], duration: note[1] } : note
        )
        .map(({ key, ...rest }) =>
          typeof key === 'string'
            ? {
                key: key.includes('/') ? key : `${key[0]}/${key.slice(1)}`,
                ...rest,
              }
            : rest
        )
        .map(({ key, keys, duration = 'q' }: any) => {
          const keysRes = key ? [key] : keys;
          const octaveNum = Number(keysRes[0].slice(-1));
          if (octaveNum > 4) {
            currentClef = 'treble';
          } else if (octaveNum < 4) {
            currentClef = 'bass';
          }
          return new StaveNote({
            keys: keysRes,
            duration: String(duration),
            clef: currentClef,
          });
        });

      const [trebleNotes, bassNotes] = partition(
        processedNotes,
        (n) => n.getAttributes().clef === 'treble'
      );

      const trebleVoice = new Voice({ num_beats: 4, beat_value: 4 });
      const bassVoice = new Voice({ num_beats: 4, beat_value: 4 });

      // const voice = new Voice();
      // const bassVoice = new Voice();

      // voice.addTickables(proce//ssedNotes);

      trebleVoice.addTickables(trebleNotes);
      bassVoice.addTickables(bassNotes);
      // new Formatter().formatToStave([voice], stave);

      // voice.draw(context, stave);
      // bassVoice.draw(context, stave2);

      // new Formatter().joinVoices([voice]).format([voice], 700);

      // const [trebleNotes, bassNotes] = partition(
      //   processedNotes,
      //   (n: StaveNote) => n.getAttributes().clef === 'treble'
      // );
      const formatter = new Formatter();

      if (trebleNotes.length > 0) {
        console.log(trebleNotes);
        formatter.format([trebleVoice]);
        trebleVoice.draw(context, trebleStave);

        // Formatter.formatToStave();
        // Formatter.FormatAndDraw(context, trebleStave, trebleNotes);
        // Formatter.FormatAndDraw(context, trebleStave, trebleNotes as any[], {
        //   auto_beam: true,
        // });
      }

      if (bassNotes.length > 0) {
        // console.log(bassNotes);
        // formatter.formatToStave([bassVoice], bassStave);
        formatter.format([bassVoice]);
        bassVoice.draw(context, bassStave);

        // Formatter.FormatAndDraw(context, bassStave, bassNotes);
      }
    });
  }, [clef, height, staves, timeSignature, width]);

  return <div className='bg-white p-6' ref={container} />;
};
