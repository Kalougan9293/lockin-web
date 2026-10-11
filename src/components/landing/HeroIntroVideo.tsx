"use client";

import { useRef, useState } from "react";

const VIDEO_SRC = "/media/lockin-intro.mp4";
const COVER_SRC = "/media/lockin-intro-cover.jpg";

export function HeroIntroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  async function startPlayback() {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = true;
      await video.play();
      setPlaying(true);
    } catch {
      // Autoplay/play bloqué : la couverture reste affichée.
    }
  }

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[1.75rem] bg-brand-accent/18 blur-2xl"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-brand-card shadow-[0_18px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(99,102,241,0.25)] ring-1 ring-brand-accent/30">
        <video
          ref={videoRef}
          className="aspect-video w-full object-cover"
          src={VIDEO_SRC}
          poster={COVER_SRC}
          muted
          playsInline
          loop
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          controls={playing}
          aria-label="Présentation LockIn"
        />

        {!playing ? (
          <button
            type="button"
            onClick={() => void startPlayback()}
            className="absolute inset-0 flex items-center justify-center bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent/60"
            aria-label="Lire la vidéo"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-accent text-white shadow-[0_12px_40px_rgba(99,102,241,0.55)] ring-2 ring-white/30 transition-transform hover:scale-105">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="ml-0.5 h-6 w-6"
                aria-hidden
              >
                <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86a1 1 0 0 0-1.5.86Z" />
              </svg>
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
