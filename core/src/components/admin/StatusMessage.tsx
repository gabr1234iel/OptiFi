import React from 'react';
import { StatusMessageProps } from '../../types/admin';

const StatusMessage: React.FC<StatusMessageProps> = ({ message, isError, onDismiss }) => {
  if (!message) return null;
  
  return (
    <div className={`mb-6 p-4 rounded-lg flex justify-between items-center ${isError ? 'bg-red-100 border border-red-300 text-red-800' : 'bg-green-100 border border-green-300 text-green-800'}`}>
      <p>{message}</p>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Dismiss message"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default StatusMessage;