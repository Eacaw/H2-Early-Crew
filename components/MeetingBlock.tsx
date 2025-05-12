import React from "react";
import { format } from "date-fns";
import { Meeting } from "@/types";

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

  const isVotingEnded = meeting.votingEndTime
    ? new Date().getTime() > meeting.votingEndTime
    : false;

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
      {isVotingEnded && (
        <div className="flex mx-auto mt-1 gap-1">
          {meeting.hasVotes ? (
            <span className="bg-green-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              ✓
            </span>
          ) : (
            <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              ✗
            </span>
          )}
          <span className="bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {Object.keys(meeting.votes).length ?? 0}
          </span>
          {meeting.winnerAvatarUrl && (
            <img
              src={meeting.winnerAvatarUrl}
              alt="W"
              className="w-4 h-4 rounded-full"
            />
          )}
        </div>
      )}
    </div>
  );
}
