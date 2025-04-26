import React, { ReactNode, useState } from 'react';

interface StatusCardDetail {
  label: string;
  value: string;
}

interface StatusCardProps {
  title: string;
  value: string;
  details?: StatusCardDetail[];
  icon?: ReactNode;
}

const StatusCard: React.FC<StatusCardProps> = ({ title, value, details, icon }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-800">{title}</h3>
          <p className="text-3xl font-bold text-blue-600">{value}</p>
        </div>
        {icon && <div>{icon}</div>}
      </div>
      
      {details && details.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
          >
            {expanded ? 'Hide' : 'Show'} Details
            <svg 
              className={`w-4 h-4 ml-1 transition-transform ${expanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expanded && (
            <div className="mt-2 space-y-1 text-sm">
              {details.map((detail, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-500">{detail.label}:</span>
                  <span className="font-medium">{detail.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusCard;