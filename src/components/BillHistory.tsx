
import React, { useState } from 'react';
import { Bill, useBills } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Download, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import BillPrint from '@/components/BillPrint';
import { useStoreSettings } from '@/lib/db';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const BillHistory = () => {
  const { bills, loading, error } = useBills();
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [billDetailsOpen, setBillDetailsOpen] = useState(false);
  const { storeInfo } = useStoreSettings();
  const printRef = React.useRef<HTMLDivElement>(null);

  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill);
    setBillDetailsOpen(true);
  };

  const handlePrint = useReactToPrint({
    documentTitle: `Invoice-${selectedBill?.billNumber || selectedBill?.id}`,
    contentRef: () => printRef.current,
  });

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      pdf.addImage(imgData, 'PNG', imgX, 10, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Invoice-${selectedBill?.billNumber || selectedBill?.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading bills...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-destructive">{error}</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bill History</CardTitle>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <p className="text-center text-muted-foreground">No bills found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell>{bill.billNumber || bill.id}</TableCell>
                    <TableCell>{format(new Date(bill.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{bill.customer?.name || 'Guest'}</TableCell>
                    <TableCell className="text-right">₹{bill.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewBill(bill)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={billDetailsOpen} onOpenChange={setBillDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>
          
          {selectedBill && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">Bill #{selectedBill.billNumber || selectedBill.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedBill.date), 'dd MMMM yyyy, hh:mm a')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePrint()}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between mb-4">
                    <div>
                      <h3 className="font-medium">Customer Details</h3>
                      <p>{selectedBill.customer?.name || 'Guest'}</p>
                      {selectedBill.customer?.phone && <p>Phone: {selectedBill.customer.phone}</p>}
                    </div>
                    <div className="text-right">
                      <h3 className="font-medium">Payment Details</h3>
                      <p className="capitalize">Method: {selectedBill.payment.method}</p>
                      {selectedBill.payment.reference && (
                        <p>Reference: {selectedBill.payment.reference}</p>
                      )}
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBill.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="mt-4 space-y-1 text-right">
                    <p>Subtotal: ₹{selectedBill.subtotal.toFixed(2)}</p>
                    <p>Tax: ₹{selectedBill.tax.toFixed(2)}</p>
                    <p className="font-bold text-lg">
                      Total: ₹{selectedBill.total.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="hidden">
            <div ref={printRef}>
              {selectedBill && storeInfo && (
                <BillPrint bill={selectedBill} storeInfo={storeInfo} />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BillHistory;
