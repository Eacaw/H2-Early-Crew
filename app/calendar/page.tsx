"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
// ...rest of your imports

export default function CalendarPage() {
  // ...existing code

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if we're at /calendar (not a sub-route)
    if (pathname === "/calendar") {
      const now = new Date();
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - now.getDay());
      const month = sunday.getMonth() + 1; // JS months are 0-based
      const day = sunday.getDate();
      router.replace(`/calendar/${month}/${day}`);
    }
  }, [pathname, router]);

  return (
    <>
      {pathname === "/calendar" ? (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,64,32,0.2)", // transparent deep green
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <span>Loading calendar...</span>
        </div>
      ) : (
        // Render your actual calendar content here
        <div>
          <span>Loading calendar...</span>
        </div>
      )}
    </>
  );
}
