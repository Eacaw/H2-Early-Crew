"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [rickScore, setRickScore] = useState(0);
  const [daveScore, setDaveScore] = useState(0);
  const [timer, setTimer] = useState(900); // 15 minutes in seconds
  const [isFunMode, setIsFunMode] = useState(false);
  const [rickButtonPosition, setRickButtonPosition] = useState({});
  const [rickButtonDefaultPosition, setRickButtonDefaultPosition] = useState(
    {}
  );
  const [rickButtonFunComplete, setRickButtonFunComplete] = useState(false);
  const [rickButtonHoverCount, setRickButtonHoverCount] = useState(0);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (buttonsDisabled) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 0) {
            clearInterval(interval);
            setButtonsDisabled(false);
            return 900;
          }
          return prevTimer - 1;
        });
      }, 25);
    }
    return () => clearInterval(interval);
  }, [buttonsDisabled]);

  const handleRickButtonClick = () => {
    setRickScore(rickScore + 1);
    setButtonsDisabled(true);
  };

  const handleDaveButtonClick = () => {
    setDaveScore(daveScore + 1);
    setButtonsDisabled(true);
  };

  const handleFunModeToggle = () => {
    setIsFunMode(!isFunMode);
  };

  const handleRickButtonMouseEnter = () => {
    // On the first run through this method, get the initial position of the button id'd "rick-button" and store it in state
    if (Object.keys(rickButtonDefaultPosition).length === 0) {
      const rickButton = document.getElementById("rick-button");
      if (rickButton) {
        const { top, left } = rickButton.getBoundingClientRect();
        setRickButtonDefaultPosition({ top, left });
      }
    }
    if (isFunMode && rickButtonHoverCount < 3 && !rickButtonFunComplete) {
      const newTop = `${Math.random() * (window.innerHeight - 250)}px`;
      const newLeft = `${Math.random() * (window.innerWidth - 250)}px`;
      setRickButtonPosition({ top: newTop, left: newLeft });
      setRickButtonHoverCount(rickButtonHoverCount + 1);
    } else if (isFunMode && rickButtonHoverCount >= 3) {
      setRickButtonHoverCount(0);
      setRickButtonPosition(rickButtonDefaultPosition);
      setRickButtonFunComplete(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 flex flex-col items-center justify-center">
      <div className="flex items-center mb-4">
        <label className="mr-2">Fun Mode</label>
        <input
          type="checkbox"
          checked={isFunMode}
          onChange={handleFunModeToggle}
        />
      </div>
      <div className="flex justify-around w-full mb-8">
        <div className="text-center">
          <div className="text-6xl mb-2">{rickScore}</div>
          <div className="text-2xl mb-4">Rick</div>
          <button
            id="rick-button"
            className="bg-green-500 text-white py-2 px-4 rounded"
            onClick={handleRickButtonClick}
            onMouseEnter={handleRickButtonMouseEnter}
            style={
              isFunMode ? { position: "absolute", ...rickButtonPosition } : {}
            }
            disabled={buttonsDisabled}
          >
            First
          </button>
        </div>
        <div className="text-center">
          <div className="text-6xl mb-2">{daveScore}</div>
          <div className="text-2xl mb-4">Dave</div>
          <button
            className="bg-green-500 text-white py-2 px-4 rounded"
            onClick={handleDaveButtonClick}
            disabled={buttonsDisabled}
          >
            First
          </button>
        </div>
      </div>
      <div className="text-2xl">
        {Math.floor(timer / 60)
          .toString()
          .padStart(2, "0")}
        :{(timer % 60).toString().padStart(2, "0")}
      </div>
    </div>
  );
}
