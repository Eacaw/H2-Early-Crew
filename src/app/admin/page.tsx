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
          title="Metric 2"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua."
        />

        {/* Metric Card 3 */}
        <MetricCard
          title="Metric 3"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua."
        />
      </div>

      {/* Input Form */}
      <div className="mt-8"></div>
      <EventForm />
    </div>
  );
};

export default AdminPage;
