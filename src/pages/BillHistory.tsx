
import React from 'react';
import BillHistoryComponent from '@/components/BillHistory';

const BillHistory = () => {
  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <h1 className="text-2xl font-bold mb-6">Bill History</h1>
      <BillHistoryComponent />
    </div>
  );
};

export default BillHistory;
