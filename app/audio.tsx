'use client';

import { useEffect, useState } from 'react';

import { Button } from '@nextui-org/react';
import { FaMicrophone } from 'react-icons/fa';
import { FaRegStopCircle } from 'react-icons/fa';
import { useAudioRecorder } from 'react-audio-voice-recorder';

export default function AudioRecorder() {
  const [audioSrc, setAudioSrc] = useState(null);
  const {
    startRecording,
    stopRecording,
    togglePauseResume,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
    mediaRecorder,
  } = useAudioRecorder();

  useEffect(() => {
    if (!recordingBlob) return;

    // recordingBlob will be present at this point after 'stopRecording' has been called
  }, [recordingBlob]);

  return (
    <div>
      <Button
        onClick={!isRecording ? startRecording : stopRecording}
        color='default'
        isIconOnly
        className={`rounded-full w-20 h-20 ${isRecording ? 'animate-pulse' : null}`}
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
}
