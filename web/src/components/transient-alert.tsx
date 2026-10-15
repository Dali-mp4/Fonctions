"use client";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type Tone = "success" | "error";
type Props = { message: string | null | undefined; tone: Tone };

const FADE_MS = 550;
export const NOTICE_DURATION_MS = 5000;
export const ERROR_DURATION_MS = 8500;

export function TransientAlert({ message, tone }: Props) {
  if (!message) return null;
  // Remount the timer when the text changes (and after a cleared message).
  return <TimedAlert key={tone + ":" + message} message={message} tone={tone}/>;
}

function TimedAlert({ message, tone }: { message: string; tone: Tone }) {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const duration = tone === "error" ? ERROR_DURATION_MS : NOTICE_DURATION_MS;
    const fade = window.setTimeout(() => setFading(true), duration - FADE_MS);
    const hide = window.setTimeout(() => setHidden(true), duration);
    return () => { window.clearTimeout(fade); window.clearTimeout(hide); };
  }, [tone]);
  if (hidden) return null;
  return <div role={tone === "error" ? "alert" : "status"}
    className={`${tone === "error" ? "run-error" : "success-strip"} transient-alert${fading ? " transient-alert--fading" : ""}`}>
    {tone === "error" ? <AlertCircle size={16} aria-hidden="true"/> :
      <CheckCircle2 size={16} aria-hidden="true"/>}
    <span className="transient-alert__text">{message}</span>
    <button type="button" className="transient-alert__dismiss"
      onClick={() => setHidden(true)} aria-label="Fermer le message"
      title="Fermer le message"><X size={16} aria-hidden="true"/></button>
  </div>;
}
