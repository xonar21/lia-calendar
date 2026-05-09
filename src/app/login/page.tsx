"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

const imgLogo = "/icons/Frame 140.svg";

type MeResponse = {
  user: { id: string; email: string } | null;
  auth: { googleEnabled: boolean; devAllowed: boolean };
};

const ERROR_LABELS: Record<string, string> = {
  invalid_state: "Sign-in link expired or invalid. Please try again.",
  no_email: "Google didn't return an email for your account.",
  oauth_failed: "Could not complete Google sign-in. Please try again.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--lia-canvas)]">
      <div className="h-[360px] w-[440px] rounded-[24px] border border-[var(--lia-border-soft)] bg-[var(--lia-surface)] opacity-40" />
    </main>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") ?? "/";
  const errorParam = searchParams.get("error");

  const [auth, setAuth] = useState<MeResponse["auth"] | null>(null);
  const [devEmail, setDevEmail] = useState("demo@lia.local");
  const [devName, setDevName] = useState("Demo User");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam ? ERROR_LABELS[errorParam] ?? "Sign-in failed." : null,
  );

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) return;
        const payload: MeResponse = await response.json();
        if (payload.user) {
          router.replace(nextParam);
          return;
        }
        setAuth(payload.auth);
      } catch {
        // noop
      }
    };
    void load();
  }, [nextParam, router]);

  const onGoogle = () => {
    const target = `/api/auth/google/start?next=${encodeURIComponent(nextParam)}`;
    window.location.href = target;
  };

  const onDevSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: devEmail.trim().toLowerCase(), name: devName.trim() || undefined }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "Dev login failed");
      }
      router.replace(nextParam);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--lia-canvas)] px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-[-15%] h-[480px] w-[480px] rounded-full bg-[var(--lia-accent-warm-tint)] opacity-60 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[520px] w-[520px] rounded-full bg-[var(--lia-accent-cool-tint)] opacity-70 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] rounded-[24px] border border-[var(--lia-border-soft)] bg-[var(--lia-surface)] p-8 shadow-[0_24px_60px_-24px_rgba(30,25,20,0.3)]">
        <div className="flex flex-col items-center">
          <Image
            src={imgLogo}
            alt="by Lia"
            width={174}
            height={65}
            unoptimized
            className="h-[65px] w-[174px]"
          />
          <h1 className="mt-6 text-[28px] leading-none tracking-[-0.01em] text-[var(--lia-accent-warm)]">
            Welcome to Lia
          </h1>
          <p className="mt-2 text-center text-[14px] text-[var(--lia-muted)]">
            Your calendar for events, tasks, journals and notes.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-[12px] border border-[#e9c3c3] bg-[#fbe8e8] px-3 py-2 text-[13px] text-[#963838]">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onGoogle}
            disabled={auth ? !auth.googleEnabled : false}
            className="flex h-[48px] items-center justify-center gap-3 rounded-full border border-[var(--lia-border)] bg-white text-[15px] text-[#2f2a22] shadow-[0_1px_2px_rgba(90,79,62,0.08)] transition hover:border-[var(--lia-accent-warm)]/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleGlyph />
            <span>Continue with Google</span>
          </button>
          {auth && !auth.googleEnabled && (
            <p className="text-center text-[12px] text-[var(--lia-muted)]">
              Google sign-in is not configured yet. Ask an admin to set{" "}
              <code className="rounded bg-black/5 px-1">GOOGLE_CLIENT_ID</code> /{" "}
              <code className="rounded bg-black/5 px-1">GOOGLE_CLIENT_SECRET</code>.
            </p>
          )}
        </div>

        {auth?.devAllowed && (
          <>
            <div className="my-6 flex items-center gap-3 text-[12px] uppercase tracking-[0.16em] text-[var(--lia-muted-soft)]">
              <span className="h-px flex-1 bg-[var(--lia-border)]" />
              or dev login
              <span className="h-px flex-1 bg-[var(--lia-border)]" />
            </div>

            <form onSubmit={onDevSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--lia-muted)]">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={devEmail}
                  onChange={(event) => setDevEmail(event.target.value)}
                  className="rounded-[12px] border border-[var(--lia-border)] bg-white px-3 py-2 text-[14px]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--lia-muted)]">
                  Display name
                </span>
                <input
                  type="text"
                  value={devName}
                  onChange={(event) => setDevName(event.target.value)}
                  className="rounded-[12px] border border-[var(--lia-border)] bg-white px-3 py-2 text-[14px]"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="mt-1 h-[44px] rounded-full bg-[var(--lia-accent-warm)] text-[14px] text-white shadow-[0_6px_16px_-8px_rgba(125,88,25,0.6)] hover:brightness-110 disabled:opacity-60"
              >
                {submitting ? "Signing in..." : "Continue"}
              </button>
              <p className="text-center text-[11px] text-[var(--lia-muted)]">
                Dev login is only available in non-production environments.
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.48h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.568 2.684-3.874 2.684-6.613Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.908v2.331A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.908A9 9 0 0 0 0 9c0 1.452.348 2.827.908 4.042l3.056-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.581-2.58C13.463.891 11.426 0 9 0A9 9 0 0 0 .908 4.958l3.056 2.332C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}
