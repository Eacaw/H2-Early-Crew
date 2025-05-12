"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Calendar } from "@/components/calendar";
import { NewMeetingModal } from "@/components/new-meeting-modal";
import { Button } from "@/components/ui/button";
import {
  AlignEndVertical,
  Link,
  PlusCircle,
  CalendarCheck,
  FilePenLine,
  AlignVerticalJustifyCenter,
  CircleX,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
import { startOfWeek } from "date-fns";

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
  const params = useParams();
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
  const [showNewFeatures, setShowNewFeatures] = useState(true);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const featuresLastUpdated = new Date(2025, 3, 30); // Replace with actual last updated date
  const isNewFeatures =
    (new Date().getTime() - featuresLastUpdated.getTime()) /
      (1000 * 60 * 60 * 24) <=
    10;

  const toggleFeatures = () => {
    setFeaturesExpanded((prev) => !prev);
  };

  // Get the week start (Sunday) from the URL params
  const getWeekStartFromParams = () => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    let day = now.getDate();
    if (params?.month && params?.day) {
      // month is 1-based in URL, 0-based in JS
      month = Number(params.month) - 1;
      day = Number(params.day);
      // Try to get the correct year for the given month/day
      // If the given month/day is before today, use this year, else use next year if it's January and today is December
      const candidate = new Date(year, month, day);
      if (candidate > now && month === 0 && now.getMonth() === 11) {
        year += 1;
      }
      return new Date(year, month, day);
    }
    // Default to this week's Sunday
    const sunday = startOfWeek(now, { weekStartsOn: 0 });
    return sunday;
  };

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    getWeekStartFromParams
  );

  // Fetch meetings for a given week
  const fetchMeetingsForWeek = useCallback(async (weekStart: Date) => {
    setDataLoading(true);
    try {
      const startOfWeekDate = new Date(weekStart);
      startOfWeekDate.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeekDate);
      endOfWeek.setDate(startOfWeekDate.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);

      const meetingsQuery = query(
        collection(db, "meetings"),
        where("startTime", ">=", startOfWeekDate.getTime()),
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
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Always fetch meetings when currentWeekStart changes
  useEffect(() => {
    if (user && !loading) {
      fetchMeetingsForWeek(currentWeekStart);
    }
  }, [user, loading, currentWeekStart, fetchMeetingsForWeek]);

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

    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        checkAdminStatus();
      }
    }
  }, [user, loading, router]);

  // Handler for calendar navigation (prev/next week)
  const handleWeekChange = (weekStart: Date) => {
    setCurrentWeekStart(weekStart);
    // Route to the new week (Sunday)
    const month = weekStart.getMonth() + 1;
    const day = weekStart.getDate();
    router.push(`/calendar/${month}/${day}`);
  };

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
        <div className="flex justify-center items-center h-[600px]">
          <svg
            className="animate-spin h-10 w-10 text-green-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            ></path>
          </svg>
        </div>
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
              handleAddMeeting(new Date(), 9);
            }}
            className="bg-green-700 hover:bg-green-600"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Meeting
          </Button>
        )}
      </div>
      {isAdmin && (
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h2 className="text-md font-semibold text-white">New Features</h2>
              <span className="text-sm text-gray-400">
                (Last updated: {featuresLastUpdated.toLocaleDateString()})
              </span>
              {isNewFeatures && (
                <span className="ml-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                  New
                </span>
              )}
            </div>
            <button
              className="text-gray-400 hover:text-white"
              onClick={toggleFeatures}
              aria-label="Toggle Features"
              type="button"
            >
              {featuresExpanded ? (
                <ChevronUp className="h-6 w-6" />
              ) : (
                <ChevronDown className="h-6 w-6" />
              )}
            </button>
          </div>
          {featuresExpanded && (
            <ul className="list-disc list-inside text-gray-200 space-y-1 mt-4">
              <li className="flex items-center gap-2 text-sm">
                <span>
                  <Link className="h-4 w-4" />
                </span>
                Calendar routing by URL, pages now load data based on the URL,
                navigating between weeks will show relevant data
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span>
                  <AlignEndVertical className="h-4 w-4" />
                </span>
                Alignment of columns is no longer affected by the scroll bar
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span>
                  <CalendarCheck className="h-4 w-4" />
                </span>
                New 'This Week' button to bring you back to the current week
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span>
                  <FilePenLine className="h-4 w-4" />
                </span>
                Editable meetings - You can now click on a meeting to view an
                edit modal which will allow you to change the date/time of a
                specific meeting.
              </li>
              <li className="flex items-center gap-2 text-sm">
                <span>
                  <AlignVerticalJustifyCenter className="h-4 w-4" />
                </span>
                Today indication is less garish and shows a 'now' marker for the
                current time
              </li>
            </ul>
          )}
        </div>
      )}

      <Calendar
        meetings={meetings}
        isAdmin={isAdmin}
        onAddMeeting={handleAddMeeting}
        onWeekChange={handleWeekChange}
        currentWeekStart={currentWeekStart}
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
