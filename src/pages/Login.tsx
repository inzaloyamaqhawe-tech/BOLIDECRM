import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { PasswordInput } from "../components/PasswordInput";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await login(email, password);
    setSubmitting(false);
    if (result.ok) navigate("/");
    else setError(result.error);
  }

  return (
    <AuthShell>
      <h1 className="mb-1 text-2xl font-black text-neutral-900">Welcome back</h1>
      <p className="mb-6 text-sm text-neutral-500">Sign in to the Bolide CRM.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@bolide.co.za"
          />
        </Field>
        <Field label="Password">
          <PasswordInput required autoComplete="current-password" value={password} onChange={setPassword} />
        </Field>

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-brand disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Need an account?{" "}
        <Link to="/signup" className="font-semibold text-pink-600 hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <img src="/bolide-logo.jpg" alt="Bolide" className="mx-auto mb-8 h-10 w-auto object-contain" />
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-neutral-500">{label}</span>
      {children}
    </label>
  );
}
