"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Loader2, Lock, Wand2, KeyRound, ArrowLeft, CheckCircle2, Chrome } from "lucide-react";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";

type LoginMethod = "select" | "email" | "password" | "magic-link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
    const [googleLoading, setGoogleLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const errorParam = searchParams.get("error");

  const getErrorMessage = (param: string) => {
    switch (param) {
      case "AccessDenied":
        return "Access denied. Your email domain is not allowed.";
      case "invalid_token":
        return "Invalid or expired magic link. Please request a new one.";
      case "link_expired":
        return "This magic link has expired. Please request a new one.";
      default:
        return "An error occurred during sign in.";
    }
  };

  // Direct email login (existing)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(),
          password,
          totpCode: totpCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requires2FA) {
          setRequires2FA(true);
          setError(null);
          return;
        }
        setError(data.error || "Login failed");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error("Password login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Magic link request
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send magic link");
        return;
      }

      setSuccess("Check your email! A magic link has been sent.");
    } catch (err) {
      console.error("Magic link error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setError(null);
    setSuccess(null);
    setPassword("");
    setTotpCode("");
    setRequires2FA(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background - Algonova premium style */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/40 via-transparent to-cyan-900/40" />
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-purple-600/30 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-cyan-600/30 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-radial from-pink-500/20 to-transparent rounded-full blur-3xl" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <Card className="w-full max-w-md relative z-10 border border-white/10 bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-purple-500/10 rounded-3xl overflow-hidden">
        {/* Glow effect on card */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5" />
        
        <CardHeader className="space-y-6 text-center pt-10 pb-2 relative">
          <div className="mx-auto">
            <img 
              src="/logo.png" 
              alt="Company Logo" 
              className="h-16 w-auto mx-auto object-contain drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]"
            />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
              HR Portal
            </CardTitle>
            <CardDescription className="text-slate-400 mt-3 text-base">
              {loginMethod === "select" 
                ? "Choose how you want to sign in"
                : "Sign in to access the employee directory"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pb-10 px-8 relative">
          {/* Error display */}
          {(error || errorParam) && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm backdrop-blur-sm">
              {error || getErrorMessage(errorParam!)}
            </div>
          )}

          {/* Success display */}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-400 text-sm flex items-center gap-2 backdrop-blur-sm">
              <CheckCircle2 className="h-5 w-5" />
              {success}
            </div>
          )}

          {/* Method Selection */}
          {loginMethod === "select" && (
            <div className="space-y-3">
              <button
                className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-[1px] transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                onClick={() => { setLoginMethod("email"); resetForm(); }}
              >
                <div className="flex items-center gap-4 rounded-2xl bg-slate-900/90 px-5 py-4 transition-all group-hover:bg-slate-900/70">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/30">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">Quick Email Login</div>
                    <div className="text-sm text-slate-400">No password required (test mode)</div>
                  </div>
                  <div className="text-purple-400 group-hover:translate-x-1 transition-transform">→</div>
                </div>
              </button>

              <button
                className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-[1px] transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                onClick={() => { setLoginMethod("password"); resetForm(); }}
              >
                <div className="flex items-center gap-4 rounded-2xl bg-slate-900/90 px-5 py-4 transition-all group-hover:bg-slate-900/70">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">Password Login</div>
                    <div className="text-sm text-slate-400">Use your email and password</div>
                  </div>
                  <div className="text-amber-400 group-hover:translate-x-1 transition-transform">→</div>
                </div>
              </button>

              <button
                className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 p-[1px] transition-all duration-300 hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]"
                onClick={() => { setLoginMethod("magic-link"); resetForm(); }}
              >
                <div className="flex items-center gap-4 rounded-2xl bg-slate-900/90 px-5 py-4 transition-all group-hover:bg-slate-900/70">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/30">
                    <Wand2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">Magic Link</div>
                    <div className="text-sm text-slate-400">Get a sign-in link via email</div>
                  </div>
                  <div className="text-pink-400 group-hover:translate-x-1 transition-transform">→</div>
                </div>
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-900 px-4 text-xs uppercase tracking-widest text-slate-500">Enterprise SSO</span>
                </div>
              </div>

              <button
                className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 p-[1px] transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
                onClick={async () => {
                  setGoogleLoading(true);
                  setError(null);
                  try {
                    await signIn('google', { callbackUrl });
                  } catch (err) {
                    setError('Failed to start Google sign-in');
                    setGoogleLoading(false);
                  }
                }}
                disabled={googleLoading}
              >
                <div className="flex items-center gap-4 rounded-2xl bg-slate-900/90 px-5 py-4 transition-all group-hover:bg-slate-900/70">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg shadow-blue-500/30">
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">Google Workspace</div>
                    <div className="text-sm text-slate-400">Sign in with corporate account</div>
                  </div>
                  {googleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                  ) : (
                    <div className="text-blue-400 group-hover:translate-x-1 transition-transform">→</div>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* Email Login Form */}
          {loginMethod === "email" && (
            <>
              <button
                onClick={() => { setLoginMethod("select"); resetForm(); }}
                className="flex items-center text-sm text-slate-400 hover:text-purple-400 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to options
              </button>
              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-300">
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@test.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl h-12"
                  />
                  <p className="text-xs text-slate-500">
                    Test: admin@test.com (admin) or user@test.com (user)
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Signing in...</>
                  ) : (
                    <><Mail className="h-5 w-5" /> Quick Sign In</>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Password Login Form */}
          {loginMethod === "password" && (
            <>
              <button
                onClick={() => { setLoginMethod("select"); resetForm(); }}
                className="flex items-center text-sm text-slate-400 hover:text-amber-400 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to options
              </button>
              <form onSubmit={handlePasswordLogin} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email-pw" className="text-sm font-medium text-slate-300">
                    Email address
                  </label>
                  <Input
                    id="email-pw"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 rounded-xl h-12"
                  />
                </div>
                
                {requires2FA && (
                  <div className="space-y-2">
                    <label htmlFor="totp" className="text-sm font-medium text-slate-300">
                      <KeyRound className="inline h-4 w-4 mr-1" />
                      Two-Factor Code
                    </label>
                    <Input
                      id="totp"
                      type="text"
                      placeholder="123456"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      required
                      disabled={isLoading}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500 rounded-xl h-12 text-center tracking-widest text-xl font-mono"
                    />
                    <p className="text-xs text-slate-500">Enter the 6-digit code from your authenticator app</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email || !password || (requires2FA && totpCode.length !== 6)}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Signing in...</>
                  ) : (
                    <><Lock className="h-5 w-5" /> Sign In with Password</>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setLoginMethod("magic-link"); resetForm(); }}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Forgot password? Use Magic Link
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Magic Link Form */}
          {loginMethod === "magic-link" && (
            <>
              <button
                onClick={() => { setLoginMethod("select"); resetForm(); }}
                className="flex items-center text-sm text-slate-400 hover:text-pink-400 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to options
              </button>
              <form onSubmit={handleMagicLink} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="email-magic" className="text-sm font-medium text-slate-300">
                    Email address
                  </label>
                  <Input
                    id="email-magic"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || !!success}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-pink-500/20 rounded-xl h-12"
                  />
                  <p className="text-xs text-slate-500">
                    We&apos;ll send you a secure link to sign in instantly
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !email || !!success}
                  className={cn(
                    "w-full h-12 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                    success
                      ? "bg-emerald-500 shadow-emerald-500/30 text-white"
                      : "bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/30 hover:shadow-pink-500/50 text-white"
                  )}
                >
                  {isLoading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Sending...</>
                  ) : success ? (
                    <><CheckCircle2 className="h-5 w-5" /> Link Sent!</>
                  ) : (
                    <><Wand2 className="h-5 w-5" /> Send Magic Link</>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="text-center text-xs text-slate-500 pt-4">
            <p>Corporate accounts or invited emails only</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
