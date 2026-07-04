"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Login failed.");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center text-paper">
          <p className="font-display text-2xl font-bold tracking-brand">VINTAGE CLUB</p>
          <p className="mt-1 text-[11px] tracking-[0.4em] text-white/50">ADMIN PORTAL</p>
        </div>
        <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-xl">
          <h1 className="mb-1 text-lg font-semibold">Sign in</h1>
          <p className="mb-5 text-sm text-ash">Manage your store inventory and orders.</p>

          <label className="label">Username</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="username" />

          <label className="label mt-4">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button className="btn-primary mt-6 w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <a href="/" className="mt-6 block text-center text-xs text-white/50 hover:text-white/80">← Back to store</a>
      </div>
    </div>
  );
}
