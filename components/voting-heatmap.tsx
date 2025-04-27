"use client";

import { useState, useEffect } from "react";
import {
  subMonths,
  eachDayOfInterval,
  format,
  getDay,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function VotingHeatmap({ votesByDate }) {
  const [calendarData, setCalendarData] = useState([]);
  const [maxVotes, setMaxVotes] = useState(1);

  useEffect(() => {
    // Generate dates for the last 12 months
    const today = new Date();
    const oneYearAgo = subMonths(today, 12);

    // Get all days in the interval
    const daysInYear = eachDayOfInterval({
      start: oneYearAgo,
      end: today,
    });

    // Find the maximum number of votes on any day
    let max = 1;
    Object.values(votesByDate).forEach((count) => {
      max = Math.max(max, count as number);
    });
    setMaxVotes(max);

    // Create a 2D array for weeks
    const startDay = getDay(startOfWeek(oneYearAgo, { weekStartsOn: 0 }));
    let currentWeek = [];
    const weeks = [];

    // Add empty cells for the first week if needed
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null);
    }

    // Process each day
    daysInYear.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const votes = votesByDate[dateStr] || 0;

      currentWeek.push({
        date: day,
        votes,
        intensity: votes > 0 ? Math.min(Math.ceil((votes / max) * 5), 5) : 0,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Add the last week if it's not complete
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    setCalendarData(weeks);
  }, [votesByDate]);

  const getIntensityClass = (intensity) => {
    switch (intensity) {
      case 0:
        return "bg-zinc-800";
      case 1:
        return "bg-green-900/20";
      case 2:
        return "bg-green-900/40";
      case 3:
        return "bg-green-900/60";
      case 4:
        return "bg-green-900/80";
      case 5:
        return "bg-green-600";
      default:
        return "bg-zinc-800";
    }
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end space-x-2">
        <div className="text-xs text-muted-foreground">Less</div>
        {[0, 1, 2, 3, 4, 5].map((intensity) => (
          <div
            key={intensity}
            className={cn("w-3 h-3 rounded-sm", getIntensityClass(intensity))}
          />
        ))}
        <div className="text-xs text-muted-foreground">More</div>
      </div>

      <div className="flex">
        <div className="grid grid-rows-7 grid-flow-row gap-1 mr-2">
          {dayLabels.map((day, i) => (
            <div key={i} className="h-3 w-8 flex items-center justify-end">
              <span className="text-xs text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1">
            {calendarData.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-rows-7 gap-1">
                {week.map((day, dayIndex) => (
                  <TooltipProvider key={dayIndex}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "w-3 h-3 rounded-sm",
                            day
                              ? getIntensityClass(day.intensity)
                              : "bg-transparent"
                          )}
                        />
                      </TooltipTrigger>
                      {day && (
                        <TooltipContent>
                          <div className="text-xs">
                            <div>{format(day.date, "MMM d, yyyy")}</div>
                            <div>
                              {day.votes} vote{day.votes !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
