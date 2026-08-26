"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

const GSI_MAX_WIDTH = 400;

const GoogleGlyph = () => (
  <svg viewBox="0 0 18 18" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.8741 2.6836-6.615z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1805l-2.9087-2.2581c-.8059.5404-1.8368.859-3.0477.859-2.3436 0-4.3282-1.5822-5.0359-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.9641 10.71c-.18-.5404-.2823-1.1173-.2823-1.71s.1023-1.1696.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.9641 10.71z"
    />
    <path
      fill="#EA4335"
      d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.9641 7.29C4.6718 5.1618 6.6564 3.5795 9 3.5795z"
    />
  </svg>
);

export default function GoogleSignInButton({
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const initializedRef = useRef(false);
  const renderedWidthRef = useRef(0);

  const handlersRef = useRef({ onCredential, onError });
  useEffect(() => {
    handlersRef.current = { onCredential, onError };
  });

  const render = useCallback(() => {
    const wrapper = wrapperRef.current;
    const host = buttonRef.current;
    if (!GOOGLE_CLIENT_ID || !window.google || !wrapper || !host) return;

    const width = Math.round(wrapper.getBoundingClientRect().width);
    if (!width || width === renderedWidthRef.current) return;
    renderedWidthRef.current = width;

    if (!initializedRef.current) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential) {
            handlersRef.current.onCredential(response.credential);
          } else {
            handlersRef.current.onError?.("Google sign-in did not return a credential.");
          }
        },
      });
      initializedRef.current = true;
    }

    host.innerHTML = "";
    window.google.accounts.id.renderButton(host, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      shape: "rectangular",
      text: "continue_with",
      logo_alignment: "left",
      width: Math.min(width, GSI_MAX_WIDTH),
    });

    setFailed(false);
    setReady(true);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver(() => render());
    observer.observe(wrapper);

    const timer = setTimeout(() => {
      if (!window.google) setFailed(true);
    }, 10000);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [render]);

  if (!GOOGLE_CLIENT_ID) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[GoogleSignInButton] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set — the Google sign-in button is hidden. Set it in frontend/.env and restart the dev server.",
      );
    }
    return null;
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={render}
        onError={() => setFailed(true)}
      />

      <div ref={wrapperRef} className="w-full">
        <div
          ref={buttonRef}
          className={`gsi-host w-full overflow-hidden rounded-xl ring-1 ring-white/10 transition-shadow duration-200 hover:ring-white/25 focus-within:ring-2 focus-within:ring-emerald-500 ${
            ready ? "" : "hidden"
          }`}
        />

        {!ready && (
          <div
            aria-hidden="true"
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white/60 ring-1 ring-white/10"
          >
            <GoogleGlyph />
            <span>
              {failed ? "Google Sign-In unavailable" : "Loading Google Sign-In…"}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
