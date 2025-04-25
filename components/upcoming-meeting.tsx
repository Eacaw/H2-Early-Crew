"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, Calendar } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore"
import { formatDistanceToNow, format } from "date-fns"

export function UpcomingMeeting() {
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState("")
  const [votingStatus, setVotingStatus] = useState("not-started") // not-started, active, ended

  useEffect(() => {
    const fetchUpcomingMeeting = async () => {
      try {
        const now = Date.now()

        // Query for the next upcoming meeting
        const meetingsQuery = query(
          collection(db, "meetings"),
          where("startTime", ">", now),
          orderBy("startTime"),
          limit(1),
        )

        const meetingsSnapshot = await getDocs(meetingsQuery)

        if (!meetingsSnapshot.empty) {
          const meetingData = {
            id: meetingsSnapshot.docs[0].id,
            ...meetingsSnapshot.docs[0].data(),
          }
          setMeeting(meetingData)
        } else {
          // If no upcoming meetings, check for current meeting (started but not ended)
          const currentMeetingQuery = query(
            collection(db, "meetings"),
            where("startTime", "<=", now),
            where("votingEndTime", ">", now),
            orderBy("startTime", "desc"),
            limit(1),
          )

          const currentMeetingSnapshot = await getDocs(currentMeetingQuery)

          if (!currentMeetingSnapshot.empty) {
            const meetingData = {
              id: currentMeetingSnapshot.docs[0].id,
              ...currentMeetingSnapshot.docs[0].data(),
            }
            setMeeting(meetingData)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching upcoming meeting:", error)
        setLoading(false)
      }
    }

    fetchUpcomingMeeting()

    // Set up interval to update time remaining
    const interval = setInterval(() => {
      if (meeting) {
        updateTimeAndStatus()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Update time remaining and voting status whenever meeting changes
  useEffect(() => {
    if (meeting) {
      updateTimeAndStatus()
    }
  }, [meeting])

  const updateTimeAndStatus = () => {
    if (!meeting) return

    const now = Date.now()
    const votingStartTime = meeting.votingStartTime || meeting.startTime - 5 * 60 * 1000 // 5 minutes before
    const votingEndTime = meeting.votingEndTime || meeting.startTime + 5 * 60 * 1000 // 5 minutes after

    // Determine voting status
    if (now < votingStartTime) {
      setVotingStatus("not-started")
      const timeToStart = formatDistanceToNow(new Date(votingStartTime), { addSuffix: true })
      setTimeRemaining(`Voting opens ${timeToStart}`)
    } else if (now >= votingStartTime && now <= votingEndTime) {
      setVotingStatus("active")
      const timeToEnd = formatDistanceToNow(new Date(votingEndTime), { addSuffix: true })
      setTimeRemaining(`Voting ends ${timeToEnd}`)
    } else {
      setVotingStatus("ended")
      setTimeRemaining("Voting has ended")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Meeting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!meeting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Meeting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mb-2 text-muted-foreground/60" />
            <p>No upcoming meetings scheduled</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-green-900/20">
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2 text-green-600" />
          Upcoming Meeting
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold">{meeting.meetingName}</h3>
            <p className="text-muted-foreground">
              {format(new Date(meeting.startTime), "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

          <div
            className={`p-3 rounded-lg text-sm font-medium ${
              votingStatus === "active"
                ? "bg-green-900/30 text-green-400"
                : votingStatus === "ended"
                  ? "bg-zinc-800 text-zinc-300"
                  : "bg-amber-900/20 text-amber-300"
            }`}
          >
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              {timeRemaining}
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">{meeting.participants?.length || 0} participants</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
