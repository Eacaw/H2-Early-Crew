import React from "react";

interface RaceTrackProps {
  users: {
    photoURL: string;
    winCount: number;
  }[];
}

const RaceTrack: React.FC<RaceTrackProps> = ({ users }) => {
  const maxWins = Math.max(...users.map((user) => user.winCount), 0);

  return (
    <div className="bg-gray-800 rounded-2xl p-4 text-white mt-4">
      <h2 className="text-xl font-bold mb-4">Race to the Top! (Wins)</h2>
      <div className="flex flex-col">
        {users.map((user, index) => {
          const percentage = maxWins > 0 ? (user.winCount / maxWins) * 100 : 0;
          return (
            <div key={index} className="flex items-center mb-2">
              <img
                src={user.photoURL}
                alt="Avatar"
                className="rounded-full w-8 h-8 object-cover mr-2"
              />
              <div className="w-full bg-gray-700 h-1 rounded-full relative">
                <div
                  className="bg-green-500 h-1 rounded-full absolute top-0 left-0"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm">{user.winCount}</span>
            </div>
          );
        })}
        <div className="flex justify-between text-gray-500 text-xs mt-2 mr-12 ml-4">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
};

export default RaceTrack;
