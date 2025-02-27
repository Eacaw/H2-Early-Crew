import React from "react";

interface MetricCardProps {
  title: string;
  description: string | React.JSX.Element;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, description }) => {
  return (
    <div className="bg-gray-800 shadow-2xl shadow-green-400/20 rounded-md p-4 mt-8 text-white">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="text-gray-300">{description}</div>
    </div>
  );
};

export default MetricCard;
