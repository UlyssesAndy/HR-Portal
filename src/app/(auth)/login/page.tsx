"use client";

import { useState, Suspense, useEffect } from "react";
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

type LoginMethod = "select" | "password";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const errorParam = searchParams.get("error");

  // Clear stale cookies on mount
  useEffect(() => {
    // Force clear any stale auth cookies
    const cookiesToClear = [
      "authjs.session-token",
      "__Secure-authjs.session-token",
      "authjs.csrf-token",
      "__Secure-authjs.csrf-token",
      "__Host-authjs.csrf-token",
      "authjs.callback-url",
      "__Secure-authjs.callback-url",
    ];
    
    cookiesToClear.forEach(name => {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax`;
    });
  }, []);

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

  const resetForm = () => {
    setError(null);
    setPassword("");
  };

  // Password login via NextAuth
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("Password login error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
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

          {/* Success display - removed */}

          {/* Method Selection */}
          {loginMethod === "select" && (
            <div className="space-y-3">
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
                    <div className="text-sm text-slate-400">Secure login with your credentials</div>
                  </div>
                  <div className="text-amber-400 group-hover:translate-x-1 transition-transform">→</div>
                </div>
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-900 px-4 text-xs uppercase tracking-widest text-slate-500">SSO Coming Soon</span>
                </div>
              </div>
            </div>
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
                
                {/* 2FA removed for now */}

                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Signing in...</>
                  ) : (
                    <><Lock className="h-5 w-5" /> Sign In</>
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
