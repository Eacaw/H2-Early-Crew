"use client";

import { auth, firestore } from "@/firebase";
import { collection, query, orderBy, where, getDocs } from "firebase/firestore";
import React, { useState, useEffect } from "react";

function Home() {
  const [user, setUser] = useState(auth.currentUser);
  const [nextMeeting, setNextMeeting] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchNextMeeting = async () => {
      if (user) {
        const now = new Date();
        const meetingsCollection = collection(firestore, "meetings");
        const q = query(
          meetingsCollection,
          orderBy("startTime"),
          where("startTime", ">=", now.getTime()),
          where("participants", "array-contains", "dpinchen@certinia.com")
        );
        console.log("user.email :", user.email);

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const nextMeetingData = querySnapshot.docs[0].data();
          setNextMeeting(nextMeetingData);
          console.log("nextMeetingData :", nextMeetingData);
        } else {
          setNextMeeting(null);
        }
      }
    };

    fetchNextMeeting();
  }, [user]);

  useEffect(() => {
    if (nextMeeting) {
      const calculateCountdown = () => {
        const votingStartTime = new Date(nextMeeting.votingStartTime).getTime();
        const now = new Date().getTime();
        const difference = votingStartTime - now;

        if (difference > 0) {
          setCountdown(difference);
        } else {
          setCountdown(0);
        }
      };

      calculateCountdown();
      const intervalId = setInterval(calculateCountdown, 1000);

      return () => clearInterval(intervalId);
    }
  }, [nextMeeting]);

  const formatCountdown = (countdown: number | null) => {
    if (countdown === null)
      return { days: "00", hours: "00", minutes: "00", seconds: "00" };
    if (countdown <= 0)
      return { days: "00", hours: "00", minutes: "00", seconds: "00" };

    const days = Math.floor(countdown / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (countdown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((countdown % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((countdown % (1000 * 60)) / 1000);

    return {
      days: String(days).padStart(2, "0"),
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
    };
  };

  const countdownValues = formatCountdown(countdown);

  return (
    <main className="container mx-auto py-8">
      <div className="bg-gray-800 shadow-2xl shadow-green-400/20 rounded-2xl p-4 text-white">
        <div className="flex flex-row">
          {/* Main Card */}
          <div className="p-8 w-3/4">
            <h1 className="text-2xl font-bold mb-4">
              Welcome to H2 Early Crew!
            </h1>
            {user && nextMeeting ? (
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-600">
                  Upcoming Meetings
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nextMeeting && (
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-300">
                        {nextMeeting.meetingName}
                      </h3>
                      <p className="text-gray-400">
                        {new Date(nextMeeting.startTime).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-300">
                Please sign in to see upcoming meetings.
              </p>
            )}
          </div>

          {/* Vertical Separator */}
          <div className="border-l-4 border-gray-950 p-4"></div>

          {/* Next Meeting Card */}
          <div className="p-8 flex flex-col items-center">
            {user ? (
              <>
                {nextMeeting ? (
                  <>
                    <p className="text-6xl text-gray-300 font-semibold mb-4">
                      {new Date(nextMeeting.startTime).toLocaleTimeString(
                        "en-US",
                        {
                          hour12: false,
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                    <p className="text-lg text-gray-300">
                      {nextMeeting.meetingName}
                    </p>
                    <h2 className="text-2xl font-semibold mt-4 mb-6 text-gray-600">
                      Next Meeting
                    </h2>
                    <p className="text-xl text-gray-200 pb-2">
                      Voting opens in:
                    </p>
                    <div className="grid grid-flow-col gap-5 text-center auto-cols-max">
                      <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content shadow-lg shadow-green-400/20">
                        <span className="countdown font-mono text-5xl ">
                          <span
                            style={
                              {
                                "--value": countdownValues.days,
                              } as React.CSSProperties
                            }
                          ></span>
                        </span>
                        days
                      </div>
                      <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content shadow-lg shadow-green-400/20">
                        <span className="countdown font-mono text-5xl ">
                          <span
                            style={
                              {
                                "--value": countdownValues.hours,
                              } as React.CSSProperties
                            }
                          ></span>
                        </span>
                        hours
                      </div>
                      <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content shadow-lg shadow-green-400/20">
                        <span className="countdown font-mono text-5xl ">
                          <span
                            style={
                              {
                                "--value": countdownValues.minutes,
                              } as React.CSSProperties
                            }
                          ></span>
                        </span>
                        min
                      </div>
                      <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content shadow-lg shadow-green-400/20">
                        <span className="countdown font-mono text-5xl ">
                          <span
                            style={
                              {
                                "--value": countdownValues.seconds,
                              } as React.CSSProperties
                            }
                          ></span>
                        </span>
                        sec
                      </div>
                    </div>
                  </>
                ) : (
                  <p>No upcoming meetings.</p>
                )}
              </>
            ) : (
              <p className="text-center">
                Please sign in to see upcoming meetings.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Home;
