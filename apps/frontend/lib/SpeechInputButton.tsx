"use client";

import { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import styles from "./SpeechInputButton.module.css";
import type { LanguageCode } from "./languages";

type SpeechRecognitionResult = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResult) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
};

const SPEECH_LOCALES: Record<LanguageCode, string> = {
  en: "en-US", ar: "ar-SA", ur: "ur-PK", de: "de-DE", es: "es-ES", it: "it-IT", zh: "zh-CN",
};

export function SpeechInputButton({ onTranscript, disabled = false, language = "en" }: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: LanguageCode;
}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const activeRecognition = useRef<SpeechRecognitionInstance | null>(null);
  const toggle = () => {
    const Speech = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!Speech) { setError("Speech input is not supported by this browser."); return; }
    if (listening) { activeRecognition.current?.stop(); setListening(false); return; }
    const recognition = new Speech();
    recognition.lang = SPEECH_LOCALES[language];
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0]?.transcript || "").join(" ").trim();
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = () => { setError("Could not capture speech. Check microphone access and try again."); setListening(false); };
    recognition.onend = () => setListening(false);
    activeRecognition.current = recognition;
    setError(""); setListening(true); recognition.start();
  };
  return <span className="inline-flex flex-wrap items-center gap-2">
    <button type="button" onClick={toggle} disabled={disabled} aria-pressed={listening} aria-label={listening ? "Stop speech input" : "Start speech input"} title={listening ? "Stop speaking" : "Speak your prompt"} className={styles.control}>
      {listening ? <><span className={styles.status}><span className={styles.dot} aria-hidden="true" />Recording</span><span className={styles.wave} aria-hidden="true"><i /><i /><i /><i /><i /></span><MicOff size={14} />Stop</> : <><Mic size={14} />Speak</>}
    </button>{error && <span role="status" className={styles.error}>{error}</span>}
  </span>;
}
