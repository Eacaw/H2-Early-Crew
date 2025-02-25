"use client";

import { auth, firestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MetricCard from "@/app/components/MetricCard";
import EventForm from "@/app/components/EventForm";

const AdminPage = () => {
  const [user, setUser] = useState(auth.currentUser);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  auth.onAuthStateChanged((user) => {
    setUser(user);
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);

      if (user) {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.isAdmin);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    };

    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (!loading && isAdmin === false) {
      router.push("/");
    }
  }, [isAdmin, loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Redirecting, so don't render anything
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric Card 1 */}
        <MetricCard
          title="Metric 1"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua."
        />

        {/* Metric Card 2 */}
        <MetricCard
          title="Metric 2"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua."
        />

        {/* Metric Card 3 */}
        <MetricCard
          title="Metric 3"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua."
        />
      </div>

      {/* Input Form */}
      <div className="mt-8">
        <EventForm />
      </div>
    </div>
  );
};

export default AdminPage;
