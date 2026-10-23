import type { NpcId, Settings } from "../types";

export const CHARACTER_VOICES: Record<NpcId, { pitch: number; rate: number; style: string; index: number }> = {
  salvia: { pitch: .84, rate: .88, style: "Serena e acolhedora", index: 0 },
  orren: { pitch: .64, rate: .82, style: "Grave e pausada", index: 1 },
  nim: { pitch: 1.38, rate: 1.12, style: "Ágil e curiosa", index: 2 },
  lume: { pitch: 1.06, rate: .98, style: "Calorosa e direta", index: 3 },
  caio: { pitch: .94, rate: .91, style: "Calma e cuidadosa", index: 4 },
  iria: { pitch: 1.18, rate: 1.03, style: "Clara e firme", index: 5 },
};
export function portugueseVoice(voices: SpeechSynthesisVoice[], npc: NpcId): SpeechSynthesisVoice | undefined {
  const local = voices.filter(v => /^pt(?:-|_)/i.test(v.lang) && v.localService);
  const brazilian = local.filter(v => /^pt[-_]BR$/i.test(v.lang));
  const pool = (brazilian.length ? brazilian : local).sort((a, b) => a.voiceURI.localeCompare(b.voiceURI));
  const preferred = npc === "orren" || npc === "caio" ? /daniel|antonio|paulo|duarte|jorge/i : /maria|francisca|raquel|joana|luciana/i;
  const matches = pool.filter(v => preferred.test(v.name));
  return matches[CHARACTER_VOICES[npc].index % matches.length] ?? pool[CHARACTER_VOICES[npc].index % pool.length];
}
export type VoiceStatus = "speaking" | "ready" | "muted" | "unavailable";
export interface DialogueVoice { npc: NpcId; text: string; file: string; voice: string; }
export class VoiceDirector {
  status: VoiceStatus = "ready";
  onStatus: (status: VoiceStatus) => void = () => {};
  lastRequest: { npc: NpcId; text: string; lang: string; pitch: number; rate: number; voice: string; source: "audio" | "synthesis"; file?: string } | null = null;
  private catalog: DialogueVoice[] = [];
  private audio: HTMLAudioElement | null = null;
  private token = 0;
  private pending = 0;
  constructor(public settings: Settings, private duck: (speaking: boolean) => void) {}
  get supported(): boolean { return this.catalog.length > 0 || this.nativeSupported; }
  private get nativeSupported(): boolean { return typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined"; }
  setCatalog(raw: unknown): void {
    this.catalog = Array.isArray(raw) ? raw.filter((v): v is DialogueVoice => v && Object.hasOwn(CHARACTER_VOICES, v.npc) && typeof v.text === "string" && /^voices\/[a-z0-9-]+\.wav$/.test(v.file) && typeof v.voice === "string") : [];
  }
  private setStatus(status: VoiceStatus): void { this.status = status; this.onStatus(status); }
  stop(): void {
    this.token++; clearTimeout(this.pending);
    if (this.audio) { this.audio.onplaying = null; this.audio.onended = null; this.audio.onerror = null; this.audio.pause(); this.audio = null; }
    if (this.nativeSupported) speechSynthesis.cancel();
    this.duck(false); this.setStatus(this.settings.voice <= 0 ? "muted" : "ready");
  }
  say(npc: NpcId, text: string, manual = false): void {
    this.stop();
    if (this.settings.voice <= 0 || (!manual && !this.settings.voiceAuto)) { this.setStatus("muted"); return; }
    const token = this.token;
    const clip = this.catalog.find(v => v.npc === npc && v.text === text);
    if (clip && typeof Audio !== "undefined") {
      const audio = new Audio(`assets/${clip.file}`), profile = CHARACTER_VOICES[npc];
      this.audio = audio; audio.volume = this.settings.voice; audio.preload = "auto";
      this.lastRequest = { npc, text, lang: "pt-BR", pitch: profile.pitch, rate: profile.rate, voice: clip.voice, source: "audio", file: clip.file };
      audio.onplaying = () => { if (token === this.token) { this.duck(true); this.setStatus("speaking"); } };
      audio.onended = () => { if (token === this.token) { this.audio = null; this.duck(false); this.setStatus("ready"); } };
      let failed = false;
      const fallback = () => {
        if (failed || token !== this.token) return; failed = true;
        audio.onplaying = null; audio.onended = null; audio.onerror = null; audio.pause(); this.audio = null; this.duck(false);
        this.synthesize(npc, text, token);
      };
      audio.onerror = fallback;
      void audio.play().catch(fallback);
      return;
    }
    this.synthesize(npc, text, token);
  }
  private synthesize(npc: NpcId, text: string, token: number): void {
    if (!this.nativeSupported) { this.setStatus("unavailable"); return; }
    const play = (retry = 0) => {
      if (token !== this.token) return;
      const voice = portugueseVoice(speechSynthesis.getVoices(), npc);
      if (!voice) {
        if (retry < 5) this.pending = window.setTimeout(() => play(retry + 1), 200);
        else this.setStatus("unavailable");
        return;
      }
      const profile = CHARACTER_VOICES[npc], line = new SpeechSynthesisUtterance(text);
      line.lang = "pt-BR"; line.voice = voice; line.pitch = profile.pitch; line.rate = profile.rate; line.volume = this.settings.voice;
      this.lastRequest = { npc, text, lang: line.lang, pitch: line.pitch, rate: line.rate, voice: voice.name, source: "synthesis" };
      line.onstart = () => { if (token === this.token) { this.duck(true); this.setStatus("speaking"); } };
      line.onend = () => { if (token === this.token) { this.duck(false); this.setStatus("ready"); } };
      line.onerror = () => { if (token === this.token) { this.duck(false); this.setStatus("unavailable"); } };
      speechSynthesis.speak(line);
    };
    play();
  }
}
