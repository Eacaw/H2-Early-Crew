"use client";

import { auth } from "@/firebase";
import {
  fetchUserData,
  fetchNextMeeting,
  fetchTotalVotes,
  fetchMostVotedPerson,
  fetchMostWinsPerson,
} from "@/firebase/queries";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MetricCard from "@/app/components/MetricCard";
import EventForm from "@/app/components/EventForm";
import { useData } from "@/app/context/DataContext";

const AdminPage = () => {
  const { user, userData, nextMeeting, totalVotes, mostVotedPerson, mostWinsPerson } = useData();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);

      if (userData) {
        setIsAdmin(userData.isAdmin);
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    };

    checkAdminStatus();
  }, [userData]);

  useEffect(() => {
    if (!loading && isAdmin === false) {
      router.push("/");
    }
  }, [isAdmin, loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Redirecting, so don't render anything
  }

  const formatMeetingTime = (startTime: Date) => {
    const meetingDate = new Date(startTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday =
      meetingDate.getDate() === today.getDate() &&
      meetingDate.getMonth() === today.getMonth() &&
      meetingDate.getFullYear() === today.getFullYear();

    const isTomorrow =
      meetingDate.getDate() === tomorrow.getDate() &&
      meetingDate.getMonth() === tomorrow.getMonth() &&
      meetingDate.getFullYear() === tomorrow.getFullYear();

    const timeFormat = {
      hour: "2-digit",
      minute: "2-digit",
    } as const;
    const formattedTime = meetingDate.toLocaleTimeString("en-GB", timeFormat);

    if (isToday) {
      return `Today at ${formattedTime}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${formattedTime}`;
    } else {
      const dateFormat = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      } as const;
      const formattedDate = meetingDate.toLocaleDateString("en-GB", dateFormat);
      return `${formattedDate} at ${formattedTime}`;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric Card 1 */}
        <MetricCard
          title="Next Meeting"
          description={
            nextMeeting ? (
              <>
                <div>Name: {nextMeeting.meetingName}</div>
                <div>
                  When: {formatMeetingTime(new Date(nextMeeting.startTime))}
                </div>
              </>
            ) : (
              "No upcoming meetings"
            )
          }
        />

        {/* Metric Card 2 */}
        <MetricCard
          title="Total Votes Cast"
          description={`Total: ${totalVotes}`}
        />

        {/* Metric Card 3 */}
        <MetricCard
          title="Eager'est Beaver"
          description={
            mostWinsPerson
              ? `Name: ${mostWinsPerson.name}, Wins: ${mostWinsPerson.winCount}`
              : "No wins have been recorded"
          }
        />
      </div>

      {/* Input Form */}
      <div className="mt-8"></div>
      <EventForm />
    </div>
  );
};

export default AdminPage;
