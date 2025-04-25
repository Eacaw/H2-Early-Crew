"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";

type NewMeetingModalProps = {
  open: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  initialTime?: number | null;
};

export const participantEmails = {
  Rick: "rspencer@certinia.com",
  Dave: "dpinchen@certinia.com",
  Alex: "alenthall@certinia.com",
  Lilia: "lfisk@certinia.com",
  Mihai: "magache@certinia.com",
  Anne: "ashields@certinia.com",
  Wordie: "award@certinia.com",
  Gemma: "lyim@certinia.com",
};

export function NewMeetingModal({
  open,
  onClose,
  initialDate = null,
  initialTime = null,
}: NewMeetingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [meetingName, setMeetingName] = useState("");
  const [date, setDate] = useState(initialDate || new Date());
  const [time, setTime] = useState(initialTime ? `${initialTime}:00` : "09:00");
  const [repeatFrequency, setRepeatFrequency] = useState("once");
  const [repeatCount, setRepeatCount] = useState(4);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  interface TimeChangeEvent {
    target: { value: string };
  }

  const handleTimeChange = (e: TimeChangeEvent) => {
    setTime(e.target.value);
  };

  const toggleParticipant = (email: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleSubmit = async () => {
    if (!meetingName) {
      toast({
        title: "Meeting name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Use selectedParticipants as the participant list
      const validParticipants = selectedParticipants;

      if (validParticipants.length === 0) {
        toast({
          title: "At least one participant is required",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Create meeting date from selected date and time
      const [hours, minutes] = time.split(":").map(Number);
      const meetingDate = new Date(date);
      meetingDate.setHours(hours, minutes, 0, 0);

      // Calculate voting window (5 minutes before and after)
      const votingStartTime = new Date(meetingDate);
      votingStartTime.setMinutes(votingStartTime.getMinutes() - 5);

      const votingEndTime = new Date(meetingDate);
      votingEndTime.setMinutes(votingEndTime.getMinutes() + 5);

      // Base meeting object
      const baseMeeting = {
        meetingName,
        participants: validParticipants,
        startTime: meetingDate.getTime(),
        votingStartTime: votingStartTime.getTime(),
        votingEndTime: votingEndTime.getTime(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        votes: [],
        winner: null,
      };

      // Handle different repeat frequencies
      if (repeatFrequency === "once") {
        // Just add a single meeting
        await addDoc(collection(db, "meetings"), baseMeeting);
      } else {
        // Add multiple meetings based on repeat frequency
        const meetings = [];

        // Create the first meeting
        meetings.push({ ...baseMeeting });

        // Create additional meetings based on repeat count
        for (let i = 1; i < repeatCount; i++) {
          const nextMeetingDate = new Date(meetingDate);

          // Adjust date based on repeat frequency
          switch (repeatFrequency) {
            case "weekly":
              nextMeetingDate.setDate(nextMeetingDate.getDate() + 7 * i);
              break;
            case "monthly":
              nextMeetingDate.setMonth(nextMeetingDate.getMonth() + i);
              break;
            case "weekday":
              // Skip to next weekday (Monday-Friday)
              let daysToAdd = i;
              let currentDay = meetingDate.getDay();

              for (let j = 0; j < daysToAdd; j++) {
                currentDay = (currentDay + 1) % 7;
                // If it's a weekend, add extra days
                if (currentDay === 0 || currentDay === 6) {
                  daysToAdd++;
                }
              }

              nextMeetingDate.setDate(nextMeetingDate.getDate() + daysToAdd);
              break;
            case "biweekly":
              nextMeetingDate.setDate(nextMeetingDate.getDate() + 14 * i);
              break;
            case "fourweekly":
              nextMeetingDate.setDate(nextMeetingDate.getDate() + 28 * i);
              break;
          }

          // Calculate voting window for this meeting
          const nextVotingStartTime = new Date(nextMeetingDate);
          nextVotingStartTime.setMinutes(nextVotingStartTime.getMinutes() - 5);

          const nextVotingEndTime = new Date(nextMeetingDate);
          nextVotingEndTime.setMinutes(nextVotingEndTime.getMinutes() + 5);

          meetings.push({
            ...baseMeeting,
            startTime: nextMeetingDate.getTime(),
            votingStartTime: nextVotingStartTime.getTime(),
            votingEndTime: nextVotingEndTime.getTime(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }

        // Add all meetings to the database
        for (const meeting of meetings) {
          await addDoc(collection(db, "meetings"), meeting);
        }
      }

      toast({
        title: "Meeting created successfully",
        description:
          repeatFrequency === "once"
            ? "Your meeting has been scheduled"
            : `${repeatCount} meetings have been scheduled`,
      });

      onClose();
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast({
        title: "Error creating meeting",
        description:
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Meeting</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="meeting-name">Meeting Name</Label>
            <Input
              id="meeting-name"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              placeholder="Weekly Team Standup"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      if (selectedDate) setDate(selectedDate);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">Time</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={handleTimeChange}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Repeat</Label>
            <RadioGroup
              value={repeatFrequency}
              onValueChange={setRepeatFrequency}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="once" id="once" />
                <Label htmlFor="once">Once</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly">Weekly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="biweekly" id="biweekly" />
                <Label htmlFor="biweekly">Every 2 Weeks</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fourweekly" id="fourweekly" />
                <Label htmlFor="fourweekly">Every 4 Weeks</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly">Monthly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekday" id="weekday" />
                <Label htmlFor="weekday">Every Weekday</Label>
              </div>
            </RadioGroup>
          </div>

          {repeatFrequency !== "once" && (
            <div className="grid gap-2">
              <Label htmlFor="repeat-count">Number of Occurrences</Label>
              <Input
                id="repeat-count"
                type="number"
                min="2"
                max="52"
                value={repeatCount}
                onChange={(e) =>
                  setRepeatCount(Number.parseInt(e.target.value))
                }
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label>Participants</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(participantEmails).map(([name, email]) => (
                <button
                  key={email}
                  type="button"
                  className={`py-2 px-4 rounded-full text-sm font-medium ${
                    selectedParticipants.includes(email)
                      ? "bg-green-500 hover:bg-green-700 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onClick={() => toggleParticipant(email)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-green-700 hover:bg-green-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
