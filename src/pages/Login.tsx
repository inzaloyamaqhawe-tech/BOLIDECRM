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
  const journeyTimes = [
    0, 0.03, 0.06, 0.09, 0.14, 0.17, 0.2, 0.23, 0.26, 0.31, 0.34, 0.37, 0.4,
    0.43, 0.48, 0.51, 0.54, 0.57, 0.6, 0.65, 0.68, 0.71, 0.74, 0.77, 0.82, 0.86,
    0.89, 1,
  ].join(";");
  const journeyPositions = [
    "90 416", "115 416", "140 416", "170 416", "220 368",
    "230 368", "255 368", "280 368", "305 368", "355 320",
    "365 320", "390 320", "415 320", "440 320", "490 272",
    "500 272", "525 272", "550 272", "575 272", "625 224",
    "635 224", "660 224", "685 224", "710 224", "755 176", "785 176",
    "815 176", "815 176",
  ].join(";");
  const frontLegFrames = [
    "M5-68L14-34L20 0", "M5-68L18-36L30 0", "M5-68L-5-38L-24-5", "M5-68L25-84L38-62", "M5-68L14-34L20 0",
    "M5-68L14-34L20 0", "M5-68L18-36L30 0", "M5-68L-5-38L-24-5", "M5-68L14-34L20 0", "M5-68L-8-38L-26-18",
    "M5-68L14-34L20 0", "M5-68L18-36L30 0", "M5-68L-5-38L-24-5", "M5-68L25-84L38-62", "M5-68L14-34L20 0",
    "M5-68L14-34L20 0", "M5-68L18-36L30 0", "M5-68L-5-38L-24-5", "M5-68L14-34L20 0", "M5-68L-8-38L-26-18",
    "M5-68L14-34L20 0", "M5-68L18-36L30 0", "M5-68L-5-38L-24-5", "M5-68L25-84L38-62", "M5-68L14-34L20 0", "M5-68L18-36L30 0", "M5-68L14-34L20 0", "M5-68L14-34L20 0",
  ].join(";");
  const rearLegFrames = [
    "M-4-68L-12-34L-18 0", "M-4-68L-8-38L-25-5", "M-4-68L15-36L28 0", "M-4-68L-12-34L-18 0", "M-4-68L-20-38L-34-18",
    "M-4-68L-12-34L-18 0", "M-4-68L-8-38L-25-5", "M-4-68L15-36L28 0", "M-4-68L22-84L38-62", "M-4-68L-12-34L-18 0",
    "M-4-68L-12-34L-18 0", "M-4-68L-8-38L-25-5", "M-4-68L15-36L28 0", "M-4-68L-12-34L-18 0", "M-4-68L-20-38L-34-18",
    "M-4-68L-12-34L-18 0", "M-4-68L-8-38L-25-5", "M-4-68L15-36L28 0", "M-4-68L22-84L38-62", "M-4-68L-12-34L-18 0",
    "M-4-68L-12-34L-18 0", "M-4-68L-8-38L-25-5", "M-4-68L15-36L28 0", "M-4-68L-12-34L-18 0", "M-4-68L-20-38L-34-18", "M-4-68L-8-38L-25-5", "M-4-68L-12-34L-18 0", "M-4-68L-12-34L-18 0",
  ].join(";");
  const frontArmTilts = [
    "18 8 -96", "-24 8 -96", "24 8 -96", "-30 8 -96", "18 8 -96",
    "18 8 -96", "-24 8 -96", "24 8 -96", "-30 8 -96", "18 8 -96",
    "18 8 -96", "-24 8 -96", "24 8 -96", "-30 8 -96", "18 8 -96",
    "18 8 -96", "-24 8 -96", "24 8 -96", "-30 8 -96", "18 8 -96",
    "18 8 -96", "-24 8 -96", "24 8 -96", "-30 8 -96", "18 8 -96", "-24 8 -96", "0 8 -96", "0 8 -96",
  ].join(";");
  const rearArmTilts = [
    "-18 -7 -96", "24 -7 -96", "-24 -7 -96", "30 -7 -96", "-18 -7 -96",
    "-18 -7 -96", "24 -7 -96", "-24 -7 -96", "30 -7 -96", "-18 -7 -96",
    "-18 -7 -96", "24 -7 -96", "-24 -7 -96", "30 -7 -96", "-18 -7 -96",
    "-18 -7 -96", "24 -7 -96", "-24 -7 -96", "30 -7 -96", "-18 -7 -96",
    "-18 -7 -96", "24 -7 -96", "-24 -7 -96", "30 -7 -96", "-18 -7 -96", "24 -7 -96", "0 -7 -96", "0 -7 -96",
  ].join(";");

  return (
    <svg
      viewBox="0 0 920 510"
      className="h-auto max-h-[50vh] w-full"
      role="img"
      aria-labelledby="pipeline-journey-title pipeline-journey-description"
    >
      <title id="pipeline-journey-title">A sales opportunity moving from Pipeline to Won</title>
      <desc id="pipeline-journey-description">
        A solid human figure walks and climbs through the CRM stages, then raises both arms in
        celebration at the Won stage.
      </desc>

      <defs>
        <filter id="step-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#4b1031" floodOpacity="0.18" />
        </filter>
      </defs>

      <path
        d="M65 420H205V372H340V324H475V276H610V228H745V180H884"
        fill="none"
        stroke="rgba(255,255,255,.22)"
        strokeWidth="58"
        strokeLinejoin="round"
        filter="url(#step-shadow)"
      />
      <path
        d="M65 420H205V372H340V324H475V276H610V228H745V180H884"
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinejoin="round"
        opacity=".88"
      />

      <g fill="white" fontFamily="Outfit, sans-serif" fontWeight="700" fontSize="15">
        <text x="75" y="463">PIPELINE</text>
        <text x="210" y="415">QUALIFY / KYC</text>
        <text x="345" y="367">PRELIMINARY</text>
        <text x="480" y="319">FINAL PROPOSAL</text>
        <text x="615" y="271">NEGOTIATION</text>
        <text x="760" y="223">WON</text>
      </g>

      <g className="text-neutral-950">
        <animate
          attributeName="opacity"
          values="1;1;0;0"
          keyTimes="0;.89;.92;1"
          dur="30s"
          repeatCount="indefinite"
        />
        <animateTransform
          attributeName="transform"
          type="translate"
          dur="30s"
          repeatCount="indefinite"
          calcMode="linear"
          keyTimes={journeyTimes}
          values={journeyPositions}
        />
        <g transform="scale(.78)">
          <circle cx="5" cy="-119" r="14" fill="currentColor" />
          <path d="M-10-103Q-16-92-11-72L-5-64H11L14-96Q12-105 3-106Z" fill="currentColor" />
          <path d="M8-96L16-65" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" dur="30s" repeatCount="indefinite" keyTimes={journeyTimes} values={frontArmTilts} />
          </path>
          <path d="M-7-96L-15-65" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" opacity=".78">
            <animateTransform attributeName="transform" type="rotate" dur="30s" repeatCount="indefinite" keyTimes={journeyTimes} values={rearArmTilts} />
          </path>
          <path
            d="M5-68L25-84L38-62"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate
              attributeName="d"
              dur="30s"
              repeatCount="indefinite"
              keyTimes={journeyTimes}
              values={frontLegFrames}
            />
          </path>
          <path
            d="M-4-68L-12-34L-18 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate
              attributeName="d"
              dur="30s"
              repeatCount="indefinite"
              keyTimes={journeyTimes}
              values={rearLegFrames}
            />
          </path>
        </g>
      </g>

      <g className="text-neutral-950" transform="translate(823 118) scale(.88)" opacity="0">
        <animate
          attributeName="opacity"
          values="0;0;1;1;0"
          keyTimes="0;.9;.93;.985;1"
          dur="30s"
          repeatCount="indefinite"
        />
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 8;0 8;0 0;0 -5;0 0;0 8"
            keyTimes="0;.9;.93;.95;.985;1"
            dur="30s"
            repeatCount="indefinite"
          />
          <circle cx="0" cy="-55" r="14" fill="currentColor" />
          <path d="M-15-37Q0-44 15-37L12 19H-12Z" fill="currentColor" />
          <path d="M-11-31L-31-53L-43-75" fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11-31L31-53L43-75" fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-7 14L-13 51" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
          <path d="M7 14L13 51" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
          <g fill="currentColor">
            <circle cx="-57" cy="-74" r="6" />
            <circle cx="57" cy="-72" r="6" />
            <circle cx="-49" cy="-103" r="5" />
            <circle cx="50" cy="-102" r="5" />
            <rect x="-7" y="-105" width="14" height="14" rx="2" transform="rotate(12 0 -98)" />
            <rect x="-37" y="-96" width="11" height="11" rx="2" transform="rotate(38 -31 -90)" />
            <rect x="27" y="-94" width="11" height="11" rx="2" transform="rotate(-34 32 -89)" />
            <rect x="-68" y="-48" width="8" height="19" rx="4" transform="rotate(-58 -64 -38)" />
            <rect x="60" y="-48" width="8" height="19" rx="4" transform="rotate(58 64 -38)" />
            <rect x="-66" y="-91" width="8" height="18" rx="4" transform="rotate(54 -62 -82)" />
            <rect x="58" y="-90" width="8" height="18" rx="4" transform="rotate(-54 62 -81)" />
            <rect x="-25" y="-119" width="8" height="18" rx="4" transform="rotate(-20 -21 -110)" />
            <rect x="18" y="-120" width="8" height="18" rx="4" transform="rotate(20 22 -111)" />
          </g>
        </g>
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
