// App.jsx
import { useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas.jsx';
import StartScreen from './components/StartScreen.jsx';

export default function App() {
  const [webcamReady, setWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const [gameState, setGameState] = useState('select');

  const handleReady = useCallback((ok, err) => {
    if (ok) setWebcamReady(true);
    else setWebcamError(err || 'Camera failed');
  }, []);

  const handleStateChange = useCallback((state) => {
    setGameState(state);
  }, []);

  return (
    <>
      {/* Always mount GameCanvas so engine + tracker start immediately */}
      <GameCanvas
        onStateChange={handleStateChange}
        onReady={handleReady}
      />

      {/* Show loading screen until webcam is up */}
      {!webcamReady && (
        <StartScreen
          error={webcamError}
          onBypass={() => setWebcamReady(true)}
        />
      )}
    </>
  );
}
