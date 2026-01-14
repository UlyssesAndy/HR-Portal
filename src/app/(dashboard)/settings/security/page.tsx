"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  Smartphone,
  Monitor,
  Laptop,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import Image from "next/image";

interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string | null;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

interface SecurityStatus {
  hasPassword: boolean;
  passwordSetAt: string | null;
  has2FA: boolean;
}

export default function SecuritySettingsPage() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Password form
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // 2FA setup
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [twoFALoading, setTwoFALoading] = useState(false);

  const fetchSecurityStatus = useCallback(async () => {
    try {
      const [statusRes, sessionsRes] = await Promise.all([
        fetch("/api/auth/password"),
        fetch("/api/auth/sessions"),
      ]);
      
      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatus(data);
      }
      
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch security status:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityStatus();
  }, [fetchSecurityStatus]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setPasswordLoading(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: newPassword,
          currentPassword: status?.hasPassword ? currentPassword : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to set password");
        if (data.details) {
          data.details.forEach((err: string) => toast.error(err));
        }
        return;
      }
      
      toast.success("Password updated successfully!");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      fetchSecurityStatus();
    } catch (error) {
      console.error("Password error:", error);
      toast.error("Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const start2FASetup = async () => {
    setTwoFALoading(true);
    try {
      const response = await fetch("/api/auth/2fa");
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to start 2FA setup");
        return;
      }
      
      setQrCode(data.qrCode);
      setTotpSecret(data.secret);
      setShow2FASetup(true);
    } catch (error) {
      console.error("2FA setup error:", error);
      toast.error("Failed to start 2FA setup");
    } finally {
      setTwoFALoading(false);
    }
  };

  const verify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFALoading(true);
    
    try {
      const response = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Invalid verification code");
        return;
      }
      
      setBackupCodes(data.backupCodes);
      toast.success("2FA enabled successfully!");
      fetchSecurityStatus();
    } catch (error) {
      console.error("2FA verification error:", error);
      toast.error("Failed to verify 2FA");
    } finally {
      setTwoFALoading(false);
    }
  };

  const disable2FA = async () => {
    const code = prompt("Enter your 2FA code to disable:");
    if (!code) return;
    
    setTwoFALoading(true);
    try {
      const response = await fetch("/api/auth/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to disable 2FA");
        return;
      }
      
      toast.success("2FA disabled");
      setShow2FASetup(false);
      setQrCode(null);
      setTotpSecret(null);
      setBackupCodes(null);
      setVerificationCode("");
      fetchSecurityStatus();
    } catch (error) {
      console.error("2FA disable error:", error);
      toast.error("Failed to disable 2FA");
    } finally {
      setTwoFALoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const response = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to revoke session");
        return;
      }
      
      toast.success("Session revoked");
      fetchSecurityStatus();
    } catch (error) {
      console.error("Session revoke error:", error);
      toast.error("Failed to revoke session");
    }
  };

  const revokeAllSessions = async () => {
    if (!confirm("Are you sure you want to sign out of all other devices?")) return;
    
    try {
      const response = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeAll: true }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to revoke sessions");
        return;
      }
      
      toast.success("All other sessions revoked");
      fetchSecurityStatus();
    } catch (error) {
      console.error("Revoke all error:", error);
      toast.error("Failed to revoke sessions");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getDeviceIcon = (deviceInfo: string) => {
    if (deviceInfo.includes("iPhone") || deviceInfo.includes("Android")) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (deviceInfo.includes("Mac") || deviceInfo.includes("Windows")) {
      return <Laptop className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <Shield className="h-6 w-6 text-white" />
          </div>
          Security Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Manage your account security, password, and active sessions
        </p>
      </div>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-amber-500" />
              <div>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  {status?.hasPassword 
                    ? `Last changed ${new Date(status.passwordSetAt!).toLocaleDateString()}`
                    : "No password set - using email-only login"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status?.hasPassword ? (
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Set
                </Badge>
              ) : (
                <Badge variant="warning">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Not Set
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                {status?.hasPassword ? "Change" : "Set Password"}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showPasswordForm && (
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-4 max-w-md">
              {status?.hasPassword && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <div className="relative">
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Min 8 chars, uppercase, lowercase, number, special character
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {status?.hasPassword ? "Update Password" : "Set Password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* 2FA Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-purple-500" />
              <div>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security with authenticator app
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status?.has2FA ? (
                <>
                  <Badge variant="success">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                  <Button variant="destructive" size="sm" onClick={disable2FA} disabled={twoFALoading}>
                    Disable
                  </Button>
                </>
              ) : (
                <>
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Disabled
                  </Badge>
                  <Button size="sm" onClick={start2FASetup} disabled={twoFALoading}>
                    {twoFALoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enable 2FA
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        {show2FASetup && !status?.has2FA && (
          <CardContent className="space-y-6">
            {backupCodes ? (
              /* Backup codes display */
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Save Your Backup Codes
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Store these codes in a safe place. You can use them to sign in if you lose access to your authenticator app.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-center">
                      {code}
                    </div>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(backupCodes.join("\n"))}
                  className="w-full"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All Codes
                </Button>
                
                <Button
                  onClick={() => {
                    setShow2FASetup(false);
                    setBackupCodes(null);
                    setQrCode(null);
                    setTotpSecret(null);
                    setVerificationCode("");
                  }}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              /* QR code and verification */
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  
                  {qrCode && (
                    <div className="bg-white p-4 rounded-lg">
                      <Image
                        src={qrCode}
                        alt="2FA QR Code"
                        width={200}
                        height={200}
                      />
                    </div>
                  )}
                  
                  {totpSecret && (
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-1">Or enter this code manually:</p>
                      <button
                        onClick={() => copyToClipboard(totpSecret)}
                        className="font-mono text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        {totpSecret}
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                
                <form onSubmit={verify2FA} className="space-y-4 max-w-xs mx-auto">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-center block">
                      Enter the 6-digit code from your app
                    </label>
                    <Input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={verificationCode.length !== 6 || twoFALoading}
                    >
                      {twoFALoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify & Enable
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShow2FASetup(false);
                        setQrCode(null);
                        setTotpSecret(null);
                        setVerificationCode("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-blue-500" />
              <div>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Devices where you're currently signed in
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchSecurityStatus}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              {sessions.length > 1 && (
                <Button variant="destructive" size="sm" onClick={revokeAllSessions}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out All Others
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No active sessions found
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    session.isCurrent 
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" 
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-600 dark:text-slate-400">
                      {getDeviceIcon(session.deviceInfo)}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {session.deviceInfo}
                        {session.isCurrent && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {session.ipAddress || "Unknown IP"} • Last active{" "}
                        {new Date(session.lastActiveAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeSession(session.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
