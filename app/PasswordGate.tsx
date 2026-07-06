"use client";

import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { verifyMasterPasscode } from "./db-helpers";

interface PasswordGateProps {
  onUnlock: () => void;
}

const PIN_LENGTH = 8;

export default function PasswordGate({ onUnlock }: PasswordGateProps) {
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    // Focus first input on mount
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => {
        setError(false);
        setDigits(Array(PIN_LENGTH).fill(""));
        inputs.current[0]?.focus();
      }, 800);
      return () => clearTimeout(t);
    }
  }, [error]);

  const trySubmit = async (full: string) => {
    if (full.length !== PIN_LENGTH) return;
    setSubmitting(true);
    
    try {
      const matched = await verifyMasterPasscode(full);
      if (matched) {
        // Successful unlock
        localStorage.setItem("vftp_unlocked", "true");
        onUnlock();
      } else {
        setError(true);
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Unlock error:", err);
      setError(true);
      setSubmitting(false);
    }
  };

  const setDigit = (i: number, value: string) => {
    // Sanitize to single alphanumeric character
    const v = value.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toLowerCase();
    const next = [...digits];
    next[i] = v;
    setDigits(next);

    // Auto-advance
    if (v && i < PIN_LENGTH - 1) {
      inputs.current[i + 1]?.focus();
    }

    if (next.every((d) => d.length === 1)) {
      trySubmit(next.join(""));
    }
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        inputs.current[i - 1]?.focus();
        const next = [...digits];
        next[i - 1] = "";
        setDigits(next);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < PIN_LENGTH - 1) {
      inputs.current[i + 1]?.focus();
    } else if (e.key === "Enter") {
      const full = digits.join("");
      if (full.length === PIN_LENGTH) trySubmit(full);
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "").slice(0, PIN_LENGTH).toLowerCase();
    if (!text) return;

    const next = Array(PIN_LENGTH).fill("");
    for (let i = 0; i < PIN_LENGTH && i < text.length; i++) {
      next[i] = text[i];
    }
    setDigits(next);

    const focusIdx = Math.min(text.length, PIN_LENGTH - 1);
    inputs.current[focusIdx]?.focus();

    if (next.every((d) => d.length === 1)) {
      trySubmit(next.join(""));
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-base-warm text-[#111111]">
      {/* Header bar */}
      <header className="flex items-center justify-between px-8 py-6 md:px-16 md:py-8 border-b border-rule bg-white">
        <div className="flex items-center gap-3">
          <img
            src="/media/davelabslogo.png"
            alt="DaveLabs"
            width={32}
            height={32}
            className="object-contain"
          />
          <div className="leading-tight">
            <div className="font-sans text-[14px] font-bold tracking-tight text-ink-deep">
              Virtual Teacher
            </div>
          </div>
        </div>
        <span className="hidden font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-ink-mute sm:inline">
          Private Access
        </span>
      </header>

      {/* Access Gate Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <div className="flex flex-col items-center max-w-[560px] w-full text-center">
          
          <div className="flex items-center gap-2 text-ink-mute">
            <Lock size={12} className="stroke-[1.5]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em]">
              Secure Presentation Passcode
            </span>
          </div>

          <h1 className="mt-6 text-3xl md:text-5xl font-semibold tracking-tight text-ink-deep">
            System is locked.
          </h1>

          <p className="mt-4 text-xs md:text-sm text-ink-soft leading-relaxed max-w-sm">
            Please enter the 8-character security passcode to access the system. This secures our presentation screen and operator consoles.
          </p>

          {/* Code Boxes Grid */}
          <div
            className={`mt-10 flex items-center gap-1.5 sm:gap-2.5 ${error ? "animate-shake" : ""}`}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                type="text"
                maxLength={1}
                value={d}
                disabled={submitting}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={onPaste}
                onFocus={(e) => e.currentTarget.select()}
                className={`h-11 w-9 sm:h-14 sm:w-11 rounded-lg border-2 bg-white text-center font-sans text-[20px] sm:text-[24px] font-bold text-ink-deep uppercase outline-none transition-all focus:scale-[1.04] ${
                  error
                    ? "border-red-500 bg-red-50/40 text-red-700"
                    : d
                    ? "border-ink"
                    : "border-rule hover:border-ink-mute"
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="mt-4 text-[12px] font-mono font-medium text-red-500">
              Passcode verification failed. Please try again.
            </p>
          )}

          {/* Partners & Logos Section */}
          <div className="flex flex-col items-center gap-4 mt-12 pt-6 border-t border-rule w-full">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-ink-mute">
              In Partnership With
            </span>
            <div className="flex items-center justify-center gap-8">
              {/* Kids Edutainment Labs */}
              <div className="flex flex-col items-center">
                <span className="font-sans text-[11px] font-bold text-ink-soft">
                  Kids Edutainment Labs
                </span>
                <span className="text-[8px] font-mono tracking-wider text-ink-mute uppercase">
                  Education Partner
                </span>
              </div>
              {/* UNICEF Logo */}
              <div className="flex flex-col items-center border-l border-rule pl-8">
                <img
                  src="https://thepoint.gm/assets/Featured-Articles/UNICEF.png"
                  alt="UNICEF"
                  className="h-8 object-contain opacity-90"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-rule bg-white py-6 text-center">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-ink-mute">
          DaveLabs · vtp.davelabs.co © 2026
        </span>
      </footer>
    </main>
  );
}
