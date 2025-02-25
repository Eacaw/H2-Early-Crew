import React from "react";

interface MetricCardProps {
  title: string;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, description }) => {
  return (
    <div className="bg-gray-800 shadow-xl shadow-green-500/40 rounded-md p-4 text-white">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-gray-300">{description}</p>
    </div>
  );
};

export default MetricCard;
