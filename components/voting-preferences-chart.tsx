"use client";

import { useEffect, useRef } from "react";

export function VotingPreferencesChart({ votesByRecipient }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || Object.keys(votesByRecipient).length === 0)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Sort data by vote count (descending)
    const sortedData = Object.entries(votesByRecipient)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5); // Take top 5

    // Calculate total votes for percentage
    const totalVotes = sortedData.reduce(
      (sum, [, count]) => sum + (count as number),
      0
    );

    // Define colors
    const colors = [
      "#10b981", // green-500
      "#059669", // green-600
      "#047857", // green-700
      "#065f46", // green-800
      "#064e3b", // green-900
    ];

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bar chart
    const barWidth = Math.min(50, (canvas.width - 100) / sortedData.length);
    const maxBarHeight = canvas.height - 60;
    const startX =
      (canvas.width -
        (barWidth * sortedData.length + (sortedData.length - 1) * 20)) /
      2;

    // Draw title
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Top 5 People You Voted For", canvas.width / 2, 30);

    // Draw bars
    sortedData.forEach(([email, count], index) => {
      const x = startX + index * (barWidth + 20);
      const barHeight = ((count as number) / totalVotes) * maxBarHeight;
      const y = canvas.height - 30 - barHeight;

      // Draw bar
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw label (truncate email to username)
      const username = email.split("@")[0];
      const displayName =
        username.length > 10 ? username.substring(0, 8) + "..." : username;

      ctx.fillStyle = "#a1a1aa"; // text-zinc-400
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(displayName, x + barWidth / 2, canvas.height - 10);

      // Draw count
      ctx.fillStyle = "#ffffff";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(count.toString(), x + barWidth / 2, y - 5);
    });
  }, [votesByRecipient]);

  return (
    <div className="w-full h-[300px]">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
