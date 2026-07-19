"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    <main className="app-bg grid min-h-screen place-items-center px-4 py-10">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="h-20 w-20 drop-shadow-[0_10px_30px_rgba(96,162,219,0.45)]" />
          <div className="mt-4 font-display text-2xl font-extrabold tracking-tight">
            <span className="text-ink">PROJECT</span>
            <span className="text-brand"> AR</span>
          </div>
          <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-faint">
            Um novo mundo de refrigeração
          </div>
        </div>

        <div className="rounded-3xl glass-strong p-7 shadow-card">
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
                className={input}
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
                className={input}
                placeholder="••••••••"
              />
            </Field>

            {err && (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
                {err}
              </p>
            )}
            {msg && (
              <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500">
                {msg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="t-colors w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark disabled:opacity-60"
            >
              {loading
                ? "Aguarde…"
                : mode === "login"
                ? "Entrar"
                : "Criar conta"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-ink-soft">
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setErr(null);
              }}
              className="font-medium text-brand hover:underline"
            >
              {mode === "login"
                ? "Não tem conta? Criar agora"
                : "Já tenho conta — entrar"}
            </button>
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

const input =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink t-colors";

function traduzErro(m: string) {
  if (/invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if (/already registered/i.test(m)) return "Este e-mail já está cadastrado.";
  if (/password should be at least/i.test(m))
    return "A senha precisa ter ao menos 6 caracteres.";
  return m;
}
