import React from 'react';
import PoolTable from './PoolTable';
import AddPoolForm from './AddPoolForm';
import PoolManagementActions from './PoolManagementActions';


import { useAdmin } from '../../../contexts/AdminContext';

const PoolsTab: React.FC = () => {
  const { pools, isLoading } = useAdmin();
  
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Current Pools</h2>
        <PoolTable pools={pools} isLoading={isLoading} />
      </div>
      
      <AddPoolForm />
      
      <PoolManagementActions />
    </div>
  );
};

export default PoolsTab;