"use client";

import { auth, firestore } from "@/firebase";
import { collection, query, orderBy, where, getDocs } from "firebase/firestore";
import React, { useState, useEffect } from "react";

function Home() {
  const [user, setUser] = useState(auth.currentUser);
  const [nextMeeting, setNextMeeting] = useState<any>(null);

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

  return (
    <main className="container mx-auto py-8">
      <div className="bg-gray-800 shadow-2xl shadow-green-400/20 rounded-2xl p-4 text-white">
        <div className="flex flex-row ">
          {/* Main Card */}
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">
              Welcome to Eager Beaver!
            </h1>
            <p className="text-gray-300">
              This is a meeting scheduler application designed to make it easier
              for teams to coordinate and schedule meetings efficiently.
            </p>
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
                  </>
                ) : (
                  <p>No upcoming meetings.</p>
                )}
                <h2 className="text-2xl font-semibold mt-4 -mb-6 text-gray-600">
                  Next Meeting
                </h2>
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
