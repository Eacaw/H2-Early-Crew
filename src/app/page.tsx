import { useState, useEffect } from "react";

export default function Home() {
  const [rickScore, setRickScore] = useState(0);
  const [daveScore, setDaveScore] = useState(0);
  const [timer, setTimer] = useState(900); // 15 minutes in seconds
  const [isFunMode, setIsFunMode] = useState(false);
  const [rickButtonPosition, setRickButtonPosition] = useState({ top: "0px", left: "0px" });
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
      }, 1000);
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
    if (isFunMode && rickButtonHoverCount < 3) {
      const newTop = `${Math.random() * (window.innerHeight - 50)}px`;
      const newLeft = `${Math.random() * (window.innerWidth - 50)}px`;
      setRickButtonPosition({ top: newTop, left: newLeft });
      setRickButtonHoverCount(rickButtonHoverCount + 1);
    } else if (isFunMode && rickButtonHoverCount >= 3) {
      setRickButtonHoverCount(0);
      setRickButtonPosition({ top: "0px", left: "0px" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 flex flex-col items-center justify-center">
      <div className="flex items-center mb-4">
        <label className="mr-2">Fun Mode</label>
        <input type="checkbox" checked={isFunMode} onChange={handleFunModeToggle} />
      </div>
      <div className="flex justify-around w-full mb-8">
        <div className="text-center">
          <div className="text-6xl mb-2">{rickScore}</div>
          <div className="text-2xl mb-4">Rick</div>
          <button
            className="bg-green-500 text-white py-2 px-4 rounded"
            onClick={handleRickButtonClick}
            onMouseEnter={handleRickButtonMouseEnter}
            style={isFunMode ? { position: "absolute", ...rickButtonPosition } : {}}
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
        :
        {(timer % 60).toString().padStart(2, "0")}
      </div>
    </div>
  );
}
