import { useEffect, useRef } from 'react';
import { GameEngine } from './game/engine';
import './App.css';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engine.start();
    return () => engine.stop();
  }, []);

  return (
    <div className="game-container">
      <canvas ref={canvasRef} className="game-canvas" />
      <div className="crt-overlay" />
    </div>
  );
}
