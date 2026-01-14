"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeft, ChevronRight, Calendar, Plane, 
  HeartPulse, Briefcase, Users, Loader2 
} from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalendarEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  avatarUrl: string | null;
  type: "vacation" | "sick" | "business_trip" | "remote";
  startDate: string;
  endDate: string;
}

const EVENT_TYPES = {
  vacation: { label: "Vacation", color: "bg-blue-500", icon: Plane },
  sick: { label: "Sick Leave", color: "bg-orange-500", icon: HeartPulse },
  business_trip: { label: "Business Trip", color: "bg-purple-500", icon: Briefcase },
  remote: { label: "Remote", color: "bg-green-500", icon: Users },
};

export function TeamCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  useEffect(() => {
    fetchEvents();
  }, [year, month]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/calendar/events?year=${year}&month=${month + 1}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDay = (day: number) => {
    const date = new Date(year, month, day);
    return events.filter(event => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      return date >= start && date <= end;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate calendar grid
  const days: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-blue-500" />
            Team Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <button 
              onClick={goToPrevMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium min-w-[140px] text-center">{monthName}</span>
            <button 
              onClick={goToNextMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                return (
                  <div 
                    key={idx} 
                    className={`
                      min-h-[60px] p-1 rounded-lg border border-transparent
                      ${day ? "bg-slate-50 dark:bg-slate-700/50" : ""}
                      ${isToday(day || 0) ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30" : ""}
                    `}
                  >
                    {day && (
                      <>
                        <div className={`text-xs font-medium mb-1 ${isToday(day) ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 2).map(event => {
                            const config = EVENT_TYPES[event.type];
                            return (
                              <div 
                                key={event.id}
                                className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] text-white ${config.color}`}
                                title={`${event.employeeName} - ${config.label}`}
                              >
                                <span className="truncate">{event.employeeName.split(" ")[0]}</span>
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 pl-1">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              {Object.entries(EVENT_TYPES).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className={`w-3 h-3 rounded ${config.color}`} />
                    <Icon className="h-3 w-3" />
                    <span>{config.label}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
