import { firestore } from "@/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from "firebase/firestore";

export const fetchUserData = async (userId: string) => {
  const userDocRef = doc(firestore, "users", userId);
  const userDoc = await getDoc(userDocRef);
  return userDoc.exists() ? userDoc.data() : null;
};

export const fetchNextMeeting = async () => {
  const now = new Date();
  const meetingsCollection = collection(firestore, "meetings");
  const q = query(
    meetingsCollection,
    orderBy("startTime"),
    where("startTime", ">=", now.getTime()),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty ? querySnapshot.docs[0].data() : null;
};

export const fetchMostRecentMeetings = async () => {
  const now = new Date();
  const meetingsCollection = collection(firestore, "meetings");
  const q = query(
    meetingsCollection,
    orderBy("startTime", "desc"),
    where("startTime", "<", now.getTime()),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty ? querySnapshot.docs[0].data() : null;
};

export const fetchTotalUsers = async () => {
  const usersCollection = collection(firestore, "users");
  const querySnapshot = await getDocs(usersCollection);
  return querySnapshot.size;
};

export const fetchTotalVotes = async () => {
  let total = 0;
  const meetingsCollection = collection(firestore, "meetings");
  const querySnapshot = await getDocs(meetingsCollection);

  querySnapshot.forEach((doc) => {
    const meetingData = doc.data();
    if (meetingData.votes) {
      total += Object.keys(meetingData.votes).length;
    }
  });

  return total - 1;
};

export const fetchMostVotedPerson = async () => {
  const meetingsCollection = collection(firestore, "meetings");
  const querySnapshot = await getDocs(meetingsCollection);

  const votesByPerson: { [person: string]: number } = {};

  querySnapshot.forEach((doc) => {
    const meetingData = doc.data();
    if (meetingData.votes) {
      for (const votedFor in meetingData.votes) {
        votesByPerson[votedFor] = (votesByPerson[votedFor] || 0) + 1;
      }
    }
  });

  let topPerson: string | null = null;
  let topVoteCount = 0;

  for (const person in votesByPerson) {
    if (votesByPerson[person] > topVoteCount) {
      topPerson = person;
      topVoteCount = votesByPerson[person];
    }
  }

  return { topPerson, topVoteCount };
};

export const fetchMostWinsPerson = async () => {
  const meetingsCollection = collection(firestore, "meetings");
  const querySnapshot = await getDocs(meetingsCollection);

  const winsByPerson: { [person: string]: number } = {};

  querySnapshot.forEach((doc) => {
    const meetingData = doc.data();
    if (meetingData.winner) {
      winsByPerson[meetingData.winner] =
        (winsByPerson[meetingData.winner] || 0) + 1;
    }
  });

  let topPerson: string | null = null;
  let topWinCount = 0;

  for (const person in winsByPerson) {
    if (winsByPerson[person] > topWinCount) {
      topPerson = person;
      topWinCount = winsByPerson[person];
    }
  }

  return { topPerson, topWinCount };
};

export const fetchNextTwoMeetings = async () => {
  const now = new Date();
  const meetingsCollection = collection(firestore, "meetings");
  const q = query(
    meetingsCollection,
    orderBy("startTime"),
    where("startTime", ">=", now.getTime()),
    limit(2)
  );

  const querySnapshot = await getDocs(q);
  const meetings = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return meetings;
};
