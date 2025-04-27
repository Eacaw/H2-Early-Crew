"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Calendar, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Navbar() {
  const { user, signOut, loading } = useAuth() as {
    user: {
      uid: string;
      displayName?: string;
      photoURL?: string;
      email?: string;
    } | null;
    signOut: () => void;
    loading: boolean;
  };
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [initials, setInitials] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin(userData.isAdmin || false);
            setDisplayName(userData.displayName || user.displayName || "User");

            // Generate initials from display name
            const nameParts = (
              userData.displayName ||
              user.displayName ||
              ""
            ).split(" ");
            if (nameParts.length > 1) {
              setInitials(`${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase());
            } else if (nameParts[0]) {
              setInitials(nameParts[0][0].toUpperCase());
            } else {
              setInitials("U");
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    if (!loading && user) {
      fetchUserData();
    }
  }, [user, loading]);

  const navItems = [
    { href: "/", label: "Dashboard", icon: <Clock className="h-4 w-4 mr-2" /> },
    {
      href: "/calendar",
      label: "Calendar",
      icon: <Calendar className="h-4 w-4 mr-2" />,
    },
  ];

  if (loading || !user) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-2">
            <Clock className="h-6 w-6 text-green-600" />
            <span className="font-bold">H2 Early Crew</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <Clock className="h-6 w-6 text-green-600" />
            <span className="font-bold hidden sm:inline-block">
              H2 Early Crew
            </span>
          </Link>

          <nav className="flex items-center space-x-4 ml-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {isAdmin && (
            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Admin
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8 border border-green-800">
                  <AvatarImage src={user.photoURL || ""} alt={displayName} />
                  <AvatarFallback className="bg-green-900 text-green-300">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center">
                <Link href="/account" className="flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  <span>{displayName}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
