"use client";
import { useEffect, useRef, useState } from "react";
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

// Google's SDK only renders its button inside a cross-origin iframe, so it
// can't be restyled directly. We render the real (functional) button
// invisibly on top of a fully custom glass button underneath — clicks,
// keyboard focus, and screen readers all still go through Google's own
// element; only the paint is ours.
export default function GoogleSignInButton({
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const initialize = () => {
    if (!GOOGLE_CLIENT_ID || !window.google || !buttonRef.current || !wrapperRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          onCredential(response.credential);
        } else {
          onError?.("Google sign-in did not return a credential.");
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      width: wrapperRef.current.offsetWidth || 320,
    });

    setReady(true);
  };

  useEffect(() => {
    if (window.google) initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initialize}
      />

      <div ref={wrapperRef} className="group relative w-full">
        {/* Visual glass button — decorative only, the real click target sits on top */}
        <div
          aria-hidden="true"
          className={`relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white shadow-lg shadow-black/30 backdrop-blur-xl transition-all duration-200 group-hover:border-white/25 group-hover:bg-white/[0.1] group-focus-within:ring-2 group-focus-within:ring-emerald-500 ${
            ready ? "" : "opacity-60"
          }`}
        >
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 via-white/0 to-transparent" />
          <span className="pointer-events-none absolute -inset-x-6 -top-8 h-16 rotate-3 bg-white/10 blur-xl transition-opacity duration-300 group-hover:opacity-80" />
          <GoogleGlyph />
          <span className="relative">
            {ready ? "Continue with Google" : "Loading Google Sign-In…"}
          </span>
        </div>

        {/* Google's real button — invisible, exact overlay, receives the click */}
        <div
          ref={buttonRef}
          className={`absolute inset-0 overflow-hidden rounded-2xl opacity-0 ${
            ready ? "" : "pointer-events-none"
          }`}
        />
      </div>
    </>
  );
}
