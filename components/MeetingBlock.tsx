import React from "react";
import { format } from "date-fns";

type Meeting = {
  id: string | number;
  meetingName: string;
  startTime: number;
  [key: string]: any;
};

export function MeetingBlock({
  meeting,
  onEdit,
}: {
  meeting: Meeting;
  onEdit: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  return (
    <div
      className="bg-green-900/30 text-green-300 p-1 text-xs rounded mb-1 overflow-hidden text-ellipsis cursor-pointer flex flex-col z-10 relative"
      onClick={handleClick}
      title={meeting.meetingName}
      style={{ zIndex: 10 }}
    >
      <span className="font-semibold">{meeting.meetingName}</span>
      <span className="text-green-400 text-[10px]">
        {format(new Date(meeting.startTime), "h:mm a")}
      </span>
    </div>
  );
}
