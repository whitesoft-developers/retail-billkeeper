
import React, { forwardRef, useRef } from 'react';
import { Bill, StoreInfo } from '@/lib/db';
import { format } from 'date-fns';
import { IndianRupee } from 'lucide-react';

interface BillPrintProps {
  bill: Bill;
  storeInfo: StoreInfo;
}

const BillPrint = forwardRef<HTMLDivElement, BillPrintProps>(({ bill, storeInfo }, ref) => {
  const totalCGST = bill.items.reduce((sum, item) => sum + (item.amount * item.cgst / 100), 0);
  const totalSGST = bill.items.reduce((sum, item) => sum + (item.amount * item.sgst / 100), 0);
  
  return (
    <div 
      ref={ref} 
      className="thermal-bill bg-white p-2 text-black text-sm" 
      style={{ width: `${storeInfo.billWidth || 80}mm`, minHeight: `${storeInfo.billHeight || 140}mm` }}
    >
      <div className="text-center mb-3">
        {storeInfo.logo && (
          <div className="flex justify-center mb-2">
            <img src={storeInfo.logo} alt="Company Logo" className="h-16" />
          </div>
        )}
        <h1 className="text-lg font-bold">{storeInfo.name}</h1>
        <p className="text-xs">{storeInfo.address}</p>
        <p className="text-xs">Tel: {storeInfo.phone}</p>
        <p className="text-xs">GSTIN: {storeInfo.gst}</p>
      </div>
      
      <div className="border-b border-t border-dashed py-1">
        <p>Bill No: <span className="font-medium">{bill.billNumber || bill.id}</span></p>
        <div className="flex justify-between">
          <p>Date: {format(new Date(bill.date), 'dd/MM/yyyy')}</p>
          <p>Time: {format(new Date(bill.date), 'hh:mm a')}</p>
        </div>
        {bill.customer?.name && (
          <p>Customer: {bill.customer.name} {bill.customer.phone ? `(${bill.customer.phone})` : ''}</p>
        )}
      </div>
      
      <div className="my-1">
        <div className="flex text-xs font-medium">
          <div className="w-1/2">Item</div>
          <div className="w-1/6 text-right">Qty</div>
          <div className="w-1/6 text-right">Rate</div>
          <div className="w-1/6 text-right">Amt</div>
        </div>
        
        <div className="border-b border-dashed my-1"></div>
        
        {bill.items.map((item, index) => (
          <div key={index} className="flex text-xs">
            <div className="w-1/2">{item.name}</div>
            <div className="w-1/6 text-right">{item.quantity}</div>
            <div className="w-1/6 text-right">{item.price.toFixed(2)}</div>
            <div className="w-1/6 text-right">{item.amount.toFixed(2)}</div>
          </div>
        ))}
        
        <div className="border-b border-dashed my-1"></div>
      </div>
      
      <div className="text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{bill.subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>CGST:</span>
          <span>₹{totalCGST.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>SGST:</span>
          <span>₹{totalSGST.toFixed(2)}</span>
        </div>
        
        <div className="border-b border-dashed my-1"></div>
        
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>₹{bill.total.toFixed(2)}</span>
        </div>
        
        <div className="mt-2">
          <p>Payment Method: <span className="capitalize">{bill.payment.method}</span></p>
          {bill.payment.reference && <p>Reference: {bill.payment.reference}</p>}
        </div>
      </div>
      
      <div className="mt-4 text-center text-xs">
        <p>Thank you for shopping with us!</p>
        <p className="text-xs mt-2">- RetailPro by WhiteSoft -</p>
      </div>
    </div>
  );
});

BillPrint.displayName = "BillPrint";

export default BillPrint;
