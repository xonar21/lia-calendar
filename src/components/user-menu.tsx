"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Me = {
  id: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
};

export function UserMenu() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) return;
        const payload: { user: Me | null } = await response.json();
        setMe(payload.user);
      } catch {
        // ignore
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.replace("/login");
    router.refresh();
  };

  const displayName = me?.name || me?.email || "Guest";
  const initials = (me?.name || me?.email || "?")
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("") || "U";
  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-full ring-2 ring-white/60 transition hover:ring-[var(--lia-accent-warm)]/40"
      >
        {me?.imageUrl ? (
          <Image src={me.imageUrl} alt="" width={40} height={40} unoptimized className="h-[40px] w-[40px]" />
        ) : me ? (
          <span className="flex h-full w-full items-center justify-center bg-[var(--lia-accent-warm-tint)] text-[14px] font-medium text-[var(--lia-accent-warm)]">
            {initials}
          </span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--lia-muted)]">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 21C4 17.6863 6.68629 15 10 15H14C17.3137 15 20 17.6863 20 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {open && (
        <div className="lia-pop-in absolute right-0 top-[48px] z-50 w-[240px] overflow-hidden rounded-[14px] border border-[var(--lia-border-soft)] bg-white shadow-[0_20px_44px_-20px_rgba(30,25,20,0.3)]">
          <div className="border-b border-[var(--lia-border-soft)] px-4 py-3">
            <p className="truncate text-[14px] font-medium text-[#2f2a22]">{displayName}</p>
            {me?.email && me.email !== displayName && (
              <p className="truncate text-[12px] text-[var(--lia-muted)]">{me.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="w-full px-4 py-3 text-left text-[13px] text-[#3d362d] hover:bg-black/5 disabled:opacity-60"
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
