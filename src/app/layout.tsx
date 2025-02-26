import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import { firestore } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

async function declareWinners() {
  const now = Date.now();
  const meetingsCollection = collection(firestore, "meetings");
  const q = query(
    meetingsCollection,
    where("votingEndTime", "<", now),
    where("winnerDeclared", "==", false)
  );

  const querySnapshot = await getDocs(q);

  querySnapshot.forEach(async (meetingDoc) => {
    const meetingData = meetingDoc.data();
    const votes = meetingData.votes || {};

    let winner: string | null = null;
    let maxVotes = 0;
    const voteCounts: { [key: string]: number } = {};

    for (const voter in votes) {
      const votedFor = meetingData.votes[voter];
      voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
      if (voteCounts[votedFor] > maxVotes) {
        maxVotes = voteCounts[votedFor];
        winner = votedFor;
      }
    }

    if (winner) {
      const meetingDocRef = doc(firestore, "meetings", meetingDoc.id);
      await updateDoc(meetingDocRef, {
        winner: winner,
        winnerDeclared: true,
      });
      console.log(`Winner declared for meeting ${meetingDoc.id}: ${winner}`);
    } else {
      console.log(`No votes for meeting ${meetingDoc.id}`);
    }
  });
}

export const metadata: Metadata = {
  title: "H2 Early Crew",
  description: "H2 Early Crew",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await declareWinners();

  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-gray-950 h-screen">
        <Navbar />
        <div className="mx-auto max-w-6xl pt-20">
          <div>{children}</div>
        </div>
      </body>
    </html>
  );
}
