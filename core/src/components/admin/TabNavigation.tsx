import React from 'react';
import { TabNavigationProps } from '../../types/admin';

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="flex border-b mb-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`py-2 px-4 font-medium whitespace-nowrap ${
            activeTab === tab.id
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-800'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;