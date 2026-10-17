/** Call only from an explicit user click handler; never from hydration or an effect. */
export function playRewardSound() {
  try {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;
    const context = new AudioContextConstructor();
    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.32, now + 0.025);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
    master.connect(context.destination);

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((frequency, index) => {
      const start = now + index * 0.095;
      const voice = context.createGain();
      voice.gain.setValueAtTime(0.0001, start);
      voice.gain.exponentialRampToValueAtTime(index === 3 ? 0.48 : 0.34, start + 0.012);
      voice.gain.exponentialRampToValueAtTime(0.0001, start + (index === 3 ? 0.72 : 0.38));
      voice.connect(master);
      const bell = context.createOscillator();
      bell.type = "sine";
      bell.frequency.setValueAtTime(frequency, start);
      bell.connect(voice);
      bell.start(start);
      bell.stop(start + 0.75);
      const shimmer = context.createOscillator();
      shimmer.type = "triangle";
      shimmer.frequency.setValueAtTime(frequency * 2.76, start);
      const shimmerGain = context.createGain();
      shimmerGain.gain.setValueAtTime(0.075, start);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
      shimmer.connect(shimmerGain).connect(master);
      shimmer.start(start);
      shimmer.stop(start + 0.22);
    });

    const bass = context.createOscillator();
    const bassGain = context.createGain();
    bass.type = "sine";
    bass.frequency.setValueAtTime(130.81, now);
    bass.frequency.exponentialRampToValueAtTime(65.41, now + 0.52);
    bassGain.gain.setValueAtTime(0.34, now);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
    bass.connect(bassGain).connect(master);
    bass.start(now);
    bass.stop(now + 0.6);

    void context.resume().catch((error: unknown) => console.warn("Reward audio could not start:", error));
    window.setTimeout(() => { void context.close().catch((error: unknown) => console.warn("Reward audio cleanup failed:", error)); }, 1600);
  } catch (error) {
    console.warn("Reward audio could not play:", error);
  }
}
