import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

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

type Meeting = {
  id: string | number;
  meetingName: string;
  startTime: number;
  participants?: string[];
  votingStartTime?: number;
  votingEndTime?: number;
  [key: string]: any;
};

export function EditMeetingModal({
  open,
  onClose,
  meeting,
  onMeetingUpdated,
  onMeetingDeleted,
}: {
  open: boolean;
  onClose: () => void;
  meeting: Meeting | null;
  onMeetingUpdated: (updated: Meeting) => void;
  onMeetingDeleted: (id: string | number) => void;
}) {
  const [meetingName, setMeetingName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [votingStartTime, setVotingStartTime] = useState<string>("N/A");
  const [votingEndTime, setVotingEndTime] = useState<string>("N/A");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );

  useEffect(() => {
    if (meeting) {
      setMeetingName(meeting.meetingName || "");
      const dt = new Date(meeting.startTime);
      setDate(dt.toISOString().slice(0, 10));
      setTime(dt.toTimeString().slice(0, 5));
      setSelectedParticipants(meeting.participants || []);
      if (meeting.votingStartTime && meeting.votingEndTime) {
        setVotingStartTime(
          new Date(meeting.votingStartTime).toLocaleTimeString()
        );
        setVotingEndTime(new Date(meeting.votingEndTime).toLocaleTimeString());
      }
    }
  }, [meeting]);

  const updateVotingTimes = (newDate: Date) => {
    const votingStart = new Date(newDate.getTime() - 5 * 60 * 1000);
    const votingEnd = new Date(newDate.getTime() + 5 * 60 * 1000);
    setVotingStartTime(votingStart.toLocaleTimeString());
    setVotingEndTime(votingEnd.toLocaleTimeString());
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (date) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      updateVotingTimes(newDate);
    }
  };

  const toggleParticipant = (email: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleSave = async () => {
    if (!date || !time) return;
    const [hours, minutes] = time.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);

    const updatedMeeting = {
      ...meeting,
      meetingName,
      startTime: newDate.getTime(),
      participants: selectedParticipants,
    };
    // Calculate voting start/end times (5 minutes before/after meeting start)
    const votingStartTimeEpoch = updatedMeeting.startTime - 5 * 60 * 1000;
    const votingEndTimeEpoch = updatedMeeting.startTime + 5 * 60 * 1000;

    await updateDoc(doc(db, "meetings", String(meeting.id)), {
      meetingName: updatedMeeting.meetingName,
      startTime: updatedMeeting.startTime,
      participants: updatedMeeting.participants,
      votingStartTime: votingStartTimeEpoch,
      votingEndTime: votingEndTimeEpoch,
    });

    updatedMeeting.votingStartTime = votingStartTimeEpoch;
    updatedMeeting.votingEndTime = votingEndTimeEpoch;
    onMeetingUpdated(updatedMeeting);
    onClose();
  };

  const handleDelete = async () => {
    await deleteDoc(doc(db, "meetings", String(meeting.id)));
    onMeetingDeleted(meeting.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Meeting</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-xs mb-1">Meeting Name</label>
            <Input
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div>
              <label className="block text-xs mb-1">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Time</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div>
              <label className="block text-xs mb-1">Voting Start Time</label>
              <Input
                type="text"
                value={votingStartTime}
                readOnly
                className="cursor-not-allowed"
                disabled
              />
            </div>
            <div>
              <label className="block text-xs mb-1">Voting End Time</label>
              <Input
                type="text"
                value={votingEndTime}
                readOnly
                className="cursor-not-allowed"
                disabled
              />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1">Participants</label>
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
        <DialogFooter className="flex justify-between mt-4">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
          <div>
            <Button variant="outline" onClick={onClose} className="mr-2">
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
