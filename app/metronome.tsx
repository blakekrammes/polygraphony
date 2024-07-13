import { ChangeEvent, useState } from 'react';

const click1File = '//daveceddia.com/freebies/react-metronome/click1.wav';

export const Metronome = ({ }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [count, setCount] = useState(0);
    const [bpm, setBpm] = useState(100);
    // const [timer, setTimer] = useState();

    let timer: ReturnType<typeof setTimeout>;

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newBpm = event.target.value;
    
        if (isPlaying) {
          // stop old timer and start a new one
          clearInterval(timer);
          timer = setInterval(playClick, (60 / bpm) * 1000);
    
          // set the new bpm
          // and reset the beat counter
          setCount(0);
          setBpm(Number(newBpm));
        } else {
          // otherwise, just update the bpm
          setBpm(Number(newBpm))
        }
      };

      const playClick = () => {
        const click1 = new Audio(click1File);
        click1.play();
    
        // keep track of which beat we're on
        setCount((count + 1) % bpm);
      };

      const startStop = () => {
        if (isPlaying) {
          // stop the timer
          clearInterval(timer);
          setIsPlaying(false);
        } else {
          // start a timer with current bpm
          timer = setInterval(playClick, (60 / bpm) * 1000);
          setIsPlaying(true);
          setCount(0);
          playClick();
        }
      };

    return (
        <div className='mx-auto max-w-xs p-8'>
          <div className='w-full m-2.5'>
            <p>{bpm} BPM</p>
            <input
              type='range'
              min='60'
              max='240'
              value={bpm}
              onChange={handleInputChange}
              className='w-full m-2.5'
            />
          </div>
          <button className='bg-red-600 px-2.5 py-2 border border-red-500 rounded-md w-24 text-white text-lg' onClick={startStop}>{isPlaying ? 'Stop' : 'Start'}</button>
        </div>
      );

};
