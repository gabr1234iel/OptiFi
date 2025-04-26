import React from 'react';
import SetFeeTierForm from './SetFeeTierForm';

const FeeTiersTab: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Swap Fee Tiers</h2>
        <p className="text-gray-600 mb-4">
          Set the default fee tiers for token swaps. This affects the liquidity pools used on Uniswap.
        </p>
      
        
        <SetFeeTierForm />
      </div>
    </div>
  );
};

export default FeeTiersTab;