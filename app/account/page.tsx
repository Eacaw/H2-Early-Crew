"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { getInitials } from "@/lib/utils";
import { VotingHeatmap } from "@/components/voting-heatmap";
import { VotingPreferencesChart } from "@/components/voting-preferences-chart";
import { Mail, Calendar, Vote } from "lucide-react";

export default function AccountPage() {
  const { user, loading } = useAuth() as {
    user: import("firebase/auth").User | null;
    loading: boolean;
  };
  const router = useRouter();
  type UserData = {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    createdAt: string;
    uid: string;
  };
  const [userData, setUserData] = useState<UserData | null>(null);
  const [votingData, setVotingData] = useState({
    totalVotes: 0,
    votesByRecipient: {},
    votesByDate: {},
  });
  const [votesForUser, setVotesForUser] = useState<Record<string, number>>({});
  const [votesForUserNames, setVotesForUserNames] = useState<
    Record<string, number>
  >({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        // Get user data including creation time
        setUserData({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt: user.metadata.creationTime,
          uid: user.uid,
        });

        // Fetch all meetings where the user has voted
        const meetingsQuery = query(
          collection(db, "meetings"),
          orderBy("startTime", "desc")
        );

        const meetingsSnapshot = await getDocs(meetingsQuery);

        let totalVotes = 0;
        const votesByRecipient = {};
        const votesByDate = {};
        const votesForUserCount: Record<string, number> = {};

        meetingsSnapshot.forEach((doc) => {
          const meeting = doc.data();
          const votes = meeting.votes || [];

          // Find votes by this user
          const userVotes = Object.entries(votes)
            .filter(([voterId]) => voterId === user.uid)
            .map(([, recipientEmail]) => ({ email: recipientEmail }));

          userVotes.forEach((vote) => {
            totalVotes++;

            // Count votes by recipient
            votesByRecipient[vote.email] =
              (votesByRecipient[vote.email] || 0) + 1;

            // Count votes by date (using the meeting date)
            const meetingDate = format(
              new Date(meeting.startTime),
              "yyyy-MM-dd"
            );
            votesByDate[meetingDate] = (votesByDate[meetingDate] || 0) + 1;
          });

          // Count votes for the user
          Object.entries(votes).forEach(([voterUid, votedForEmail]) => {
            if (votedForEmail === user.email) {
              votesForUserCount[voterUid] =
                (votesForUserCount[voterUid] || 0) + 1;
            }
          });
        });

        setVotingData({
          totalVotes,
          votesByRecipient,
          votesByDate,
        });

        setVotesForUser(votesForUserCount);

        // Fetch user display names for those who voted for this user
        const userIds = Object.keys(votesForUserCount);
        const usersSnapshot = await getDocs(collection(db, "users"));
        const uidToName: Record<string, string> = {};
        usersSnapshot.forEach((userDoc) => {
          const data = userDoc.data();
          if (data && data.displayName && userIds.includes(userDoc.id)) {
            uidToName[userDoc.id] = data.displayName;
          }
        });
        // Map to displayName: count
        const votesForUserNamesObj: Record<string, number> = {};
        Object.entries(votesForUserCount).forEach(([uid, count]) => {
          const name = uidToName[uid] || uid;
          votesForUserNamesObj[name] = count;
        });
        setVotesForUserNames(votesForUserNamesObj);

        setDataLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setDataLoading(false);
      }
    };

    fetchUserData();
  }, [user, loading, router]);

  if (loading || dataLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!userData) return null;

  // Get top voted person
  let topVotedPerson = { email: "None", count: 0 };
  Object.entries(votingData.votesByRecipient).forEach(([email, count]) => {
    if (count > topVotedPerson.count) {
      topVotedPerson = { email, count: count as number };
    }
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-white">Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-2 border-green-800">
              <AvatarImage
                src={userData.photoURL || ""}
                alt={userData.displayName}
              />
              <AvatarFallback className="bg-green-900 text-green-300 text-2xl">
                {getInitials(userData.displayName)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <h2 className="text-xl font-bold">{userData.displayName}</h2>
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mr-1" />
                <span>{userData.email}</span>
              </div>
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  Joined {format(new Date(userData.createdAt), "MMMM d, yyyy")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voting Stats Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Voting Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-green-500">
                  {votingData.totalVotes}
                </div>
                <div className="text-sm text-muted-foreground flex items-center">
                  <Vote className="h-4 w-4 mr-1" />
                  Total Votes Cast
                </div>
              </div>

              <div className="bg-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center">
                <div className="text-xl font-bold text-green-500 truncate max-w-full">
                  {topVotedPerson.email.split("@")[0]}
                </div>
                <div className="text-sm text-muted-foreground">
                  Most Voted For ({topVotedPerson.count} times)
                </div>
              </div>
            </div>

            <Tabs defaultValue="chart">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chart">Voting Preferences</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="pt-4">
                <VotingPreferencesChart
                  votesByRecipient={votingData.votesByRecipient}
                  votesForUser={votesForUserNames}
                />
              </TabsContent>

              <TabsContent value="raw" className="pt-4">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="text-left py-2 px-4">Person</th>
                        <th className="text-right py-2 px-4">Votes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(votingData.votesByRecipient)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([email, count]) => (
                          <tr key={email} className="border-b border-zinc-800">
                            <td className="py-2 px-4 truncate">
                              {email.split("@")[0]}
                            </td>
                            <td className="text-right py-2 px-4">{count}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Voting Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Voting Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <VotingHeatmap votesByDate={votingData.votesByDate} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
