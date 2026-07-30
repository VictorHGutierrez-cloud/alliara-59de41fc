import { useEffect, useRef, useState } from "react";

/** Minimal typing for the Web Speech API (not in the default TS DOM lib). */
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface UseSpeechInputOptions {
  /** Called with the final transcribed text every time the user finishes a phrase. */
  onTranscript: (text: string) => void;
}

/**
 * Voice-to-text via the browser's Web Speech API (Chrome/Edge).
 * `supported` is false on browsers without the API (e.g. Firefox) — hide the mic there.
 */
export function useSpeechInput({ onTranscript }: UseSpeechInputOptions) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognitionConstructor()));
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  function start() {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor || recognitionRef.current) return;
    try {
      const recognition = new Ctor();
      recognition.lang = navigator.language || "en-US";
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) {
            const text = result[0].transcript.trim();
            if (text) onTranscriptRef.current(text);
          }
        }
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setListening(false);
      };
      recognition.onerror = (event) => {
        console.error("[useSpeechInput - recognition]:", event);
        recognitionRef.current = null;
        setListening(false);
      };
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch (error) {
      console.error("[useSpeechInput - start]:", error);
      recognitionRef.current = null;
      setListening(false);
    }
  }

  function stop() {
    recognitionRef.current?.stop();
  }

  function toggle() {
    if (listening) stop();
    else start();
  }

  return { supported, listening, toggle };
}
