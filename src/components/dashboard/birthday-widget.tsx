"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { Cake, Gift, PartyPopper, Loader2, Calendar } from "lucide-react";
import Link from "next/link";

interface Birthday {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  department: string | null;
  nextBirthday: string;
  daysUntil: number;
  turningAge: number;
  isToday: boolean;
  isThisWeek: boolean;
}

export function BirthdayWidget() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const response = await fetch("/api/birthdays?days=30");
        const data = await response.json();
        setBirthdays(data.birthdays || []);
        setTodayCount(data.todayCount || 0);
      } catch (error) {
        console.error("Failed to fetch birthdays:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBirthdays();
  }, []);

  const formatBirthdayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cake className="h-5 w-5 text-pink-500" />
            Upcoming Birthdays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cake className="h-5 w-5 text-pink-500" />
          Upcoming Birthdays
          {todayCount > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs font-normal bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2 py-1 rounded-full">
              <PartyPopper className="h-3 w-3" />
              {todayCount} today!
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {birthdays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <Calendar className="h-10 w-10 text-slate-200 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming birthdays</p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {birthdays.slice(0, 10).map((birthday) => (
                <Link
                  key={birthday.id}
                  href={`/profile/${birthday.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <div className="relative">
                    <UserAvatar
                      name={birthday.fullName}
                      imageUrl={birthday.avatarUrl}
                      className="h-10 w-10"
                    />
                    {birthday.isToday && (
                      <div className="absolute -top-1 -right-1 bg-pink-500 rounded-full p-1">
                        <PartyPopper className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate group-hover:text-pink-600 transition-colors">
                      {birthday.fullName}
                    </p>
                    {birthday.department && (
                      <p className="text-xs text-slate-500 truncate">
                        {birthday.department}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    {birthday.isToday ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-pink-600 bg-pink-50 px-2 py-1 rounded-full">
                        <Gift className="h-3 w-3" />
                        Today!
                      </span>
                    ) : birthday.isThisWeek ? (
                      <div>
                        <p className="text-sm font-medium text-amber-600">
                          {birthday.daysUntil === 1 ? "Tomorrow" : `In ${birthday.daysUntil} days`}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatBirthdayDate(birthday.nextBirthday)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-slate-600">
                          {formatBirthdayDate(birthday.nextBirthday)}
                        </p>
                        <p className="text-xs text-slate-400">
                          in {birthday.daysUntil} days
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
