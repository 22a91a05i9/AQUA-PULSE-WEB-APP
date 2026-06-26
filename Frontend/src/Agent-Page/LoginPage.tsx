import { useState } from 'react';
import { Apple, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import FishAnimationCanvas from '../components/FishAnimationCanvas';
import { ApiError } from '../lib/api';
import { login, type AuthSession } from '../lib/auth';

interface LoginPageProps {
  onLogin: (session: AuthSession) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
      className="flex min-h-screen w-screen items-center justify-center overflow-hidden bg-[#020814] p-2 sm:p-3"
    >
      <section
        className="relative aspect-[16/10] w-[min(1800px,calc(100vw-6px),calc((100vh-6px)*1.6))] overflow-hidden rounded-[18px] bg-[#031124] bg-cover bg-center bg-no-repeat shadow-[0_28px_90px_rgba(0,0,0,0.58)] sm:w-[min(1800px,calc(100vw-10px),calc((100vh-10px)*1.6))]"
        style={{ backgroundImage: "url('/images/aqua-login-panel-background.png')" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,8,20,0.02),rgba(1,8,20,0.01)_52%,rgba(1,8,20,0.08))]" />
        <FishAnimationCanvas />

        <form
          onSubmit={handleSubmit}
          className="absolute bottom-[5.5%] right-[6%] top-[8.5%] z-[3] flex w-[44%] animate-slide-in-right flex-col rounded-[16px] border border-slate-300/30 bg-[#06162b]/66 px-[3.9%] py-[3.9%] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur-md"
          aria-label="Aqua Pulse login form"
        >
          <div className="mb-[clamp(10px,2vw,22px)] text-center">
            <h1 className="text-[clamp(18px,2vw,28px)] font-extrabold leading-tight tracking-normal text-white">
              Welcome Back!
            </h1>
            <p className="mt-[clamp(4px,0.8vw,10px)] text-[clamp(11px,1vw,15px)] text-slate-300">Sign in to your account</p>
          </div>

          <label htmlFor="email" className="mb-[clamp(3px,0.4vw,8px)] text-[clamp(11px,0.9vw,14px)] font-semibold text-white">
            Email
          </label>
          <div className="group relative">
            <Mail className="pointer-events-none absolute left-[4.2%] top-1/2 h-[clamp(14px,1.3vw,20px)] w-[clamp(14px,1.3vw,20px)] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-300" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[clamp(34px,4.1vw,52px)] w-full rounded-lg border border-slate-400/25 bg-[#041326]/62 pl-[12%] pr-4 text-[clamp(12px,1.1vw,16px)] font-medium text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-[#061a31]/80 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="password" className="mb-[clamp(3px,0.4vw,8px)] mt-[clamp(10px,1.4vw,20px)] text-[clamp(11px,0.9vw,14px)] font-semibold text-white">
            Password
          </label>
          <div className="group relative">
            <LockKeyhole className="pointer-events-none absolute left-[4.2%] top-1/2 h-[clamp(14px,1.3vw,20px)] w-[clamp(14px,1.3vw,20px)] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-300" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[clamp(34px,4.1vw,52px)] w-full rounded-lg border border-slate-400/25 bg-[#041326]/62 pl-[12%] pr-[12%] text-[clamp(12px,1.1vw,16px)] font-medium text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-[#061a31]/80 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
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

          <div className="mt-[clamp(10px,1.4vw,20px)] flex items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-[clamp(11px,0.9vw,14px)] font-medium text-white">
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
              className="whitespace-nowrap text-[clamp(11px,0.9vw,14px)] font-semibold text-cyan-300 transition hover:text-cyan-100"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="relative mt-[clamp(12px,1.8vw,24px)] flex h-[clamp(38px,4.5vw,56px)] w-full items-center justify-center rounded-lg bg-gradient-to-r from-cyan-300 via-sky-500 to-blue-700 text-[clamp(13px,1.25vw,18px)] font-extrabold text-white shadow-[0_12px_30px_rgba(14,165,233,0.22)] transition hover:scale-[1.01] hover:shadow-[0_16px_40px_rgba(14,165,233,0.35)] focus:outline-none focus:ring-2 focus:ring-cyan-200/80 disabled:cursor-wait disabled:opacity-80"
          >
            <span>{isLoading ? 'Logging in...' : 'Login'}</span>
            <ArrowRight className="absolute right-[5.5%] h-[48%] w-auto" />
          </button>

          <div className="my-[clamp(12px,1.8vw,26px)] flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-500/35" />
            <span className="text-[clamp(10px,0.8vw,13px)] font-medium text-slate-300">or continue with</span>
            <span className="h-px flex-1 bg-slate-500/35" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMessage('Google sign-in is ready to connect.')}
              disabled={isLoading}
              className="flex h-[clamp(34px,4.1vw,52px)] items-center justify-center gap-2.5 rounded-lg border border-slate-300/40 bg-[#061d3a]/80 text-[clamp(11px,0.95vw,14px)] font-bold text-white transition hover:border-cyan-300/80 hover:bg-cyan-300/15 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] focus:outline-none focus:ring-2 focus:ring-cyan-300/60 disabled:cursor-wait disabled:opacity-80"
            >
              <svg className="h-[48%] w-auto" viewBox="0 0 24 24" fill="none">
                <path fill="#EA4335" d="M12 5.04c1.67 0 3.2.58 4.39 1.71l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.68 1.43 7.62l3.85 2.99C6.2 7.61 8.87 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.02 3.67-8.64z" />
                <path fill="#FBBC05" d="M5.28 14.63c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.43 7.02C.52 8.89 0 10.98 0 13.17s.52 4.28 1.43 6.15l3.85-2.99z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.11.75-2.52 1.19-4.2 1.19-3.13 0-5.8-2.57-6.72-5.57L1.43 16.3C3.37 20.22 7.35 23 12 23z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => setMessage('Apple sign-in is ready to connect.')}
              disabled={isLoading}
              className="flex h-[clamp(34px,4.1vw,52px)] items-center justify-center gap-2.5 rounded-lg border border-slate-300/40 bg-[#061d3a]/80 text-[clamp(11px,0.95vw,14px)] font-bold text-white transition hover:border-cyan-300/80 hover:bg-cyan-300/15 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] focus:outline-none focus:ring-2 focus:ring-cyan-300/60 disabled:cursor-wait disabled:opacity-80"
            >
              <Apple className="h-[48%] w-auto text-white" fill="white" />
              Apple
            </button>
          </div>

          <div className="mt-[clamp(12px,2vw,24px)] text-center text-[clamp(11px,0.95vw,14px)] font-medium text-slate-350">
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
