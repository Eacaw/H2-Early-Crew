"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MetricCard from "@/app/components/MetricCard";
import EventForm from "@/app/components/EventForm";
import { useData } from "@/app/context/DataContext";
import { participantEmails } from "../constants";
import { firestore, auth } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

const AdminPage = () => {
  const { userData, nextMeeting, totalVotes, mostWinsPerson } = useData();
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

  const handleUpdateWinners = async () => {
    const now = Date.now();
    const meetingsCollection = collection(firestore, "meetings");
    const q = query(
      meetingsCollection,
      where("votingEndTime", "<", now),
      where("winnerDeclared", "==", false)
    );

    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(async (meetingDoc) => {
      const meetingDataId = meetingDoc.id;
      const meetingData = meetingDoc.data();
      const votes = meetingData.votes || {};

      let winner: string | null = null;
      let maxVotes = 0;
      const voteCounts: { [key: string]: number } = {};

      for (const voter in votes) {
        const votedFor = meetingData.votes[voter];
        voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
        if (voteCounts[votedFor] > maxVotes) {
          maxVotes = voteCounts[votedFor];
          winner = votedFor;
        }
      }

      if (winner) {
        const meetingDocRef = doc(firestore, "meetings", meetingDataId);
        await updateDoc(meetingDocRef, {
          winner: winner,
          winnerDeclared: true,
        });
        console.log(`Winner declared for meeting ${meetingDataId}: ${winner}`);
      } else {
        console.log(`No votes for meeting ${meetingDataId}`);
      }
    });
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
              ? `Name: ${
                  Object.entries(participantEmails).find(
                    ([name, email]) => email === mostWinsPerson.topPerson
                  )?.[0]
                }, Wins: ${mostWinsPerson.topWinCount}`
              : "No wins have been recorded"
          }
        />
      </div>

      <button
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
        onClick={handleUpdateWinners}
      >
        Update Recent Winners
      </button>

      {/* Input Form */}
      <div className="mt-8"></div>
      <EventForm />
    </div>
  );
};

export default AdminPage;
