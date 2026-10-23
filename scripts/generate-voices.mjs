// Local Windows TTS export only: no network, registry writes or voice installation.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

if (!process.execArgv.includes("--experimental-transform-types")) {
  // VoiceDirector contains TypeScript parameter properties; Node 24 transforms
  // those at import time while ordinary type-only imports remain erased.
  const result=spawnSync(process.execPath,["--experimental-transform-types",fileURLToPath(import.meta.url),...process.argv.slice(2)],{stdio:"inherit",windowsHide:true});
  process.exit(result.status??1);
}
if(process.platform!=="win32")throw new Error("A exportação usa as vozes locais SAPI do Windows.");

const { CONVERSATIONS, dialogue } = await import("../src/data/narrative.ts");
const { CHARACTER_VOICES } = await import("../src/game/voices.ts");
const cscript=path.join(process.env.WINDIR??"C:\\Windows","System32","cscript.exe");
const tempFiles=[];
function runVbs(source,label,timeout=180000) {
  const file=path.join(os.tmpdir(),`vespera-voices-${process.pid}-${label}.vbs`);
  tempFiles.push(file);
  fs.writeFileSync(file,Buffer.concat([Buffer.from([255,254]),Buffer.from(source,"utf16le")]));
  const result=spawnSync(cscript,["//nologo",file],{encoding:"utf8",windowsHide:true,timeout});
  if(result.error||result.status!==0)throw new Error(`${label}: ${result.stdout??""} ${result.stderr??""} ${result.error?.message??""}`);
  return result.stdout??"";
}
const vb=(text)=>`"${String(text).replaceAll('"','""')}"`;
const xml=(text)=>String(text).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
const clamp=(n)=>Math.max(-10,Math.min(10,n));
function wavInfo(file) {
  const bytes=fs.readFileSync(file);
  if(bytes.length<44||bytes.toString("ascii",0,4)!=="RIFF"||bytes.toString("ascii",8,12)!=="WAVE"||bytes.readUInt32LE(4)+8!==bytes.length)throw new Error(`WAV RIFF inválido: ${file}`);
  let dataOffset=0,dataBytes=0,rate=0,channels=0,bits=0,format=0;
  for(let at=12;at+8<=bytes.length;){
    const type=bytes.toString("ascii",at,at+4),length=bytes.readUInt32LE(at+4),start=at+8;
    if(start+length>bytes.length)throw new Error(`Chunk WAV truncado: ${file}`);
    if(type==="fmt "&&length>=16){format=bytes.readUInt16LE(start);channels=bytes.readUInt16LE(start+2);rate=bytes.readUInt32LE(start+4);bits=bytes.readUInt16LE(start+14);}
    if(type==="data"){dataOffset=start;dataBytes=length;}
    at=start+length+(length%2);
  }
  if(format!==1||channels!==1||rate!==22050||bits!==16||dataBytes<2205)throw new Error(`PCM esperado: 22.050 Hz, 16 bits, mono: ${file}`);
  let nonzero=0;for(let i=dataOffset;i<dataOffset+dataBytes;i+=2)if(bytes.readInt16LE(i)!==0)nonzero++;
  if(nonzero<100)throw new Error(`Áudio silencioso: ${file}`);
  return {bytes:bytes.length,duration:dataBytes/(rate*channels*bits/8)};
}

try {
  const probe=runVbs(`On Error Resume Next
Dim speech, token, maria, daniel
Set speech = CreateObject("SAPI.SpVoice")
If Err.Number <> 0 Then
  WScript.Echo "SAPI indisponível: " & Err.Description
  WScript.Quit 2
End If
For Each token In speech.GetVoices()
  If InStr(LCase(token.GetDescription()), "maria") > 0 And token.GetAttribute("Language") = "416" Then Set maria = token
Next
If maria Is Nothing Then
  WScript.Echo "Nenhuma voz Maria pt-BR local disponível."
  WScript.Quit 3
End If
WScript.Echo "MARIA|" & maria.GetDescription() & "|" & maria.Id
Err.Clear
Set daniel = CreateObject("SAPI.SpObjectToken")
daniel.SetId "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Speech_OneCore\\Voices\\Tokens\\MSTTS_V110_ptBR_DanielM"
Set speech.Voice = daniel
If Err.Number = 0 Then WScript.Echo "DANIEL|" & daniel.GetDescription() & "|" & daniel.Id
`,"probe",15000);
  const voices={};
  for(const line of probe.split(/\r?\n/)){
    const [key,name,token]=line.split("|");
    if((key==="MARIA"||key==="DANIEL")&&name&&token)voices[key]={name,token};
  }
  if(!voices.MARIA)throw new Error("A exportação não encontrou uma voz portuguesa local.");
  console.log(`Voze(s) local(is): ${Object.values(voices).map(v=>v.name).join("; ")}`);
  const names={salvia:"Sálvia",orren:"Orren",nim:"Nim",lume:"Lume",caio:"Caio",iria:"Íria"};
  const states=[{deaths:0,bosses:[]},{deaths:0,bosses:[0]},{deaths:0,bosses:[0,1,2]}];
  // Death counts are the only unbounded dialogue interpolation. Export 1..20;
  // other counts retain browser speech synthesis through the runtime fallback.
  for(let deaths=1;deaths<=20;deaths++)states.push({deaths,bosses:[]});
  const root=path.resolve("public/assets"), directory=path.join(root,"voices");
  fs.mkdirSync(directory,{recursive:true});
  const catalog=[],jobs=[];
  for(const[npc,name]of Object.entries(names)){
    const profile=CHARACTER_VOICES[npc];
    const masculine=npc==="orren"||npc==="caio";
    const chosen=masculine?(voices.DANIEL??voices.MARIA):voices.MARIA;
    const texts=new Set();
    for(const state of states)for(const text of dialogue(name,state).lines)texts.add(text);
    for(const topic of CONVERSATIONS[npc])for(const text of topic.lines)texts.add(text);
    const pitch=clamp(Math.round(12*Math.log2(profile.pitch)));
    const rate=clamp(Math.round(10*Math.log2(profile.rate)));
    for(const text of texts){
      const hash=createHash("sha256").update(JSON.stringify({npc,text,voice:chosen.token,pitch,rate})).digest("hex").slice(0,16);
      const file=`voices/${npc}-${hash}.wav`,output=path.join(root,file);
      catalog.push({npc,text,file,voice:chosen.name,pitch:profile.pitch,rate:profile.rate,style:profile.style,...(masculine&&!voices.DANIEL?{fallbackVoice:true}:{})});
      let valid=false;
      if(fs.existsSync(output))try{wavInfo(output);valid=true;}catch{}
      if(!valid)jobs.push({npc,text,output,token:chosen.token,pitch,rate});
    }
  }
  if(jobs.length){
    const source=`On Error Resume Next
Dim speech
Set speech = CreateObject("SAPI.SpVoice")
If Err.Number <> 0 Then WScript.Quit 2
Sub ExportLine(text, output, tokenId, rate, pitch, number)
  On Error Resume Next
  Dim token, stream, markup
  Err.Clear
  Set token = CreateObject("SAPI.SpObjectToken")
  token.SetId tokenId
  Set speech.Voice = token
  speech.Rate = rate
  Set stream = CreateObject("SAPI.SpFileStream")
  stream.Format.Type = 22
  stream.Open output, 3, False
  Set speech.AudioOutputStream = stream
  markup = "<pitch middle=""" & pitch & """>" & text & "</pitch>"
  speech.Speak markup, 8
  If Err.Number <> 0 Then
    WScript.Echo "EXPORT_ERROR|" & number & "|" & Err.Number & "|" & Err.Description
    stream.Close
    WScript.Quit 4
  End If
  stream.Close
  WScript.Echo "EXPORTED|" & number
End Sub
${jobs.map((job,i)=>`Call ExportLine(${vb(xml(job.text))}, ${vb(job.output)}, ${vb(job.token)}, ${job.rate}, ${job.pitch}, ${i+1})`).join("\n")}
`;
    const log=runVbs(source,"export",240000);
    const count=log.split(/\r?\n/).filter(l=>l.startsWith("EXPORTED|")).length;
    if(count!==jobs.length)throw new Error(`Exportação incompleta: ${count}/${jobs.length}.`);
  }
  let bytes=0,duration=0;
  for(const row of catalog){const info=wavInfo(path.join(root,row.file));bytes+=info.bytes;duration+=info.duration;}
  fs.writeFileSync(path.join(root,"dialogue-voices.json"),JSON.stringify(catalog,null,2)+"\n","utf8");
  console.log(JSON.stringify({lines:catalog.length,generated:jobs.length,bytes,seconds:Math.round(duration),perNpc:Object.fromEntries(Object.keys(names).map(npc=>[npc,catalog.filter(row=>row.npc===npc).length])),maleVoice:voices.DANIEL?.name??voices.MARIA.name,catalog:"public/assets/dialogue-voices.json"}));
} finally {
  for(const file of tempFiles)try{fs.unlinkSync(file);}catch{}
}
