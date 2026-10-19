"use client";

import { useCallback } from "react";

let audioContext: AudioContext | null = null;
let closeTimer: number | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextConstructor = window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return null;

  if (!audioContext || audioContext.state === "closed") audioContext = new AudioContextConstructor();
  if (closeTimer !== null) window.clearTimeout(closeTimer);
  if (audioContext.state === "suspended") void audioContext.resume().catch(() => undefined);
  return audioContext;
}

function closeWhenIdle(context: AudioContext, delay: number) {
  if (closeTimer !== null) window.clearTimeout(closeTimer);
  closeTimer = window.setTimeout(() => {
    if (audioContext !== context) return;
    void context.close().catch(() => undefined);
    audioContext = null;
    closeTimer = null;
  }, delay);
}

export function useKaizenSounds() {
  const playTaskComplete = useCallback(() => {
    const context = getAudioContext();
    if (!context) return;
    const now = context.currentTime;

    const body = context.createOscillator();
    const bodyGain = context.createGain();
    body.type = "sine";
    body.frequency.setValueAtTime(220, now);
    body.frequency.exponentialRampToValueAtTime(55, now + 0.04);
    bodyGain.gain.setValueAtTime(0.2, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    body.connect(bodyGain).connect(context.destination);

    const snap = context.createOscillator();
    const snapFilter = context.createBiquadFilter();
    const snapGain = context.createGain();
    snap.type = "triangle";
    snap.frequency.setValueAtTime(750, now);
    snap.frequency.exponentialRampToValueAtTime(180, now + 0.015);
    snapFilter.type = "lowpass";
    snapFilter.frequency.setValueAtTime(900, now);
    snapGain.gain.setValueAtTime(0.09, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
    snap.connect(snapFilter).connect(snapGain).connect(context.destination);

    body.start(now);
    body.stop(now + 0.05);
    snap.start(now);
    snap.stop(now + 0.02);
    closeWhenIdle(context, 900);
  }, []);

  const playDayComplete = useCallback(() => {
    const context = getAudioContext();
    if (!context) return;
    const now = context.currentTime;
    const duration = 5.5;

    const warmWave = context.createPeriodicWave(
      new Float32Array([0, 0, 0, 0]),
      new Float32Array([0, 1, 0.25, 0.08]),
      { disableNormalization: false },
    );
    const masterFilter = context.createBiquadFilter();
    masterFilter.type = "lowpass";
    masterFilter.frequency.setValueAtTime(160, now);
    masterFilter.frequency.exponentialRampToValueAtTime(480, now + 1.6);
    masterFilter.frequency.setTargetAtTime(140, now + 1.8, 1.1);

    const masterGain = context.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.62, now + 0.08);
    masterGain.gain.setTargetAtTime(0.0001, now + 1.8, 1.0);
    masterFilter.connect(masterGain).connect(context.destination);

    const voices = [
      { freq: 87.31, gain: 0.22, pan: 0 },
      { freq: 130.81, gain: 0.16, pan: -0.35 },
      { freq: 174.61, gain: 0.15, pan: 0.35 },
      { freq: 220, gain: 0.11, pan: -0.65 },
      { freq: 261.63, gain: 0.09, pan: 0.65 },
      { freq: 329.63, gain: 0.05, pan: 0.15 },
    ];

    for (const { freq, gain, pan } of voices) {
      const oscillator = context.createOscillator();
      const voiceGain = context.createGain();
      oscillator.setPeriodicWave(warmWave);
      oscillator.frequency.setValueAtTime(freq, now);
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(gain, now + 1.5);
      voiceGain.gain.setTargetAtTime(0.00001, now + 1.6, 0.85);
      oscillator.connect(voiceGain);

      if (typeof context.createStereoPanner === "function") {
        const panner = context.createStereoPanner();
        panner.pan.setValueAtTime(pan, now);
        voiceGain.connect(panner).connect(masterFilter);
      } else {
        voiceGain.connect(masterFilter);
      }
      oscillator.start(now);
      oscillator.stop(now + duration);
    }

    closeWhenIdle(context, (duration + 0.5) * 1000);
  }, []);

  return { playTaskComplete, playDayComplete };
}
