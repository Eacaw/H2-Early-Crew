"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isToday,
} from "date-fns";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { MeetingBlock } from "@/components/MeetingBlock";
import { EditMeetingModal } from "@/components/EditMeetingModal";

type Meeting = {
  id: string | number;
  meetingName: string;
  startTime: number;
  participants?: string[];
  [key: string]: any;
};

export interface CalendarProps {
  meetings: Meeting[];
  isAdmin: boolean;
  onAddMeeting: (date: Date, hour: number) => void;
  currentWeekStart: Date;
  onWeekChange: (
    weekStart: Date,
    direction: "prev" | "next" | "current"
  ) => void;
}

export function Calendar({
  meetings,
  isAdmin,
  onAddMeeting,
  currentWeekStart,
  onWeekChange,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(
    currentWeekStart || new Date()
  );
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);
  const [timeSlots, setTimeSlots] = useState<number[]>([]);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [localMeetings, setLocalMeetings] = useState<Meeting[]>(meetings);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [nowLine, setNowLine] = useState<{
    hour: number;
    top: number;
    todayIdx?: number;
  } | null>(null);

  useEffect(() => {
    setCurrentDate(currentWeekStart || new Date());
  }, [currentWeekStart]);

  useEffect(() => {
    // Generate days for the current week
    const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
    const end = endOfWeek(currentDate, { weekStartsOn: 0 }); // Saturday
    const days = eachDayOfInterval({ start, end });
    setCurrentWeek(days);

    // Generate time slots from 8 AM to 6 PM
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push(hour);
    }
    setTimeSlots(slots);
  }, [currentDate]);

  useEffect(() => {
    setLocalMeetings(meetings);
  }, [meetings]);

  useEffect(() => {
    const updateNowLine = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      // Snap to closest 10 minutes
      const snappedMinutes = Math.round(currentMinutes / 10) * 10;
      const hour = currentHour;
      const minuteFraction = snappedMinutes / 60;

      // Only show the line if today is in the current week
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      if (now < weekStart || now > weekEnd) {
        setNowLine(null);
        return;
      }

      // Only show if within the time slots
      if (hour < 8 || hour > 18) {
        setNowLine(null);
        return;
      }

      // Find the index of today in the currentWeek array
      const todayIdx = currentWeek.findIndex(
        (d) =>
          d &&
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
      );
      if (todayIdx === -1) {
        setNowLine(null);
        return;
      }

      // Calculate the vertical position
      const slotHeight = 60;
      const top = (hour - 8 + minuteFraction) * slotHeight;
      setNowLine({ hour, top, todayIdx: todayIdx + 1 });
    };

    updateNowLine();
    const interval = setInterval(updateNowLine, 60 * 1000); // update every minute
    return () => clearInterval(interval);
  }, [currentDate, currentWeek]);

  const nextWeek = () => {
    const next = addWeeks(currentDate, 1);
    setCurrentDate(next);
    onWeekChange(startOfWeek(next, { weekStartsOn: 0 }), "next");
  };

  const prevWeek = () => {
    const prev = subWeeks(currentDate, 1);
    setCurrentDate(prev);
    onWeekChange(startOfWeek(prev, { weekStartsOn: 0 }), "prev");
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const currentSunday = startOfWeek(today, { weekStartsOn: 0 });
    setCurrentDate(currentSunday);
    onWeekChange(currentSunday, "current");
  };

  const formatTimeSlot = (hour: number) => {
    return format(new Date().setHours(hour, 0, 0, 0), "h:mm a");
  };

  const getMeetingsForTimeSlot = (day: Date, hour: number): Meeting[] => {
    const dayStart = new Date(day);
    dayStart.setHours(hour, 0, 0, 0);

    const dayEnd = new Date(day);
    dayEnd.setHours(hour, 59, 59, 999);

    return localMeetings.filter((meeting) => {
      const meetingDate = new Date(meeting.startTime);
      return meetingDate >= dayStart && meetingDate <= dayEnd;
    });
  };

  const handleTimeSlotClick = (day: Date, hour: number) => {
    if (isAdmin) {
      const selectedDate = new Date(day);
      selectedDate.setHours(hour, 0, 0, 0);
      onAddMeeting(selectedDate, hour);
    }
  };

  const handleEditMeeting = (meeting: Meeting) => {
    if (isAdmin) {
      setEditMeeting(meeting);
      setEditModalOpen(true);
    }
  };

  const handleMeetingUpdated = (updated: Meeting) => {
    setLocalMeetings((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
  };

  const handleMeetingDeleted = (id: string | number) => {
    setLocalMeetings((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">
          {currentWeek.length === 7
            ? `${format(currentWeek[0], "MMMM d")} - ${format(
                currentWeek[6],
                "MMMM d, yyyy"
              )}`
            : ""}
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={goToCurrentWeek}
            aria-label="Go to current week"
          >
            <span className="font-bold text-lg">This Week</span>
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="grid grid-cols-8 border-b">
          {/* Time column header */}
          <div className="border-r p-2 text-center text-xs font-medium text-muted-foreground">
            Time
          </div>

          {/* Day headers */}
          {currentWeek.map((day) => (
            <div
              key={day.toString()}
              className={cn(
                "p-2 text-center border-r last:border-r-0",
                isToday(day) && "bg-green-900/20"
              )}
            >
              <div className="text-xs font-medium text-muted-foreground">
                {format(day, "EEE")}
              </div>
              <div
                className={cn(
                  "text-sm font-semibold",
                  isToday(day) && "text-green-600"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Prevent layout shift by always reserving space for the scrollbar */}
        <div
          ref={scrollRef}
          className="overflow-y-scroll max-h-[600px] relative"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Red "now" line: only on current day column, 1px thick */}
          {nowLine && typeof nowLine.todayIdx === "number" && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{
                top: `${nowLine.top}px`,
                left: `calc((100% / 8) * ${nowLine.todayIdx + 1})`,
                width: "calc(100% / 8)",
                height: "0px",
                transform: "translateX(-100%)",
              }}
            >
              <div
                className="w-full border-t border-red-500 relative"
                style={{ borderWidth: "1px 0 0 0" }}
              >
                <span
                  className="absolute -top-3 right-0.5 bg-red-600/50 text-white text-[8px] px-1 rounded-tl-sm rounded-tr-sm shadow pointer-events-none"
                  style={{ fontWeight: 400, letterSpacing: "0.05em" }}
                >
                  Now
                </span>
              </div>
            </div>
          )}

          {/* Time slots */}
          {timeSlots.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-8 border-b last:border-b-0"
            >
              {/* Time column */}
              <div className="border-r p-2 text-xs font-medium text-muted-foreground flex items-center justify-center">
                {formatTimeSlot(hour)}
              </div>

              {/* Day cells */}
              {currentWeek.map((day) => {
                const meetingsInSlot = getMeetingsForTimeSlot(day, hour);

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "border-r last:border-r-0 p-1 min-h-[60px] relative",
                      isAdmin && "cursor-pointer hover:bg-muted/50",
                      isToday(day) &&
                        "bg-blue-400/5 border-l-2 border-r-2  border-red-500/30"
                    )}
                    onClick={() => handleTimeSlotClick(day, hour)}
                  >
                    {meetingsInSlot.map((meeting) => (
                      <MeetingBlock
                        key={meeting.id}
                        meeting={meeting}
                        onEdit={() => handleEditMeeting(meeting)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
      <EditMeetingModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        meeting={editMeeting}
        onMeetingUpdated={handleMeetingUpdated}
        onMeetingDeleted={handleMeetingDeleted}
      />
    </Card>
  );
}
