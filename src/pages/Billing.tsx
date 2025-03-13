
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import UPIQRCode from '@/components/UPIQRCode';

const Billing = () => {
  const [billAmount, setBillAmount] = useState(0);
  const [billId, setBillId] = useState<number | undefined>(undefined);
  const [showQRCode, setShowQRCode] = useState(false);
  
  const handleCreateBill = () => {
    // For demonstration purposes only
    const generatedBillId = Math.floor(Math.random() * 1000) + 1;
    setBillId(generatedBillId);
    
    if (billAmount > 0) {
      setShowQRCode(true);
      toast.success(`Bill #${generatedBillId} created successfully`);
    } else {
      toast.error("Please enter a valid amount");
    }
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <Button onClick={() => toast.info("Billing tutorial will be shown here")}>
          Need Help?
        </Button>
      </div>
      
      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="new">New Bill</TabsTrigger>
          <TabsTrigger value="history">Bill History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="p-4">
                <h3 className="font-medium mb-4">New Bill</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Bill Amount
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter amount"
                      value={billAmount || ''}
                      onChange={(e) => setBillAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleCreateBill}
                  >
                    Create Bill
                  </Button>
                </div>
              </Card>
            </div>
            
            {showQRCode && (
              <div>
                <UPIQRCode amount={billAmount} billId={billId} />
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <Card className="p-4">
            <h3 className="font-medium mb-4">Bill History</h3>
            <p className="text-muted-foreground text-sm">
              No billing history available yet. Bills will appear here once created.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Billing;
