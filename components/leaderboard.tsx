"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LeaderboardUser = {
  id: string;
  email: string;
  wins: number;
  displayName?: string;
  photoURL?: string;
};

export function Leaderboard({ showProgress = false }) {
  // Define a type for the user object if not already defined
  type AuthUser = {
    uid: string;
    email?: string;
    displayName?: string;
    photoURL?: string;
  };

  const { user } = useAuth() as { user: AuthUser | null };
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxWins, setMaxWins] = useState(0);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Get all users
        const usersRef = collection(db, "users");
        const usersQuery = query(
          usersRef,
          where("email", "!=", "davidpinchen@gmail.com")
        );
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          email: doc.data().email,
          wins: 0,
        }));

        // For each user, count their wins
        for (const userData of usersData) {
          const winnerQuery = query(
            collection(db, "meetings"),
            where("winner", "==", userData.email)
          );
          const winnerSnapshot = await getDocs(winnerQuery);
          userData.wins = winnerSnapshot.size;
        }

        // Sort by wins (descending)
        usersData.sort((a, b) => b.wins - a.wins);

        // Find max wins for progress bar
        const maxUserWins = usersData.length > 0 ? usersData[0].wins : 0;
        setMaxWins(maxUserWins > 0 ? maxUserWins : 10); // Default to 10 if no wins yet

        setUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setLoading(false);
      }
    };

    if (user) {
      fetchLeaderboard();
    }
  }, [user]);

  interface GetInitials {
    (name?: string): string;
  }

  const getInitials: GetInitials = (name) => {
    if (!name) return "U";
    const nameParts = name.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };

  interface RankIconProps {
    index: number;
  }

  const getRankIcon = (index: number): React.ReactElement => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-sm font-medium">{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                {showProgress && <Skeleton className="h-2 w-full" />}
              </div>
              <Skeleton className="h-6 w-6" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No data available yet
          </div>
        ) : (
          users.map((userData, index) => (
            <div
              key={userData.id}
              className={cn(
                "flex items-center space-x-4 p-2 rounded-lg",
                userData.id === user?.uid && "bg-green-900/20"
              )}
            >
              <Avatar className="h-10 w-10 border border-green-800">
                <AvatarImage
                  src={userData.photoURL || ""}
                  alt={userData.displayName}
                />
                <AvatarFallback className="bg-green-900 text-green-300">
                  {getInitials(userData.displayName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{userData.displayName}</div>
                  <div className="font-semibold text-green-600">
                    {userData.wins} wins
                  </div>
                </div>

                {showProgress && (
                  <Progress
                    value={(userData.wins / maxWins) * 100}
                    className="h-2 mt-2"
                  />
                )}
              </div>

              <div className="flex items-center justify-center w-8 h-8">
                {getRankIcon(index)}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
