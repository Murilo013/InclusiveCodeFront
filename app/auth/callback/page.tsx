"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const username = searchParams.get("username");

    if (!token || !username) {
      router.replace("/login");
      return;
    }

    try {
      sessionStorage.setItem("auth_token", token);
      sessionStorage.setItem("auth_user", username);
    } catch {}

    router.replace("/scanner");
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617]">
      <div className="flex flex-col items-center gap-4">
        <span className="inline-block w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-300 rounded-full animate-spin" />
        <p className="text-cyan-400 font-mono text-sm uppercase tracking-widest">
          Autenticando...
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#020617]">
          <span className="inline-block w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-300 rounded-full animate-spin" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
