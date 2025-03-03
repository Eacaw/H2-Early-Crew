"use client";

import { auth } from "@/firebase";
import {
  fetchAllUsersWithWins,
  fetchMostRecentMeetings,
  fetchMostVotedPerson,
  fetchMostWinsPerson,
  fetchNextMeeting,
  fetchNextTwoMeetings,
  fetchTotalUsers,
  fetchTotalVotes,
  fetchUserData,
} from "@/firebase/queries";
import { createContext, useContext, useEffect, useState } from "react";

interface DataContextProps {
  user: any;
  userData: any;
  nextMeeting: any;
  nextTwoMeetings: any[];
  mostRecentMeeting: any;
  totalVotes: number;
  totalUsers: number;
  mostVotedPerson: any;
  mostWinsPerson: any;
  allUsersWithWins: any[];
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(auth.currentUser);
  const [userData, setUserData] = useState<any>(null);
  const [nextMeeting, setNextMeeting] = useState<any>(null);
  const [nextTwoMeetings, setNextTwoMeetings] = useState<any[]>([]);
  const [mostRecentMeeting, setMostRecentMeeting] = useState<any>(null);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [mostVotedPerson, setMostVotedPerson] = useState<any>(null);
  const [mostWinsPerson, setMostWinsPerson] = useState<any>(null);
  const [allUsersWithWins, setAllUsersWithWins] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const userData = await fetchUserData(user.uid);
        setUserData(userData);

        const nextMeetingData = await fetchNextMeeting();
        setNextMeeting(nextMeetingData);

        const nextTwoMeetingsData = await fetchNextTwoMeetings();
        setNextTwoMeetings(nextTwoMeetingsData);

        const mostRecentMeetingData = await fetchMostRecentMeetings();
        setMostRecentMeeting(mostRecentMeetingData);

        const totalVotesData = await fetchTotalVotes();
        setTotalVotes(totalVotesData);

        const mostVotedPersonData = await fetchMostVotedPerson();
        setMostVotedPerson(mostVotedPersonData);

        const mostWinsPersonData = await fetchMostWinsPerson();
        setMostWinsPerson(mostWinsPersonData);

        const totalUsersData = await fetchTotalUsers();
        setTotalUsers(totalUsersData);

        const allUsersWithWinsData = await fetchAllUsersWithWins();
        setAllUsersWithWins(allUsersWithWinsData);
      }
    };

    fetchData();
  }, [user]);

  const value: DataContextProps = {
    user,
    userData,
    nextMeeting,
    nextTwoMeetings,
    mostRecentMeeting,
    totalVotes,
    totalUsers,
    mostVotedPerson,
    mostWinsPerson,
    allUsersWithWins,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
