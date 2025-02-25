"use client";
import { auth } from "@/firebase";
import React, { useState } from "react";

function Home() {
  const [user, setUser] = useState(auth.currentUser);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);
  return (
    <main>
      <h1>Welcome to the game!</h1>
      {user ? (
        <p>You are logged in as {user.email}</p>
      ) : (
        <p>Please sign in to continue.</p>
      )}
    </main>
  );
}

export default Home;
