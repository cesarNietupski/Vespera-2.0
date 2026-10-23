import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { CHARACTER_VOICES, portugueseVoice, VoiceDirector, type DialogueVoice } from "../src/game/voices";
import { freshSave } from "../src/game/save";
import { CONVERSATIONS, dialogue } from "../src/data/narrative";
import { HUB_NPCS } from "../src/data/npcs";
const catalog: DialogueVoice[] = JSON.parse(readFileSync("public/assets/dialogue-voices.json", "utf8"));
const v = (name: string, lang = "pt-BR", localService = true) => ({ name, voiceURI: name, lang, localService }) as SpeechSynthesisVoice;
let spoken: SpeechSynthesisUtterance[];
let audioInstances: FakeAudio[];
class FakeAudio {
  volume = 1; preload = ""; paused = false;
  onplaying: (() => void) | null = null; onended: (() => void) | null = null; onerror: (() => void) | null = null;
  constructor(public src: string) { audioInstances.push(this); }
  async play() { this.onplaying?.(); }
  pause() { this.paused = true; }
}
beforeEach(() => {
  spoken = []; audioInstances = []; vi.useFakeTimers();
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("SpeechSynthesisUtterance", class { constructor(public text: string) {} });
  vi.stubGlobal("speechSynthesis", { cancel: vi.fn(), getVoices: () => [v("Microsoft Maria"), v("Microsoft Daniel")], speak: (line: SpeechSynthesisUtterance) => { spoken.push(line); } });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
it("seis perfis têm ritmos e timbres diferentes e escolhem vozes locais em português", () => {
  expect(new Set(Object.values(CHARACTER_VOICES).map(p => `${p.pitch}/${p.rate}`)).size).toBe(6);
  expect(portugueseVoice([v("English", "en-US"), v("Cloud", "pt-BR", false)], "nim")).toBeUndefined();
  expect(portugueseVoice([v("Microsoft Maria"), v("Microsoft Daniel")], "orren")?.name).toContain("Daniel");
  expect(portugueseVoice([v("Microsoft Maria"), v("Microsoft Daniel")], "salvia")?.name).toContain("Maria");
});
it("catálogo cobre conversas, progresso e retornos e todos os áudios têm PCM audível", () => {
  const found = new Set(catalog.map(c => `${c.npc}:${c.text}`));
  for (const npc of HUB_NPCS) {
    const save = freshSave();
    for (const state of [save, { ...save, bosses: [2] }, ...Array.from({ length: 20 }, (_, i) => ({ ...save, deaths: i + 1 }))])
      for (const line of dialogue(npc.name, state).lines) expect(found.has(`${npc.id}:${line}`)).toBe(true);
    for (const topic of CONVERSATIONS[npc.id]) for (const line of topic.lines) expect(found.has(`${npc.id}:${line}`)).toBe(true);
  }
  expect(found.size).toBe(catalog.length);
  for (const clip of catalog) {
    const wav = readFileSync(`public/assets/${clip.file}`);
    expect(wav.toString("ascii", 0, 4)).toBe("RIFF"); expect(wav.toString("ascii", 8, 12)).toBe("WAVE");
    expect(wav.readUInt32LE(4) + 8).toBe(wav.length); expect(wav.length).toBeGreaterThan(10000);
    expect(wav.subarray(44).some(b => b !== 0)).toBe(true);
  }
});
it("reproduz áudio incluído, reduz música e interrompe imediatamente ao fechar", async () => {
  const duck = vi.fn(), settings = freshSave().settings, voice = new VoiceDirector(settings, duck);
  voice.setCatalog(catalog); voice.say(catalog[0].npc, catalog[0].text);
  expect(voice.lastRequest?.source).toBe("audio"); expect(audioInstances[0].volume).toBe(.85);
  expect(voice.status).toBe("speaking"); expect(duck).toHaveBeenLastCalledWith(true); expect(spoken).toHaveLength(0);
  voice.stop(); expect(audioInstances[0].paused).toBe(true); expect(voice.status).toBe("ready"); expect(duck).toHaveBeenLastCalledWith(false);
  expect(audioInstances[0].onended).toBeNull();
});
it("respeita mudo e leitura automática, mas permite repetir manualmente", () => {
  const settings = freshSave().settings, voice = new VoiceDirector(settings, () => {}); voice.setCatalog(catalog);
  settings.voiceAuto = false; voice.say("salvia", catalog[0].text); expect(audioInstances).toHaveLength(0);
  voice.say("salvia", catalog[0].text, true); expect(audioInstances).toHaveLength(1);
  settings.voice = 0; voice.say("salvia", catalog[0].text, true); expect(audioInstances).toHaveLength(1); expect(voice.status).toBe("muted");
});
it("fallback local fala português e um áudio quebrado só dispara uma síntese", () => {
  const voice = new VoiceDirector(freshSave().settings, () => {}); voice.setCatalog(catalog);
  voice.say("salvia", catalog[0].text); const failure = audioInstances[0].onerror!; failure(); failure();
  expect(spoken).toHaveLength(1); expect(spoken[0].lang).toBe("pt-BR"); expect(spoken[0].voice?.name).toContain("Maria");
  voice.say("orren", "Uma frase variável."); expect(voice.lastRequest?.source).toBe("synthesis"); expect(spoken[1].pitch).toBe(CHARACTER_VOICES.orren.pitch);
});
it("cancelar impede repetição tardia quando nenhuma voz do sistema está disponível", () => {
  vi.stubGlobal("speechSynthesis", { cancel: vi.fn(), getVoices: () => [], speak: vi.fn() });
  const voice = new VoiceDirector(freshSave().settings, () => {}); voice.say("orren", "Frase variável"); voice.stop(); vi.runAllTimers();
  expect(voice.status).toBe("ready"); expect(speechSynthesis.speak).not.toHaveBeenCalled();
  voice.say("orren", "Outra frase"); vi.runAllTimers(); expect(voice.status).toBe("unavailable");
});
