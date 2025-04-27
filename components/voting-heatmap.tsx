"use client";

import { useState, useEffect } from "react";
import {
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  format,
  getDay,
  startOfWeek,
  getDate,
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
  const [monthTicks, setMonthTicks] = useState([]);
  const [maxVotes, setMaxVotes] = useState(1);

  useEffect(() => {
    const today = new Date();
    const yearStart = startOfYear(today);
    const yearEnd = endOfYear(today);

    const daysInYear = eachDayOfInterval({
      start: yearStart,
      end: yearEnd,
    });

    let max = 1;
    Object.values(votesByDate).forEach((count) => {
      max = Math.max(max, count as number);
    });
    setMaxVotes(max);

    // Build columns: each column is a week, each cell is a day (Sun-Sat, top-bottom)
    const columns = [];
    let currentCol = [];
    let jan1ColIdx = null;

    // Pad the first column with empty cells if the year doesn't start on Sunday
    const jan1 = daysInYear[0];
    const jan1Day = getDay(jan1); // 0=Sun, 1=Mon, ..., 6=Sat
    if (jan1Day > 0) {
      for (let i = 0; i < jan1Day; i++) {
        currentCol.push(null);
      }
    }

    daysInYear.forEach((day, idx) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const votes = votesByDate[dateStr] || 0;
      const cell = {
        date: day,
        votes,
        intensity: votes > 0 ? Math.min(Math.ceil((votes / max) * 5), 5) : 0,
      };

      if (idx === 0) {
        jan1ColIdx = columns.length;
      }

      currentCol.push(cell);

      if (currentCol.length === 7) {
        columns.push(currentCol);
        currentCol = [];
      }
    });

    if (currentCol.length > 0) {
      while (currentCol.length < 7) currentCol.push(null);
      columns.push(currentCol);
    }

    // Find the column index for each month's first day
    const monthTickArr: { colIdx: number; month: string }[] = [];
    daysInYear.forEach((day, idx) => {
      if (getDate(day) === 1) {
        const daysSinceStart = idx + jan1Day;
        const colIdx = Math.floor(daysSinceStart / 7);
        const month = format(day, "MMM");
        if (
          monthTickArr.length === 0 ||
          monthTickArr[monthTickArr.length - 1].colIdx !== colIdx
        ) {
          monthTickArr.push({ colIdx, month });
        }
      }
    });

    setCalendarData(columns);
    setMonthTicks(monthTickArr);
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

  // Use short day labels for left axis
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthLabelMap = Object.fromEntries(
    monthTicks.map((m) => [m.colIdx, m.month])
  );

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
      <div className="overflow-x-auto pb-2">
        <div className="relative">
          {/* Heatmap grid with day labels as first column and months on bottom */}
          <div className="flex">
            <div>
              <div className="flex">
                {/* First column: day labels */}
                <div className="flex flex-col gap-1 mr-1">
                  {dayLabels.map((day, i) => (
                    <div
                      key={i}
                      className="h-3 w-8 flex items-center justify-end"
                      style={{ minHeight: 12 }}
                    >
                      <span className="text-xs text-muted-foreground">
                        {day}
                      </span>
                    </div>
                  ))}
                  {/* Empty cell for bottom-left corner */}
                  <div className="h-6 w-8" />
                </div>
                {/* Heatmap columns */}
                {calendarData.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-1 mr-1">
                    {col.map((day, rowIdx) => (
                      <TooltipProvider key={rowIdx}>
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
                    {/* Month label (bottom, vertical text) */}
                    <div className="flex justify-center h-6 w-full">
                      {monthLabelMap[colIdx] && (
                        <span
                          className="text-xs text-muted-foreground"
                          style={{
                            writingMode: "vertical-rl",
                            textOrientation: "mixed",
                            fontSize: "10px",
                            lineHeight: "12px",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {monthLabelMap[colIdx]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
