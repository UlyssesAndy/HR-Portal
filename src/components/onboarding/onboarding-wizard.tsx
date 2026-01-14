"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle, Circle, User, Users, Briefcase, 
  ArrowRight, ArrowLeft, Sparkles, PartyPopper,
  Building2, Phone, Globe, Camera, Loader2
} from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "@/components/profile/photo-upload";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface OnboardingData {
  employee: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    phone: string | null;
    timezone: string | null;
    position: { title: string } | null;
    department: { name: string } | null;
    manager: { fullName: string; avatarUrl: string | null } | null;
  };
  teammates: Array<{
    id: string;
    fullName: string;
    avatarUrl: string | null;
    position: { title: string } | null;
  }>;
  progress: number;
}

const STEPS: OnboardingStep[] = [
  { id: "welcome", title: "Welcome!", description: "Let's get you started", icon: <Sparkles className="h-5 w-5" /> },
  { id: "profile", title: "Your Profile", description: "Add your details", icon: <User className="h-5 w-5" /> },
  { id: "team", title: "Meet Your Team", description: "Your colleagues", icon: <Users className="h-5 w-5" /> },
  { id: "complete", title: "All Set!", description: "You're ready to go", icon: <PartyPopper className="h-5 w-5" /> },
];

export function OnboardingWizard({ initialData }: { initialData: OnboardingData }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: initialData.employee.phone || "",
    timezone: initialData.employee.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const handleNext = async () => {
    if (currentStep === 1) {
      // Save profile data
      setIsLoading(true);
      try {
        await fetch(`/api/employees/${initialData.employee.id}/self-update`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } catch (error) {
        console.error("Failed to save:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Failed to complete:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center gap-2 px-4 py-2 rounded-full transition-all
                  ${idx === currentStep 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg scale-105" 
                    : idx < currentStep 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-white/50 text-slate-400 dark:bg-slate-800/50"
                  }
                `}>
                  {idx < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : idx === currentStep ? (
                    step.icon
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                  <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${idx < currentStep ? "bg-green-400" : "bg-slate-200 dark:bg-slate-700"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <div className="p-8 md:p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Welcome to the Team, {initialData.employee.fullName.split(" ")[0]}! 🎉
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto">
                We're excited to have you join us. Let's get you set up in just a few quick steps.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <Briefcase className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-medium text-slate-900 dark:text-white">{initialData.employee.position?.title || "Team Member"}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{initialData.employee.department?.name || "No Department"}</p>
                </div>
                {initialData.employee.manager && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Your Manager</p>
                    <div className="flex items-center justify-center gap-2">
                      <UserAvatar name={initialData.employee.manager.fullName} imageUrl={initialData.employee.manager.avatarUrl} className="h-8 w-8" />
                      <span className="font-medium text-slate-900 dark:text-white">{initialData.employee.manager.fullName}</span>
                    </div>
                  </div>
                )}
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <Users className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                  <p className="font-medium text-slate-900 dark:text-white">{initialData.teammates.length} Teammates</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">In your department</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Profile */}
          {currentStep === 1 && (
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Complete Your Profile</h2>
                <p className="text-slate-500 dark:text-slate-400">Help your colleagues get to know you</p>
              </div>
              
              <div className="max-w-md mx-auto space-y-6">
                {/* Photo */}
                <div className="flex justify-center">
                  <PhotoUpload
                    employeeId={initialData.employee.id}
                    currentPhotoUrl={initialData.employee.avatarUrl}
                    employeeName={initialData.employee.fullName}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1-555-0100"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    <Globe className="h-4 w-4 inline mr-2" />
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Europe/Moscow">Moscow (MSK)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Shanghai">Shanghai (CST)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Team */}
          {currentStep === 2 && (
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Meet Your Team</h2>
                <p className="text-slate-500 dark:text-slate-400">Your colleagues in {initialData.employee.department?.name || "the team"}</p>
              </div>
              
              {initialData.teammates.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
                  {initialData.teammates.map((teammate) => (
                    <div key={teammate.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-center hover:shadow-lg transition-shadow">
                      <UserAvatar 
                        name={teammate.fullName} 
                        imageUrl={teammate.avatarUrl}
                        className="h-16 w-16 mx-auto mb-3 ring-4 ring-white dark:ring-slate-600 shadow"
                      />
                      <p className="font-medium text-slate-900 dark:text-white truncate">{teammate.fullName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{teammate.position?.title || "Team Member"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No teammates found yet</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 3 && (
            <div className="p-8 md:p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl animate-bounce">
                <PartyPopper className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                You're All Set! 🚀
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto">
                Your profile is complete. Welcome aboard — we're thrilled to have you!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-medium shadow-lg"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Navigation */}
          {currentStep < 3 && (
            <div className="px-8 md:px-12 pb-8 flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              
              <button
                onClick={handleNext}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-medium shadow-lg transition-all hover:scale-105 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
