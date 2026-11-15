import React, { useRef, useEffect, useCallback } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  isPaused: boolean;
}

export default function AudioVisualizer({ isActive, isPaused }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const barsRef = useRef<number[]>(Array(32).fill(0));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const barCount = 32;
    const barWidth = (width / barCount) * 0.6;
    const gap = (width / barCount) * 0.4;

    ctx.clearRect(0, 0, width, height);

    if (analyserRef.current && isActive && !isPaused) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * dataArray.length);
        const value = dataArray[dataIndex] / 255;
        barsRef.current[i] = barsRef.current[i] * 0.7 + value * 0.3;
      }
    } else {
      // Idle animation
      const time = Date.now() / 1000;
      for (let i = 0; i < barCount; i++) {
        const target = isActive && isPaused
          ? 0.08 + Math.sin(time * 1.5 + i * 0.3) * 0.04
          : 0.06 + Math.sin(time * 2 + i * 0.4) * 0.03;
        barsRef.current[i] = barsRef.current[i] * 0.9 + target * 0.1;
      }
    }

    const primaryColor = isActive
      ? (isPaused ? '99, 102, 241' : '239, 68, 68')
      : '99, 102, 241';

    for (let i = 0; i < barCount; i++) {
      const barHeight = Math.max(3, barsRef.current[i] * height * 0.8);
      const x = i * (barWidth + gap) + gap / 2;
      const y = (height - barHeight) / 2;
      const opacity = 0.4 + barsRef.current[i] * 0.6;

      ctx.fillStyle = `rgba(${primaryColor}, ${opacity})`;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
      ctx.fill();
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [isActive, isPaused]);

  useEffect(() => {
    if (isActive && !isPaused) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        streamRef.current = stream;
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyserRef.current = analyser;
      }).catch(() => {
        // Microphone access failed; idle animation will continue
      });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      analyserRef.current = null;
    };
  }, [isActive, isPaused]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '64px',
        display: 'block',
      }}
    />
  );
}
