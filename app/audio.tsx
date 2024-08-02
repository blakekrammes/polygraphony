'use client';

import { useEffect, useState } from 'react';

import { Button } from '@nextui-org/react';
import { FaMicrophone } from 'react-icons/fa';
import { FaRegStopCircle } from 'react-icons/fa';
import { processAudio } from './process';
import { useAudioRecorder } from 'react-audio-voice-recorder';

interface AudioRecorder {
  writeNotes: (notes: string[][]) => void;
}

export const AudioRecorder: React.FC<AudioRecorder> = ({ writeNotes }) => {
  // const [audioSrc, setAudioSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    startRecording,
    stopRecording,
    // togglePauseResume,
    recordingBlob,
    isRecording,
    // isPaused,
    // recordingTime,
    // mediaRecorder,
  } = useAudioRecorder();

  const handleProcessAudio = async (recordingBlob: Blob) => {
    setIsLoading(true);
    try {
      const ab = await recordingBlob.arrayBuffer();
      const ac = new AudioContext({ sampleRate: 22050 });
      const decoded = await ac.decodeAudioData(ab);
      const notes = await processAudio(decoded);
      writeNotes([notes]);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!recordingBlob) return;
    // handleProcessAudio(recordingBlob);
    // recordingBlob will be present at this point after 'stopRecording' has been called
  }, [recordingBlob]);

  return (
    <div>
      <Button
        onClick={!isRecording ? startRecording : stopRecording}
        color='default'
        isIconOnly
        className={`rounded-full w-20 h-20 ${
          isRecording ? 'animate-pulse' : null
        }`}
        startContent={
          !isRecording ? (
            <FaMicrophone className='text-5xl' />
          ) : (
            <FaRegStopCircle className='text-5xl' />
          )
        }
      />
      <audio
        src={recordingBlob ? URL.createObjectURL(recordingBlob) : undefined}
      />
    </div>
  );
};
