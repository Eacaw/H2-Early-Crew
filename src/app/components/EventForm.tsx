import React, { useState, useEffect } from "react";
import { participantEmails } from "@/app/constants";
import { firestore } from "@/firebase";
import { collection, addDoc, writeBatch, doc } from "firebase/firestore";

const EventForm = () => {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [repeat, setRepeat] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [repeatCount, setRepeatCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    setIsSubmitDisabled(
      !(name && date && time && repeat && participants.length >= 2)
    );
  }, [name, date, time, repeat, participants]);

  const toggleParticipant = (name: string) => {
    const email = participantEmails[name];
    if (participants.includes(email)) {
      setParticipants(participants.filter((p) => p !== email));
    } else {
      setParticipants([...participants, email]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitDisabled) return;

    setIsLoading(true);

    const startDate = new Date(date + "T" + time);
    const eventObjects = [];

    for (let i = 0; i < repeatCount; i++) {
      let nextDate = new Date(startDate); // Create a new date object for each calculation

      switch (repeat) {
        case "every weekday":
          let tempDate = new Date(startDate);
          tempDate.setDate(tempDate.getDate() + i);
          while (tempDate.getDay() === 0 || tempDate.getDay() === 6) {
            tempDate.setDate(tempDate.getDate() + 1);
          }
          nextDate = tempDate;
          break;
        case "once a week":
          nextDate.setDate(startDate.getDate() + i * 7);
          break;
        case "once every two weeks":
          nextDate.setDate(startDate.getDate() + i * 14);
          break;
        case "monthly":
          nextDate.setMonth(startDate.getMonth() + i);
          break;
        default:
          break;
      }

      const nextDateCopy = new Date(nextDate);

      const eventObject = {
        meetingName: name,
        startTime: nextDateCopy.getTime(),
        votingStartTime: new Date(
          nextDateCopy.getTime() - 5 * 60000 // Voting will start 5 minutes before the meeting
        ).getTime(),
        votingEndTime: new Date(nextDateCopy.getTime() + 5 * 60000).getTime(), // Voting will be open for 10 minutes
        participants: [...participants],
        votes: {}, // Will be a mapping of votedForUserId: voterUserId
        winner: "", // Will be calculated after the voting ends
        createdAt: Date.now(),
        updatedAt: Date.now(),
        winnerDeclared: false,
      };
      eventObjects.push(eventObject);
    }

    try {
      const batch = writeBatch(firestore);
      const meetingsCollection = collection(firestore, "meetings");

      for (const eventObject of eventObjects) {
        const newDocRef = doc(meetingsCollection); // Generate a unique document reference
        batch.set(newDocRef, eventObject); // Add the document to the batch
      }

      await batch.commit(); // Commit the batch
      console.log("Meetings data pushed to Firestore in bulk");
    } catch (error) {
      console.error("Error pushing meetings data to Firestore:", error);
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-gray-800 shadow-xl shadow-green-500/40 rounded-lg p-4 text-white relative">
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
        </div>
      )}
      <h2 className="text-xl font-semibold mb-4">Add New Event</h2>
      <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
        {/* Name Field (Full Width) */}
        <div>
          <label
            htmlFor="name"
            className="block text-gray-300 text-sm font-bold mb-2"
          >
            Name:
          </label>
          <input
            type="text"
            id="name"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Date, Time and Repeat Frequency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="date"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Date:
            </label>
            <input
              type="date"
              id="date"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3  leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="time"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Time:
            </label>
            <input
              type="time"
              id="time"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3  leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="repeat"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Repeat Frequency:
            </label>
            <select
              id="repeat"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3  leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
            >
              <option value="">Select Frequency</option>
              <option value="every weekday">every weekday</option>
              <option value="once a week">once a week</option>
              <option value="once every two weeks">once every two weeks</option>
              <option value="monthly">monthly</option>
            </select>
          </div>
        </div>

        {/* Participant Toggles and Repeat Count */}
        <div className="flex items-center justify-between">
          <div className="w-3/4">
            <p className="block text-gray-300 text-sm font-bold mb-2">
              Participants:
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(participantEmails).map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`py-2 px-4 rounded-full text-sm font-medium ${
                    participants.includes(participantEmails[name])
                      ? "bg-green-500 hover:bg-green-700 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onClick={() => toggleParticipant(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div className="w-1/4">
            <label
              htmlFor="repeatCount"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Repeat Count:
            </label>
            <input
              type="number"
              id="repeatCount"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white"
              value={repeatCount}
              onChange={(e) =>
                setRepeatCount(parseInt(e.target.value, 10) || 10)
              }
            />
          </div>
        </div>

        {/* Submit Button (Bottom Right) */}
        <div className="flex justify-end">
          <button
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              isSubmitDisabled || isLoading
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            type="submit"
            disabled={isSubmitDisabled || isLoading}
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
