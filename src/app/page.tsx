"use client";

import { auth, firestore } from "@/firebase";
import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { participantEmails } from "@/app/constants";

function Home() {
  interface Meeting {
    meetingName: string;
    startTime: number;
    votingStartTime: number;
    votingEndTime: number;
    participants: string[];
    votes?: { [userId: string]: string };
  }

  const [user, setUser] = useState(auth.currentUser);
  const [nextMeetingId, setNextMeetingId] = useState<string>("");
  const [nextMeeting, setNextMeeting] = useState<Meeting | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votingStatus, setVotingStatus] = useState<
    "before" | "during" | "after"
  >("before");

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

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const nextMeetingData = querySnapshot.docs[0].data();
          setNextMeetingId(querySnapshot.docs[0].id);
          setNextMeeting(nextMeetingData);
          if (nextMeetingData.votes && nextMeetingData.votes[user.uid]) {
            setHasVoted(true);
          } else {
            setHasVoted(false);
          }

          // Determine voting status
          const nowTime = now.getTime();
          const votingStartTime = new Date(
            nextMeetingData.votingStartTime
          ).getTime();
          const votingEndTime = new Date(
            nextMeetingData.votingEndTime
          ).getTime();

          if (nowTime < votingStartTime) {
            setVotingStatus("before");
          } else if (nowTime >= votingStartTime && nowTime < votingEndTime) {
            setVotingStatus("during");
          } else {
            setVotingStatus("after");
          }
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
        let targetTime;
        let countdownText;

        if (votingStatus === "before") {
          targetTime = new Date(nextMeeting.votingStartTime).getTime();
        } else if (votingStatus === "during") {
          targetTime = new Date(nextMeeting.votingEndTime).getTime();
        } else {
          setCountdown(0);
          return;
        }

        const now = new Date().getTime();
        const difference = targetTime - now;

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
  }, [nextMeeting, votingStatus]);

  const formatCountdown = (countdownValue: number | null) => {
    if (countdownValue === null)
      return { days: "00", hours: "00", minutes: "00", seconds: "00" };
    if (countdownValue <= 0)
      return { days: "00", hours: "00", minutes: "00", seconds: "00" };

    const days = Math.floor(countdownValue / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (countdownValue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
      (countdownValue % (1000 * 60 * 60)) / (1000 * 60)
    );
    const seconds = Math.floor((countdownValue % (1000 * 60)) / 1000);

    return {
      days: String(days).padStart(2, "0"),
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
    };
  };

  const countdownValues = formatCountdown(countdown);

  const handleVote = async (votedFor: string) => {
    if (!user || !nextMeeting) return;

    console.log("nextMeeting :", nextMeeting);
    console.log("nextMeetingId :", nextMeetingId);
    const meetingDocRef = doc(firestore, "meetings", nextMeetingId);
    console.log("meetingDocRef :", meetingDocRef);
    console.log("Voted for:", votedFor);

    try {
      await updateDoc(meetingDocRef, {
        votes: { ...nextMeeting.votes, [user.uid]: votedFor },
      });
      setHasVoted(true);
      console.log("Vote submitted successfully!");
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  let countdownMessage = "Voting starts in:";
  if (votingStatus === "during") {
    countdownMessage = "Voting ends in:";
  } else if (votingStatus === "after") {
    countdownMessage = "Voting has ended!";
  }

  return (
    <main className="container mx-auto py-8">
      <div className="bg-gray-800 shadow-2xl shadow-grey-400/20 rounded-2xl p-4 text-white h-full relative">
        <div className="flex flex-row">
          {/* Main Card */}
          <div className="p-8 w-1/2">
            {/* overlay mask with lock svg when the timer is not yet up */}
            {countdown !== null &&
              countdown > 0 &&
              votingStatus === "before" && (
                <div className="absolute top-0 left-0 w-1/2 h-full bg-gray-900 bg-opacity-60 flex items-center justify-center z-10">
                  <img
                    src="/locked-padlock.svg"
                    alt="Lock"
                    className="w-36 h-36 filter-white"
                  />
                </div>
              )}
            <h1 className="text-2xl font-bold mb-4">
              Welcome to H2 Early Crew!
            </h1>
            {user && nextMeeting ? (
              <div className="flex flex-col items-center mt-20 relative">
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(participantEmails).map(([name, email]) => (
                    <button
                      key={email}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2 mb-2 w-full relative"
                      onClick={() => handleVote(email)}
                      disabled={
                        hasVoted ||
                        !nextMeeting ||
                        countdown === null ||
                        countdown >= 0
                      }
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <h2 className="text-2xl font-semibold mt-4 text-gray-600 text-center relative">
                  Cast your vote!
                </h2>
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
          <div className="p-8 flex flex-col items-center mx-auto">
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
                      {countdownMessage}
                    </p>
                    <div className="grid grid-flow-col gap-5 text-center auto-cols-max">
                      <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content shadow-xl shadow-grey-400/20">
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
                      <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content shadow-xl shadow-grey-400/20">
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
                      <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content shadow-xl shadow-grey-400/20">
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
                      <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content shadow-xl shadow-grey-400/20">
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
