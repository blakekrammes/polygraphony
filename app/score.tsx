import React, { useEffect, useRef } from 'react';
import VexFlow, { TickContext } from 'vexflow';

import { partition } from 'lodash';

interface Score {
  staves: string[][][] | [];
  clef?: 'treble' | 'bass';
  timeSignature?: string;
  width?: number;
  height?: number;
}

const VF = VexFlow.Flow;
const { Formatter, Renderer, Stave, StaveNote, StaveConnector } = VF;

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

  const processNote = (notes: any) =>
    notes
      .map((note: any) => (typeof note === 'string' ? { key: note } : note))
      .map((note: any) =>
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
      .map(
        ({ key, keys, duration = 'q' }: any) =>
          new StaveNote({
            keys: key ? [key] : keys,
            duration: String(duration),
          })
      );
      
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
      let stave, stave2;
      if (i === staves.length - 1) {
        stave = new Stave(currX, 0, finalStaveWidth);
        stave2 = new Stave(currX, 100, finalStaveWidth);
      } else {
        stave = new Stave(currX, 0, staveWidth);
        stave2 = new Stave(currX, 100, staveWidth);
      }

      if (i === 0) {
        const brace = new StaveConnector(stave, stave2).setType(3);
        stave.setWidth(staveWidth + clefAndTimeWidth);
        stave2.setWidth(staveWidth + clefAndTimeWidth);
        brace.setContext(context).draw();
        if (clef) {
          stave.addClef(clef);
          stave2.addClef('bass');
        }
        if (timeSignature) {
          stave.addTimeSignature(timeSignature);
          stave2.addTimeSignature(timeSignature);
        }
      }
      const lineLeft = new StaveConnector(stave, stave2).setType(1);
      lineLeft.setContext(context).draw();

      currX += stave.getWidth();
      stave.setContext(context).draw();
      stave2.setContext(context).draw();
      // const trebleNotes = notes
      const [trebleNotes, bassNotes] = partition(notes, (n) => {

      });
      // const processedNotes =
      return;
      if (i === staves.length - 1) {
        const double = new StaveConnector(stave, stave2).setType(
          'boldDoubleRight'
        );
        // // a bit hacky, but it works...
        const staveWidthDiff = Math.round(finalStaveWidth - staveWidth);
        const doubleBarOffset = Math.round(
          staveWidth - (braceWidth - staveWidthDiff)
        );
        stave.setX(
          currX - (Math.round(staveWidth) + braceWidth - staveWidthDiff)
        );
        double.setContext(context).draw();
        stave.setBegBarType(7);
        stave.draw();
        stave.setX(currX - doubleBarOffset - braceWidth);
      }

      Formatter.FormatAndDraw(context, stave, processedNotes, {
        auto_beam: true,
      });
    });
  }, [clef, height, staves, timeSignature, width]);

  return <div className='bg-white p-6' ref={container} />;
};
