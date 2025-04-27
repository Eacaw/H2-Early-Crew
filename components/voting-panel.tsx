"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Vote, Lock, CheckCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { cn } from "@/lib/utils";

export function VotingPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [votingStatus, setVotingStatus] = useState("locked"); // locked, unlocked, voted
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [userVote, setUserVote] = useState(null);

  useEffect(() => {
    const fetchActiveMeeting = async () => {
      try {
        const now = Date.now();

        // Query for a meeting that is currently in its voting window
        const meetingsQuery = query(
          collection(db, "meetings"),
          where("votingStartTime", "<=", now),
          where("votingEndTime", ">=", now),
          orderBy("votingStartTime", "desc"),
          limit(1)
        );

        const meetingsSnapshot = await getDocs(meetingsQuery);

        if (!meetingsSnapshot.empty) {
          const meetingData = {
            id: meetingsSnapshot.docs[0].id,
            ...meetingsSnapshot.docs[0].data(),
          };
          setActiveMeeting(meetingData);

          // Check if user has already voted
          const userHasVoted = meetingData.votes?.some(
            (vote) => vote.userId === user.uid
          );

          if (userHasVoted) {
            setVotingStatus("voted");
            // Find the user's vote
            const vote = meetingData.votes.find(
              (vote) => vote.userId === user.uid
            );
            setUserVote(vote.email);
          } else {
            setVotingStatus("unlocked");
          }

          // Fetch participant details
          const participantEmails = meetingData.participants || [];
          const participantDetails = [];

          for (const email of participantEmails) {
            // Query user by email
            const userQuery = query(
              collection(db, "users"),
              where("email", "==", email),
              limit(1)
            );

            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
              const userData = userSnapshot.docs[0].data();
              participantDetails.push({
                email,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
              });
            } else {
              // If user not found, just use the email
              participantDetails.push({
                email,
                displayName: email.split("@")[0],
                photoURL: null,
              });
            }
          }

          setParticipants(participantDetails);
        } else {
          // No active meeting
          setVotingStatus("locked");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching active meeting:", error);
        setLoading(false);
      }
    };

    if (user) {
      fetchActiveMeeting();
    }

    // Set up interval to check for active meetings
    const interval = setInterval(() => {
      if (user) {
        fetchActiveMeeting();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const handleVote = async () => {
    if (!selectedParticipant) {
      toast({
        title: "Please select a participant",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update the meeting document with the user's vote
      const meetingRef = doc(db, "meetings", activeMeeting.id);

      await updateDoc(meetingRef, {
        votes: arrayUnion({
          userId: user.uid,
          email: selectedParticipant,
        }),
      });

      // Update local state
      setVotingStatus("voted");
      setUserVote(selectedParticipant);

      toast({
        title: "Vote submitted successfully",
        description: "Your vote has been recorded",
      });
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast({
        title: "Error submitting vote",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Voting Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Vote className="h-5 w-5 mr-2 text-green-600" />
          Voting Panel
        </CardTitle>
      </CardHeader>
      <CardContent>
        {votingStatus === "locked" && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Lock className="h-10 w-10 mb-2 text-muted-foreground/60" />
            <p className="text-muted-foreground">Voting is currently closed</p>
            <p className="text-xs text-muted-foreground mt-2">
              Voting opens 5 minutes before the meeting starts
            </p>
          </div>
        )}

        {votingStatus === "unlocked" && activeMeeting && (
          <div className="space-y-4">
            <p className="text-sm">
              Who arrived first at{" "}
              <span className="font-medium">{activeMeeting.meetingName}</span>?
            </p>

            <div className="grid grid-cols-2 gap-2">
              {participants.map((participant) => (
                <Button
                  key={participant.email}
                  variant="outline"
                  className={cn(
                    "justify-start h-auto py-2 px-3",
                    selectedParticipant === participant.email &&
                      "border-green-600 bg-green-900/20"
                  )}
                  onClick={() => setSelectedParticipant(participant.email)}
                >
                  <div className="flex items-center">
                    {selectedParticipant === participant.email && (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    )}
                    <span>{participant.displayName}</span>
                  </div>
                </Button>
              ))}
            </div>

            <Button
              className="w-full bg-green-700 hover:bg-green-600"
              onClick={handleVote}
              disabled={!selectedParticipant}
            >
              Submit Vote
            </Button>
          </div>
        )}

        {votingStatus === "voted" && (
          <div className="space-y-4">
            <div className="bg-green-900/20 p-4 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              <div>
                <p className="font-medium">Vote submitted</p>
                <p className="text-sm text-muted-foreground">
                  You voted for{" "}
                  {participants.find((p) => p.email === userVote)
                    ?.displayName || userVote}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Results will be calculated after voting ends
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
