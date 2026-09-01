import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "../lib/auth";
import { AuthShell, Field } from "./Login";
import { ALLOWED_EMAIL_DOMAINS } from "../types";
import { PasswordInput } from "../components/PasswordInput";

/**
 * Sign-up now requires the password twice — the earlier review flagged that
 * a typo in a single password field could lock someone out with no way to
 * tell what they'd actually typed. Confirm must match before submit is
 * even attempted, with a live match/mismatch indicator as they type.
 */
export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passwordsEntered = password.length > 0 && confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await signup(name, email, password, confirmPassword);
    setSubmitting(false);
    if (result.ok) navigate("/");
    else setError(result.error);
  }

  return (
    <AuthShell>
      <h1 className="mb-1 text-2xl font-black text-neutral-900">Create your account</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Sign-up is limited to {ALLOWED_EMAIL_DOMAINS.map((d) => `@${d}`).join(", ")}.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Jane Doe" />
        </Field>
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
          <PasswordInput required minLength={8} autoComplete="new-password" value={password} onChange={setPassword} />
        </Field>
        <Field label="Confirm password">
          <PasswordInput required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={setConfirmPassword} />
        </Field>

        {passwordsEntered && (
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${passwordsMatch ? "text-emerald-600" : "text-red-600"}`}>
            {passwordsMatch ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {passwordsMatch ? "Passwords match" : "Passwords do not match"}
          </div>
        )}

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || (passwordsEntered && !passwordsMatch)}
          className="w-full rounded-full bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-brand disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-pink-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
