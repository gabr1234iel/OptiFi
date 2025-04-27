import React from 'react';
import AdapterTable from './AdapterTable';
import ChangeAdapterForm from './ChangeAdapterForm';
import AdapterConfiguration from './AdapterConfiguration';

import { useAdmin } from '../../../contexts/AdminContext';

const AdaptersTab: React.FC = () => {
  const { tokens, adapters } = useAdmin();
  
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Adapter Settings</h2>
        <p className="text-gray-600 mb-4">
          Configure which protocol adapter to use for each token. This allows the vault to optimize for the highest yield.
        </p>
        
        <AdapterTable tokens={tokens} adapters={adapters} />
        
        <AdapterConfiguration />
        
        <ChangeAdapterForm />
      </div>
    </div>
  );
};

export default AdaptersTab;