"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connexion impossible");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <span className="relative mx-auto block h-16 w-52">
              <Image
                src="/aurex-logo.png"
                alt="Aurex Logistics"
                fill
                sizes="208px"
                className="object-contain"
                priority
              />
            </span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Espace administration</h1>
          <p className="mt-2 text-text-secondary">Connectez-vous pour accéder au tableau de bord</p>
        </div>

        <div className="rounded-2xl bg-panel p-8 shadow-large">
          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-error bg-error-50 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-text-primary">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="Votre e-mail"
                className="input-field w-full px-4 py-3"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-text-primary">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Votre mot de passe"
                className="input-field w-full px-4 py-3"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-60">
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Retour à l’accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
