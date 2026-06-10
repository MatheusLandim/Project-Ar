"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setErr(traduzErro(error.message));
      else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setErr(traduzErro(error.message));
      else if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setMsg(
          "Conta criada. Verifique seu e-mail para confirmar e depois faça login."
        );
        setMode("login");
      }
    }
    setLoading(false);
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-line bg-surface p-7 shadow-card">
          <h1 className="font-display text-xl font-bold text-ink">
            {mode === "login" ? "Entrar na sua conta" : "Criar conta"}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {mode === "login"
              ? "Acesse o controle financeiro da Project Ar."
              : "Cadastre seu acesso para começar."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="E-mail">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
                placeholder="voce@projectar.com.br"
              />
            </Field>
            <Field label="Senha">
              <input
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm"
                placeholder="••••••••"
              />
            </Field>

            {err && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {err}
              </p>
            )}
            {msg && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {msg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {loading
                ? "Aguarde…"
                : mode === "login"
                ? "Entrar"
                : "Criar conta"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-ink-soft">
            {mode === "login" ? (
              <button
                onClick={() => {
                  setMode("signup");
                  setErr(null);
                }}
                className="font-medium text-brand hover:underline"
              >
                Não tem conta? Criar agora
              </button>
            ) : (
              <button
                onClick={() => {
                  setMode("login");
                  setErr(null);
                }}
                className="font-medium text-brand hover:underline"
              >
                Já tenho conta — entrar
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

function traduzErro(m: string) {
  if (/invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if (/already registered/i.test(m)) return "Este e-mail já está cadastrado.";
  if (/password should be at least/i.test(m))
    return "A senha precisa ter ao menos 6 caracteres.";
  return m;
}
