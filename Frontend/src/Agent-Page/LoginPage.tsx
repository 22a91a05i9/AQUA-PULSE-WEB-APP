import { useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { ApiError } from '../lib/api';
import { login, type AuthSession } from '../lib/auth';

interface LoginPageProps {
  onLogin: (session: AuthSession) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const session = await login({ email, password });
      onLogin(session);
    } catch (error) {
      const fallbackMessage = 'Login failed. Please check your details or backend connection.';
      setMessage(error instanceof ApiError || error instanceof Error ? error.message : fallbackMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="flex min-h-dvh w-screen items-center justify-center overflow-x-hidden overflow-y-auto bg-[#020814] p-3 md:min-h-screen"
    >
      <section
        className="relative min-h-[calc(100dvh-1.5rem)] w-full max-w-[27rem] overflow-hidden rounded-[18px] bg-black shadow-[0_28px_90px_rgba(0,0,0,0.58)] md:aspect-[16/10] md:min-h-0 md:max-w-none md:w-[min(1800px,calc(100vw-10px),calc((100vh-10px)*1.6))]"
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src="/videos/login-underwater.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,8,20,0.2),rgba(1,8,20,0.08)_45%,rgba(1,8,20,0.44)),radial-gradient(circle_at_72%_45%,rgba(6,182,212,0.16),transparent_32%)]" />

        <form
          onSubmit={handleSubmit}
          className="login-form absolute inset-x-5 top-1/2 z-[3] flex max-h-[calc(100dvh-4rem)] min-w-0 -translate-y-1/2 flex-col overflow-y-auto rounded-[15px] border border-slate-300/25 bg-[#06162b]/76 px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md md:bottom-auto md:left-auto md:right-[clamp(20px,7%,76px)] md:top-1/2 md:max-h-[calc(100%-40px)] md:w-[min(39%,25rem)] md:min-w-[18rem] md:animate-slide-in-right md:bg-[#06162b]/64 md:px-[clamp(18px,2.5%,38px)] md:py-[clamp(18px,2.35%,36px)]"
          aria-label="Aqua Pulse login form"
        >
          <div className="mb-[clamp(9px,1.2vw,18px)] shrink-0 text-center">
            <h1 className="text-[clamp(18px,1.8vw,27px)] font-extrabold leading-tight tracking-normal text-white">
              Welcome Back!
            </h1>
            <p className="mt-[clamp(4px,0.7vw,10px)] text-[clamp(11px,0.95vw,14px)] text-slate-300">Sign in to your account</p>
          </div>

          <label htmlFor="email" className="mb-[clamp(3px,0.4vw,8px)] text-[clamp(11px,0.9vw,14px)] font-semibold text-white">
            Email
          </label>
          <div className="group relative shrink-0">
            <Mail className="pointer-events-none absolute left-[4.2%] top-1/2 h-[clamp(14px,1.3vw,20px)] w-[clamp(14px,1.3vw,20px)] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-300" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input h-[clamp(36px,3.65vw,50px)] w-full rounded-lg border border-slate-400/25 bg-[#041326]/62 pl-[12%] pr-4 text-[clamp(12px,1vw,15px)] font-medium text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-[#061a31]/80 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="password" className="mb-[clamp(3px,0.4vw,8px)] mt-[clamp(8px,1vw,16px)] text-[clamp(11px,0.9vw,14px)] font-semibold text-white">
            Password
          </label>
          <div className="group relative shrink-0">
            <LockKeyhole className="pointer-events-none absolute left-[4.2%] top-1/2 h-[clamp(14px,1.3vw,20px)] w-[clamp(14px,1.3vw,20px)] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-300" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input h-[clamp(36px,3.65vw,50px)] w-full rounded-lg border border-slate-400/25 bg-[#041326]/62 pl-[12%] pr-[12%] text-[clamp(12px,1vw,15px)] font-medium text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-[#061a31]/80 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-[2.4%] top-1/2 flex h-[clamp(24px,2.6vw,34px)] w-[clamp(24px,2.6vw,34px)] -translate-y-1/2 items-center justify-center rounded-md text-slate-300 transition hover:bg-cyan-300/10 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-[58%] w-[58%]" /> : <Eye className="h-[58%] w-[58%]" />}
            </button>
          </div>

          <div className="mt-[clamp(10px,1.2vw,16px)] flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <label className="flex min-w-0 cursor-pointer items-center gap-2 text-[clamp(11px,0.9vw,14px)] font-medium leading-tight text-white">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              <span
                className={`flex h-[clamp(14px,1.3vw,20px)] w-[clamp(14px,1.3vw,20px)] shrink-0 items-center justify-center rounded-[4px] border transition ${
                  rememberMe
                    ? 'border-blue-400 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                    : 'border-slate-500 bg-[#041326]/80'
                }`}
              >
                {rememberMe && <Check className="h-[78%] w-[78%] text-white" strokeWidth={3} />}
              </span>
              Remember me
            </label>
            <button
              type="button"
              onClick={() => setMessage('Password reset link is ready to send.')}
              className="max-w-full whitespace-nowrap text-[clamp(11px,0.9vw,14px)] font-semibold text-cyan-300 transition hover:text-cyan-100"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="relative mt-[clamp(11px,1.35vw,18px)] flex h-[clamp(40px,3.9vw,52px)] w-full shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-300 via-sky-500 to-blue-700 text-[clamp(13px,1.12vw,16px)] font-extrabold text-white shadow-[0_12px_30px_rgba(14,165,233,0.22)] transition hover:scale-[1.01] hover:shadow-[0_16px_40px_rgba(14,165,233,0.35)] focus:outline-none focus:ring-2 focus:ring-cyan-200/80 disabled:cursor-wait disabled:opacity-80"
          >
            <span>{isLoading ? 'Logging in...' : 'Login'}</span>
            <ArrowRight className="absolute right-[5.5%] h-[48%] w-auto" />
          </button>

          <div className="mt-[clamp(10px,1.5vw,20px)] shrink-0 text-center text-[clamp(11px,0.95vw,14px)] font-medium text-slate-350">
            Don't have an account?{' '}
            <span
              onClick={() => setMessage('Registration flow is ready to connect.')}
              className="font-semibold text-[#22d3ee] hover:text-cyan-100 hover:underline cursor-pointer"
            >
              Sign Up
            </span>
          </div>

          {message && (
            <p className="mt-4 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-center text-sm font-medium text-cyan-100">
              {message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
