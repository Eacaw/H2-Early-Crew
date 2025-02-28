import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "@/firebase";
import {
  fetchUserData,
  fetchNextMeeting,
  fetchTotalVotes,
  fetchMostVotedPerson,
  fetchMostWinsPerson,
} from "@/firebase/queries";

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const [user, setUser] = useState(auth.currentUser);
  const [userData, setUserData] = useState(null);
  const [nextMeeting, setNextMeeting] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [mostVotedPerson, setMostVotedPerson] = useState(null);
  const [mostWinsPerson, setMostWinsPerson] = useState(null);

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

        const totalVotesData = await fetchTotalVotes();
        setTotalVotes(totalVotesData);

        const mostVotedPersonData = await fetchMostVotedPerson();
        setMostVotedPerson(mostVotedPersonData);

        const mostWinsPersonData = await fetchMostWinsPerson();
        setMostWinsPerson(mostWinsPersonData);
      }
    };

    fetchData();
  }, [user]);

  return (
    <DataContext.Provider
      value={{
        user,
        userData,
        nextMeeting,
        totalVotes,
        mostVotedPerson,
        mostWinsPerson,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
