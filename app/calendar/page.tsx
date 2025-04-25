"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Calendar } from "@/components/calendar";
import { NewMeetingModal } from "@/components/new-meeting-modal";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

export default function CalendarPage() {
  interface AuthUser {
    uid: string;
    [key: string]: any;
  }
  const { user, loading } = useAuth() as {
    user: AuthUser | null;
    loading: boolean;
  };
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  interface Meeting {
    id: string;
    meetingName: string;
    startTime: number;
    [key: string]: any;
  }
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setIsAdmin(userDoc.data().isAdmin || false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      }
    };

    const fetchMeetings = async () => {
      try {
        // Get current week's start and end dates
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7); // Next Sunday
        endOfWeek.setHours(23, 59, 59, 999);

        // Query meetings for the current week
        const meetingsQuery = query(
          collection(db, "meetings"),
          where("startTime", ">=", startOfWeek.getTime()),
          where("startTime", "<=", endOfWeek.getTime()),
          orderBy("startTime", "asc")
        );
        const meetingsSnapshot = await getDocs(meetingsQuery);
        const meetingsData = meetingsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            meetingName: data.meetingName,
            startTime: data.startTime,
            ...data,
          };
        });

        setMeetings(meetingsData);
        setDataLoading(false);
      } catch (error) {
        console.error("Error fetching meetings:", error);
        setDataLoading(false);
      }
    };

    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        checkAdminStatus();
        fetchMeetings();
      }
    }
  }, [user, loading, router]);

  const handleAddMeeting = (date: Date, hour: number) => {
    setSelectedDate(date);
    setSelectedTime(hour);
    setShowNewMeetingModal(true);
  };

  const handleCloseModal = () => {
    setShowNewMeetingModal(false);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  if (loading || dataLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Meeting Calendar
        </h1>
        {isAdmin && (
          <Button
            onClick={() => {
              // Provide default values for date and hour when adding a meeting from the button
              handleAddMeeting(new Date(), 9);
            }}
            className="bg-green-700 hover:bg-green-600"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Meeting
          </Button>
        )}
      </div>

      <Calendar
        meetings={meetings}
        isAdmin={isAdmin}
        onAddMeeting={handleAddMeeting}
      />

      {isAdmin && showNewMeetingModal && (
        <NewMeetingModal
          open={showNewMeetingModal}
          onClose={handleCloseModal}
          initialDate={selectedDate ?? null}
          initialTime={selectedTime ?? null}
        />
      )}
    </div>
  );
}
