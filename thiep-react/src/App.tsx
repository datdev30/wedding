import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import svg1 from "@thiep/1.svg?url";
import svg2 from "@thiep/2.svg?url";
import "./App.css";

type Phase = "splash" | "bridge" | "main";

/** Nhạc tĩnh: đặt file `public/wedding-song.mp3` (hoặc copy từ `template5/wedding-song.mp3`). */
const WEDDING_SONG_SRC = "/wedding-song.mp3";

function prefetchImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => {
      void (async () => {
        try {
          if ("decode" in im && typeof im.decode === "function") {
            await im.decode();
          }
        } catch {
          /* ignore */
        }
        resolve();
      })();
    };
    im.onerror = () => reject(new Error("prefetch failed"));
    im.src = src;
  });
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

type BridgeProps = {
  src: string;
  durationMs: number;
  onDone: () => void;
};

function Bridge({ src, durationMs, onDone }: BridgeProps) {
  const [play, setPlay] = useState(false);
  const armed = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const armAnimation = useCallback(
    async (img: HTMLImageElement) => {
      if (armed.current) return;
      armed.current = true;
      try {
        if ("decode" in img && typeof img.decode === "function") {
          await img.decode();
        }
      } catch {
        /* ignore */
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPlay(true);
          clearTimer();
          timerRef.current = setTimeout(onDone, durationMs);
        });
      });
    },
    [clearTimer, durationMs, onDone],
  );

  const onImgLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      void armAnimation(e.currentTarget);
    },
    [armAnimation],
  );

  const onImgError = useCallback(() => {
    if (armed.current) return;
    armed.current = true;
    onDone();
  }, [onDone]);

  useLayoutEffect(() => {
    const el = imgRef.current;
    if (!el || armed.current) return;
    if (el.complete) {
      void armAnimation(el);
    }
  }, [src, armAnimation]);

  const cssDur = `${durationMs}ms`;

  return (
    <div className="bridge" aria-hidden={false}>
      <div
        className={`bridge__stage${play ? " bridge__stage--play" : ""}`}
        style={{ ["--bridge-dur" as string]: cssDur }}
      >
        <img
          ref={imgRef}
          className="bridge__art"
          src={src}
          alt=""
          width={397}
          height={559}
          decoding="sync"
          loading="eager"
          fetchPriority="high"
          onLoad={onImgLoad}
          onError={onImgError}
        />
      </div>
    </div>
  );
}

type MusicToggleProps = {
  playing: boolean;
  onToggle: () => void;
};

function MusicToggle({ playing, onToggle }: MusicToggleProps) {
  return (
    <button
      type="button"
      id="music-toggle"
      className={`music-toggle${playing ? " music-toggle--playing" : ""}`}
      aria-label={playing ? "Tắt nhạc nền" : "Bật nhạc nền"}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <span className="music-toggle__ring" aria-hidden />
      <span className="music-toggle__icon" aria-hidden>
        {playing ? (
          <svg
            className="music-toggle__svg"
            viewBox="0 0 24 24"
            width={24}
            height={24}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.85}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path
              className="music-toggle__wave music-toggle__wave--a"
              d="M15.54 8.46a5 5 0 0 1 0 7.07"
            />
            <path
              className="music-toggle__wave music-toggle__wave--b"
              d="M19.07 4.93a10 10 0 0 1 0 14.14"
            />
          </svg>
        ) : (
          <svg
            className="music-toggle__svg music-toggle__svg--muted"
            viewBox="0 0 24 24"
            width={24}
            height={24}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.85}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        )}
      </span>
    </button>
  );
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("splash");
  const [splashBusy, setSplashBusy] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const reduced = usePrefersReducedMotion();
  const bridgeMs = reduced ? 160 : 3000;
  const bridgeDoneOnce = useRef(false);
  const splashOpening = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setMusicPlaying(true);
    const onPause = () => setMusicPlaying(false);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  const onBridgeDone = useCallback(() => {
    if (bridgeDoneOnce.current) return;
    bridgeDoneOnce.current = true;
    setPhase("main");
  }, []);

  const tryStartMusic = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    void a.play().catch(() => {
      /* một số trình duyệt chặn autoplay — người dùng vẫn có nút nhạc */
    });
  }, []);

  const toggleMusic = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (musicPlaying) {
      a.pause();
    } else {
      void a.play().catch(() => {});
    }
  }, [musicPlaying]);

  const onSplashOpen = useCallback(async () => {
    if (phase !== "splash" || splashOpening.current) return;
    splashOpening.current = true;
    tryStartMusic();
    setSplashBusy(true);
    try {
      await prefetchImage(svg2);
    } catch {
      /* vẫn chuyển bridge */
    } finally {
      setSplashBusy(false);
      splashOpening.current = false;
    }
    setPhase("bridge");
  }, [phase, tryStartMusic]);

  const showMusicUi = phase === "bridge" || phase === "main";

  return (
    <>
      <audio
        ref={audioRef}
        id="bg-music"
        src={WEDDING_SONG_SRC}
        loop
        preload="auto"
      />

      {phase === "splash" && (
        <div className="splash" id="splash">
          <button
            type="button"
            className="splash__open"
            aria-label="Mở thiệp cưới"
            aria-busy={splashBusy}
            disabled={splashBusy}
            onClick={() => void onSplashOpen()}
          >
            <img src={svg1} alt="" width={397} height={559} decoding="async" />
          </button>
        </div>
      )}

      {phase === "bridge" && (
        <Bridge src={svg2} durationMs={bridgeMs} onDone={onBridgeDone} />
      )}

      {phase === "main" && (
        <main className="deck deck--main" aria-label="Nội dung thiệp LadiPage">
          {/* Dev: Vite phục vụ public/ladipage/index.html (không phải dist/). Iframe không HMR — sửa HTML/CSS thiệp rồi F5 hoặc đợi full reload khi Vite phát hiện thay đổi trong public/. */}
          <iframe
            className="ladipage-embed"
            src={`${import.meta.env.BASE_URL}ladipage/index.html`}
            title="Thiệp cưới — nội dung theo template1"
          />
        </main>
      )}

      {showMusicUi && (
        <MusicToggle playing={musicPlaying} onToggle={toggleMusic} />
      )}
    </>
  );
}
