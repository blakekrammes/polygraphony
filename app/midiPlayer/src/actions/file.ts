'use client'

import { songFromMidi, songToMidi } from '../midi/midiConversion';

import RootStore from '../stores/RootStore';
import { basename } from '../helpers/path';
import { setSong } from './song';
import { writeFile } from '../services/fs-helper';

// URL parameter for automation purposes used in scripts/perf/index.js
// /edit?disableFileSystem=true
export const disableFileSystem = typeof window !== 'undefined' ? 
  new URL(window.location.href).searchParams.get('disableFileSystem') ===
  'true' : null;

export const hasFSAccess = typeof window !== 'undefined' ?
  ('chooseFileSystemEntries' in window || 'showOpenFilePicker' in window) &&
  !disableFileSystem : null;

export const openFile = async (rootStore: RootStore) => {
  let fileHandle: FileSystemFileHandle;
  try {
    if (typeof window !== 'undefined') {
      fileHandle = (
        await window.showOpenFilePicker({
          types: [
            {
              description: 'MIDI file',
              accept: { 'audio/midi': ['.mid'] },
            },
          ],
        })
      )[0];
    }
  } catch (ex) {
    if ((ex as Error).name === 'AbortError') {
      return;
    }
    const msg = 'An error occured trying to open the file.';
    console.error(msg, ex);
    alert(msg);
    return;
  }
  const file = await fileHandle.getFile();
  const song = await songFromFile(file);
  song.fileHandle = fileHandle;
  setSong(rootStore)(song);
};

export const songFromFile = async (file: File) =>
  songFromArrayBuffer(await file.arrayBuffer(), (file as any).path, file.name);

export const songFromArrayBuffer = (
  content: ArrayBuffer,
  filePath: string,
  name?: string
) => {
  const song = songFromMidi(new Uint8Array(content));
  const pathOrName = filePath ?? name;
  if (song.name.length === 0 && pathOrName) {
    // Use the file name without extension as the song title
    song.name = basename(pathOrName)?.replace(/\.[^/.]+$/, '') ?? '';
  }
  if (filePath) {
    song.filepath = filePath;
  }
  song.isSaved = true;
  return song;
};

export const saveFile = async (rootStore: RootStore) => {
  const { song } = rootStore;
  const fileHandle = song.fileHandle;
  if (fileHandle === null) {
    await saveFileAs(rootStore);
    return;
  }

  const data = songToMidi(song).buffer;
  try {
    await writeFile(fileHandle, data);
    song.isSaved = true;
  } catch (e) {
    console.error(e);
    alert('unable to save file');
  }
};

export const saveFileAs = async ({ song }: RootStore) => {
  let fileHandle;
  try {
    fileHandle = await window.showSaveFilePicker({
      types: [
        {
          description: 'MIDI file',
          accept: { 'audio/midi': ['.mid'] },
        },
      ],
    });
  } catch (ex) {
    if ((ex as Error).name === 'AbortError') {
      return;
    }
    const msg = 'An error occured trying to open the file.';
    console.error(msg, ex);
    alert(msg);
    return;
  }
  try {
    const data = songToMidi(song).buffer;
    await writeFile(fileHandle, data);
    song.isSaved = true;
    song.fileHandle = fileHandle;
  } catch (ex) {
    const msg = 'Unable to save file.';
    console.error(msg, ex);
    alert(msg);
    return;
  }
};
