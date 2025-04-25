"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Leaderboard } from "@/components/leaderboard";
import { MetricCards } from "@/components/metric-cards";
import { VotingPanel } from "@/components/voting-panel";
import { UpcomingMeeting } from "@/components/upcoming-meeting";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type Vote = {
  email: string;
  // Add other properties if needed
};

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalVotes: 0,
    topWinner: { displayName: "Loading...", wins: 0 },
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Get total users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const totalUsers = usersSnapshot.size - 1;

        // Calculate total votes across all meetings
        const meetingsSnapshot = await getDocs(collection(db, "meetings"));
        let totalVotes = 0;
        meetingsSnapshot.forEach((doc) => {
          const meeting = doc.data();
          if (meeting.votes) {
            totalVotes += Object.keys(meeting.votes).length;
          }
        });

        // Find top winner
        const usersWithWins = usersSnapshot.docs.map((doc) => {
          const userData = doc.data();
          // Ensure displayName and email are included for each user
          return {
            ...userData,
            email: userData.email || doc.id,
            displayName: userData.displayName || "Unknown",
            wins: 0, // We'll calculate this in the next step
          };
        });

        // Count wins for each user
        for (const user of usersWithWins) {
          const winnerQuery = query(
            collection(db, "meetings"),
            where("winner", "==", user.email)
          );
          const winnerSnapshot = await getDocs(winnerQuery);
          user.wins = winnerSnapshot.size;
        }

        // Sort by wins to find top winner
        usersWithWins.sort((a, b) => b.wins - a.wins);
        const topWinner =
          usersWithWins.length > 0
            ? {
                displayName: usersWithWins[0].displayName,
                wins: usersWithWins[0].wins,
              }
            : { displayName: "No winners yet", wins: 0 };

        setMetrics({
          totalUsers,
          totalVotes,
          topWinner,
        });
        setDataLoading(false);
      } catch (error) {
        console.error("Error fetching metrics:", error);
        setDataLoading(false);
      }
    };

    if (!loading && user) {
      fetchMetrics();
    }
  }, [user, loading]);

  // Check for meetings without winners and determine winners
  useEffect(() => {
    const determineWinners = async () => {
      try {
        const now = Date.now();
        const pastMeetingsQuery = query(
          collection(db, "meetings"),
          where("votingEndTime", "<", now),
          where("winner", "==", null)
        );

        const pastMeetingsSnapshot = await getDocs(pastMeetingsQuery);

        // Process each meeting without a winner
        pastMeetingsSnapshot.forEach(async (doc) => {
          const meeting = doc.data();
          const votes = meeting.votes || [];

          // Count votes for each participant
          const voteCounts: { [email: string]: number } = {};
          votes.forEach((vote: Vote) => {
            voteCounts[vote.email] = (voteCounts[vote.email] || 0) + 1;
          });

          // Find the maximum vote count
          let maxVotes = 0;
          Object.values(voteCounts).forEach((count) => {
            maxVotes = Math.max(maxVotes, count as number);
          });

          // Find all participants with the maximum vote count (could be multiple in case of a tie)
          const winners = Object.entries(voteCounts)
            .filter(([_, count]) => count === maxVotes)
            .map(([email]) => email);

          // Update the meeting with the winner(s)
          await updateDoc(doc.ref, {
            winner: winners.length === 1 ? winners[0] : winners,
          });
        });
      } catch (error) {
        console.error("Error determining winners:", error);
      }
    };

    if (!loading && user) {
      determineWinners();
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-white">
        H2 Early Crew Dashboard
      </h1>

      <MetricCards
        totalUsers={metrics.totalUsers}
        totalVotes={metrics.totalVotes}
        topWinner={metrics.topWinner}
        loading={dataLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <UpcomingMeeting />
          <VotingPanel />
        </div>

        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>
          <TabsContent value="leaderboard" className="mt-4">
            <Leaderboard />
          </TabsContent>
          <TabsContent value="progress" className="mt-4">
            <Leaderboard showProgress={true} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
