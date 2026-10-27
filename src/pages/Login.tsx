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
    <AuthShell showJourney>
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-pink-600">
          Bolide CRM
        </p>
        <h1 className="text-3xl font-black tracking-tight text-neutral-950">Welcome back</h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
          Sign in to manage opportunities, next actions and every step towards a signed deal.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Work email">
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

      <p className="mt-7 text-center text-sm text-neutral-500">
        Need an account?{" "}
        <Link to="/signup" className="font-semibold text-pink-600 hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({
  children,
  showJourney = false,
}: {
  children: React.ReactNode;
  showJourney?: boolean;
}) {
  if (!showJourney) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
        <div className="w-full max-w-sm">
          <img
            src={`${import.meta.env.BASE_URL}bolide-logo.png`}
            alt="Bolide"
            className="mx-auto mb-8 h-14 w-auto object-contain"
          />
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(480px,1fr)_minmax(600px,1fr)]">
      <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-md">
          <img
            src={`${import.meta.env.BASE_URL}bolide-logo.png`}
            alt="Bolide"
            className="mb-14 h-16 w-auto object-contain object-left"
          />
          {children}
          <p className="mt-10 text-xs leading-5 text-neutral-400">
            Secure internal access for authorised Bolide team members.
          </p>
        </div>
      </section>

      <section className="relative hidden min-h-screen overflow-hidden bg-brand-gradient text-white lg:flex lg:flex-col">
        <div aria-hidden="true" className="absolute -left-24 top-1/3 h-72 w-72 rounded-full border border-white/10" />
        <div aria-hidden="true" className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5" />
        <div className="relative flex min-h-0 flex-1 items-center px-10 pb-2 pt-8 xl:px-16">
          <PipelineJourney />
        </div>
        <div className="relative px-12 pb-12 xl:px-20 xl:pb-16">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.32em] text-white/70">
            From pipeline to won
          </p>
          <h2 className="max-w-xl text-4xl font-black leading-[1.08] tracking-tight xl:text-5xl">
            Every opportunity has a clear next step.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/80">
            Keep ownership visible, follow up on time and move each solution towards a signed final
            proposal—together.
          </p>
          <div className="mt-8 h-px w-16 bg-white/60" />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.32em] text-white/80">
            Bridging the divide
          </p>
        </div>
      </section>
    </main>
  );
}

function PipelineJourney() {
  return (
    <svg
      viewBox="0 0 920 510"
      className="h-auto max-h-[50vh] w-full"
      role="img"
      aria-labelledby="pipeline-journey-title pipeline-journey-description"
    >
      <title id="pipeline-journey-title">A sales opportunity moving from Pipeline to Won</title>
      <desc id="pipeline-journey-description">
        Solid human figures climb a staircase through the CRM stages and celebrate with a trophy at
        the Won stage.
      </desc>

      <defs>
        <filter id="step-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#4b1031" floodOpacity="0.18" />
        </filter>
      </defs>

      <path
        d="M65 430H205V367H345V304H485V241H625V178H765V115H884"
        fill="none"
        stroke="rgba(255,255,255,.22)"
        strokeWidth="84"
        strokeLinejoin="round"
        filter="url(#step-shadow)"
      />
      <path
        d="M65 430H205V367H345V304H485V241H625V178H765V115H884"
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinejoin="round"
        opacity=".88"
      />

      <g fill="white" fontFamily="Outfit, sans-serif" fontWeight="700" fontSize="15">
        <text x="75" y="480">PIPELINE</text>
        <text x="210" y="417">QUALIFY / KYC</text>
        <text x="355" y="354">PRELIMINARY</text>
        <text x="497" y="291">FINAL PROPOSAL</text>
        <text x="640" y="228">NEGOTIATION</text>
        <text x="795" y="165">WON</text>
      </g>

      <g className="text-neutral-950">
        <animate
          attributeName="opacity"
          values="1;1;0;0"
          keyTimes="0;.78;.82;1"
          dur="20s"
          repeatCount="indefinite"
        />
        <animateTransform
          attributeName="transform"
          type="translate"
          dur="20s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines=".4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1"
          keyTimes="0;.08;.14;.16;.24;.30;.32;.40;.46;.48;.56;.62;.64;.72;.78;1"
          values="165 426;215 363;255 363;305 363;355 300;395 300;445 300;495 237;535 237;585 237;635 174;675 174;725 174;775 111;805 111;805 111"
        />
        <g transform="scale(.78)">
          <circle cx="5" cy="-77" r="14" fill="currentColor" />
          <path d="M-10-61Q-16-50-11-30L-5-22H11L14-54Q12-63 3-64Z" fill="currentColor" />
          <path d="M8-54L20-37L34-43" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-7-54L-18-36L-21-19" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity=".88" />
          <path
            d="M5-28L19-52L36-63"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate
              attributeName="d"
              dur="20s"
              repeatCount="indefinite"
              keyTimes="0;.08;.14;.16;.24;.30;.32;.40;.46;.48;.56;.62;.64;.72;.78;1"
              values="M5-28L19-52L36-63;M5-28L15-13L20 0;M5-28L15-13L20 0;M5-28L15-13L20 0;M5-28L17 18L31 63;M5-28L15-13L20 0;M5-28L19-52L36-63;M5-28L15-13L20 0;M5-28L15-13L20 0;M5-28L15-13L20 0;M5-28L17 18L31 63;M5-28L15-13L20 0;M5-28L19-52L36-63;M5-28L15-13L20 0;M5-28L15-13L20 0;M5-28L15-13L20 0"
            />
          </path>
          <path
            d="M-4-28L-12-12L-18 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate
              attributeName="d"
              dur="20s"
              repeatCount="indefinite"
              keyTimes="0;.08;.14;.16;.24;.30;.32;.40;.46;.48;.56;.62;.64;.72;.78;1"
              values="M-4-28L-12-12L-18 0;M-4-28L-16 18L-31 63;M-4-28L-12-12L-18 0;M-4-28L-20-52L-37-63;M-4-28L-12-12L-18 0;M-4-28L-12-12L-18 0;M-4-28L-12-12L-18 0;M-4-28L-16 18L-31 63;M-4-28L-12-12L-18 0;M-4-28L-20-52L-37-63;M-4-28L-12-12L-18 0;M-4-28L-12-12L-18 0;M-4-28L-12-12L-18 0;M-4-28L-16 18L-31 63;M-4-28L-12-12L-18 0;M-4-28L-12-12L-18 0"
            />
          </path>
        </g>
      </g>

      <g className="text-white" transform="translate(823 55) scale(.88)" opacity="0">
        <animate
          attributeName="opacity"
          values="0;0;1;1;0"
          keyTimes="0;.78;.82;.985;1"
          dur="20s"
          repeatCount="indefinite"
        />
        <circle cx="0" cy="-44" r="15" fill="currentColor" />
        <rect x="-18" y="-25" width="36" height="58" rx="14" fill="currentColor" />
        <rect x="-41" y="-36" width="10" height="54" rx="5" fill="currentColor" transform="rotate(-38 -36 -9)" />
        <rect x="31" y="-36" width="10" height="54" rx="5" fill="currentColor" transform="rotate(38 36 -9)" />
        <rect x="-16" y="24" width="12" height="47" rx="6" fill="currentColor" />
        <rect x="4" y="24" width="12" height="47" rx="6" fill="currentColor" />
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 34;0 34;0 0;0 -8;0 -8;0 34"
            keyTimes="0;.78;.86;.91;.985;1"
            dur="20s"
            repeatCount="indefinite"
          />
          <g transform="translate(0 -76)">
            <path d="M-18 0h36v16c0 16-8 27-18 27S-18 32-18 16V0Z" fill="#171717" />
            <path d="M-18 7h-12c0 13 6 20 17 20M18 7h12c0 13-6 20-17 20" fill="none" stroke="#171717" strokeWidth="6" strokeLinecap="round" />
            <rect x="-4" y="40" width="8" height="14" rx="2" fill="#171717" />
            <rect x="-15" y="52" width="30" height="7" rx="3.5" fill="#171717" />
          </g>
        </g>
      </g>

      <g fill="white" opacity=".68">
        <circle cx="739" cy="64" r="4" />
        <circle cx="775" cy="34" r="5" />
        <circle cx="872" cy="42" r="4" />
        <path d="M718 93l8 2-6 6-2 8-6-6-8-2 6-6 2-8 6 6Z" />
        <path d="M882 88l6 2-4 5-2 6-5-5-6-2 5-4 2-7 4 5Z" />
      </g>
    </svg>
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
