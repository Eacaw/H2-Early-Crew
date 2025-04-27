"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { formatDistanceToNow, format } from "date-fns";

type Meeting = {
  id: string;
  meetingName?: string;
  startTime: number;
  votingStartTime?: number;
  votingEndTime?: number;
  participants?: any[];
  [key: string]: any;
};

export function UpcomingMeeting() {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [meetingStarted, setMeetingStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [votingStatus, setVotingStatus] = useState("not-started"); // not-started, active, ended

  useEffect(() => {
    const fetchUpcomingMeeting = async () => {
      try {
        const now = Date.now();

        // 1. Check for current meeting (voting is active)
        const currentMeetingQuery = query(
          collection(db, "meetings"),
          where("startTime", "<=", now),
          where("votingEndTime", ">", now),
          orderBy("startTime", "desc"),
          limit(1)
        );

        const currentMeetingSnapshot = await getDocs(currentMeetingQuery);

        if (!currentMeetingSnapshot.empty) {
          const doc = currentMeetingSnapshot.docs[0];
          const data = doc.data();
          if (typeof data.startTime === "number") {
            const meetingData: Meeting = {
              ...data,
              id: doc.id,
            };
            setMeeting(meetingData);
          } else {
            setMeeting(null);
          }
        } else {
          // 2. If no current meeting, check for the next upcoming meeting
          const meetingsQuery = query(
            collection(db, "meetings"),
            where("startTime", ">", now),
            orderBy("startTime"),
            limit(1)
          );

          const meetingsSnapshot = await getDocs(meetingsQuery);

          if (!meetingsSnapshot.empty) {
            const doc = meetingsSnapshot.docs[0];
            const data = doc.data();
            if (typeof data.startTime === "number") {
              const meetingData: Meeting = {
                id: doc.id,
                ...data,
              };
              setMeeting(meetingData);
            } else {
              setMeeting(null);
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching upcoming meeting:", error);
        setLoading(false);
      }
    };

    fetchUpcomingMeeting();

    // Set up interval to update time remaining
    const interval = setInterval(() => {
      if (meeting) {
        updateTimeAndStatus();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update time remaining and voting status whenever meeting changes
  useEffect(() => {
    if (meeting) {
      updateTimeAndStatus();
    }
  }, [meeting]);

  const updateTimeAndStatus = () => {
    if (!meeting) return;

    const now = Date.now();
    const votingStartTime =
      meeting.votingStartTime || meeting.startTime - 5 * 60 * 1000; // 5 minutes before
    const votingEndTime =
      meeting.votingEndTime || meeting.startTime + 5 * 60 * 1000; // 5 minutes after

    // Determine voting status
    if (now < votingStartTime) {
      setVotingStatus("not-started");
      const timeToStart = formatDistanceToNow(new Date(votingStartTime), {
        addSuffix: true,
      });
      setTimeRemaining(`Voting opens ${timeToStart}`);
    } else if (now >= votingStartTime && now <= votingEndTime) {
      console.log("meetingStarted:", meetingStarted);
      setVotingStatus("active");
      setMeetingStarted(true);

      const timeToEnd = formatDistanceToNow(new Date(votingEndTime), {
        addSuffix: true,
      });
      setTimeRemaining(`Voting ends ${timeToEnd}`);
    } else {
      setVotingStatus("ended");
      setMeetingStarted(false);
      setTimeRemaining("Voting has ended");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Meeting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!meeting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {meetingStarted ? "Current Meeting" : "Upcomming Meeting"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mb-2 text-muted-foreground/60" />
            <p>No upcoming meetings scheduled</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-green-900/20">
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2 text-green-600" />
          Upcoming Meeting
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold">{meeting.meetingName}</h3>
            <p className="text-muted-foreground">
              {format(
                new Date(meeting.startTime),
                "EEEE, MMMM d, yyyy 'at' h:mm a"
              )}
            </p>
          </div>

          <div
            className={`p-3 rounded-lg text-sm font-medium ${
              votingStatus === "active"
                ? "bg-green-900/30 text-green-400"
                : votingStatus === "ended"
                ? "bg-zinc-800 text-zinc-300"
                : "bg-amber-900/20 text-amber-300"
            }`}
          >
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              {timeRemaining}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              {meeting.participants?.length || 0} participants
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
