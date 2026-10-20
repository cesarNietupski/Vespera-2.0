import type { Settings } from "../types";
export class AudioDirector {
  context: AudioContext | null = null;
  musicGain: GainNode | null = null;
  sfxGain: GainNode | null = null;
  timer: number | undefined;
  step = 0;
  biome = -1;
  combat = false;
  constructor(public settings: Settings) {}
  start(): void {
    if (this.context) {
      void this.context.resume();
      return;
    }
    try {
      const c = (this.context = new AudioContext());
      this.musicGain = c.createGain();
      this.sfxGain = c.createGain();
      this.musicGain.connect(c.destination);
      this.sfxGain.connect(c.destination);
      this.apply();
      this.timer = window.setInterval(() => this.music(), 450);
    } catch {
      /* Playback remains optional on restricted devices. */
    }
  }
  apply(): void {
    if (this.context) {
      this.musicGain!.gain.setTargetAtTime(
        this.settings.music * 0.17,
        this.context.currentTime,
        0.1,
      );
      this.sfxGain!.gain.setTargetAtTime(
        this.settings.sfx * 0.18,
        this.context.currentTime,
        0.1,
      );
    }
  }
  tone(
    freq: number,
    duration: number,
    gain: number,
    type: OscillatorType = "sine",
    music = false,
    slide = 0,
  ): void {
    const c = this.context;
    if (!c || c.state !== "running") return;
    const o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    if (slide)
      o.frequency.exponentialRampToValueAtTime(
        Math.max(20, freq + slide),
        c.currentTime + duration,
      );
    g.gain.setValueAtTime(0.001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(
      Math.max(0.002, gain),
      c.currentTime + 0.01,
    );
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    o.connect(g);
    g.connect(music ? this.musicGain! : this.sfxGain!);
    o.start();
    o.stop(c.currentTime + duration + 0.02);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  music(): void {
    const scales = [
      [146.83, 174.61, 220, 261.63, 293.66, 349.23],
      [130.81, 155.56, 196, 233.08, 261.63, 311.13],
      [164.81, 196, 246.94, 293.66, 329.63, 392],
      [138.59, 164.81, 207.65, 246.94, 277.18, 329.63],
    ];
    const s = scales[Math.max(0, this.biome)];
    const pattern = [0, 2, 4, 2, 1, 3, 5, 2, 0, 4, 3, 1, 2, 5, 4, 1];
    const n = s[pattern[this.step % 16]];
    this.tone(n * (this.biome < 0 ? 0.5 : 1), 1.6, 0.3, "sine", true);
    if (this.step % 4 === 0) this.tone(s[0] / 2, 2.1, 0.45, "triangle", true);
    if (this.combat && this.step % 2 === 0)
      this.tone(65, 0.18, 0.28, "triangle", true, -42);
    this.step++;
  }
  play(
    event:
      | "slash"
      | "hammer"
      | "bow"
      | "hit"
      | "hurt"
      | "dash"
      | "reward"
      | "portal"
      | "ui"
      | "death"
      | "step"
      | "magic",
  ): void {
    const map: Record<
      typeof event,
      [number, number, number, OscillatorType, number]
    > = {
      slash: [620, 0.14, 0.6, "sawtooth", -500],
      hammer: [95, 0.25, 1, "triangle", -70],
      bow: [730, 0.18, 0.5, "triangle", -280],
      hit: [150 + Math.random() * 100, 0.12, 0.8, "triangle", -100],
      hurt: [110, 0.27, 0.8, "sawtooth", -65],
      dash: [350, 0.17, 0.4, "sine", 500],
      reward: [660, 0.8, 0.6, "sine", 220],
      portal: [180, 1.2, 0.7, "sine", 500],
      ui: [440, 0.09, 0.4, "sine", 100],
      death: [160, 2, 0.9, "triangle", -120],
      step: [70, 0.055, 0.25, "triangle", -35],
      magic: [480, 0.45, 0.5, "sine", 300],
    };
    const [f, d, g, t, slide] = map[event];
    this.tone(f, d, g, t, false, slide);
  }
  dispose(): void {
    clearInterval(this.timer);
    void this.context?.close();
  }
}
