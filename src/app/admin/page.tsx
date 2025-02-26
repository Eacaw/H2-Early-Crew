"use client";

import { auth, firestore } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MetricCard from "@/app/components/MetricCard";
import EventForm from "@/app/components/EventForm";

const AdminPage = () => {
  const [user, setUser] = useState(auth.currentUser);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextMeeting, setNextMeeting] = useState<any>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [mostVotedPerson, setMostVotedPerson] = useState<string | null>(null);
  const [mostVotedPersonVoteCount, setMostVotedPersonVoteCount] = useState(0);
  const [mostWinsPerson, setMostWinsPerson] = useState<string | null>(null);
  const [mostWinsPersonWinCount, setMostWinsPersonWinCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);

      if (user) {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.isAdmin);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    };

    checkAdminStatus();
  }, [user]);

  //   useEffect(() => {
  //     if (!loading && isAdmin === false) {
  //       router.push("/");
  //     }
  //   }, [isAdmin, loading]);

  useEffect(() => {
    const fetchNextMeeting = async () => {
      const now = new Date();
      const meetingsCollection = collection(firestore, "meetings");
      const q = query(
        meetingsCollection,
        orderBy("startTime"),
        where("startTime", ">=", now.getTime()),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const nextMeetingData = querySnapshot.docs[0].data();
        console.log("nextMeetingData :", nextMeetingData);
        setNextMeeting(nextMeetingData);
      } else {
        setNextMeeting(null);
      }
    };

    fetchNextMeeting();
  }, []);

  useEffect(() => {
    const fetchTotalVotes = async () => {
      let total = 0;
      const meetingsCollection = collection(firestore, "meetings");
      const querySnapshot = await getDocs(meetingsCollection);

      querySnapshot.forEach((doc) => {
        const meetingData = doc.data();
        if (meetingData.votes) {
          total += Object.keys(meetingData.votes).length;
        }
      });

      setTotalVotes(total);
    };

    fetchTotalVotes();
  }, []);

  useEffect(() => {
    const fetchMostVotedPerson = async () => {
      const meetingsCollection = collection(firestore, "meetings");
      const querySnapshot = await getDocs(meetingsCollection);

      const votesByPerson: { [person: string]: number } = {};

      querySnapshot.forEach((doc) => {
        const meetingData = doc.data();
        if (meetingData.votes) {
          for (const votedFor in meetingData.votes) {
            votesByPerson[votedFor] = (votesByPerson[votedFor] || 0) + 1;
          }
        }
      });

      let topPerson: string | null = null;
      let topVoteCount = 0;

      for (const person in votesByPerson) {
        if (votesByPerson[person] > topVoteCount) {
          topPerson = person;
          topVoteCount = votesByPerson[person];
        }
      }

      setMostVotedPerson(topPerson);
      setMostVotedPersonVoteCount(topVoteCount);
    };

    fetchMostVotedPerson();
  }, []);

  useEffect(() => {
    const fetchMostWinsPerson = async () => {
      const meetingsCollection = collection(firestore, "meetings");
      const querySnapshot = await getDocs(meetingsCollection);

      const winsByPerson: { [person: string]: number } = {};

      querySnapshot.forEach((doc) => {
        const meetingData = doc.data();
        if (meetingData.winner) {
          winsByPerson[meetingData.winner] =
            (winsByPerson[meetingData.winner] || 0) + 1;
        }
      });

      let topPerson: string | null = null;
      let topWinCount = 0;

      for (const person in winsByPerson) {
        if (winsByPerson[person] > topWinCount) {
          topPerson = person;
          topWinCount = winsByPerson[person];
        }
      }

      setMostWinsPerson(topPerson);
      setMostWinsPersonWinCount(topWinCount);
    };

    fetchMostWinsPerson();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  //   if (!isAdmin) {
  //     return null; // Redirecting, so don't render anything
  //   }

  const formatMeetingTime = (startTime: Date) => {
    console.log("startTime :", startTime);
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
              ? `Name: ${mostWinsPerson}, Wins: ${mostWinsPersonWinCount}`
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
