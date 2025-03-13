import { useState, useEffect } from 'react';
import { generateUPIQRCode, UPIPayment } from '@/lib/upiUtils';
import { Card } from '@/components/ui/card';
import { useStoreSettings } from '@/lib/db';
import { IndianRupee, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface UPIQRCodeProps {
  amount: number;
  billId?: number;
}

const UPIQRCode = ({ amount, billId }: UPIQRCodeProps) => {
  const { storeInfo } = useStoreSettings();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    const generateQRCode = async () => {
      if (!storeInfo || !storeInfo.upiId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        const payment: UPIPayment = {
          payeeName: storeInfo.name,
          payeeVpa: storeInfo.upiId,
          amount: amount,
          transactionNote: billId ? `Bill #${billId}` : 'Payment',
        };
        
        const qrCodeUrl = await generateUPIQRCode(payment);
        setQrCodeDataUrl(qrCodeUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
        toast.error('Failed to generate UPI QR code');
      } finally {
        setLoading(false);
      }
    };
    
    generateQRCode();
  }, [storeInfo, amount, billId]);
  
  const copyUpiId = () => {
    if (storeInfo?.upiId) {
      navigator.clipboard.writeText(storeInfo.upiId);
      setCopied(true);
      toast.success('UPI ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!storeInfo?.upiId) {
    return (
      <Card className="p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Please configure your UPI ID in Settings to enable QR code payments.
        </p>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden animate-fade-in">
      <div className="p-4 text-center">
        <h3 className="font-medium">Scan to Pay</h3>
        <div className="mt-2 flex items-center justify-center font-semibold text-lg">
          <IndianRupee className="h-4 w-4 mr-1" />
          <span>{amount.toFixed(2)}</span>
        </div>
        
        <div className="mt-4 flex justify-center">
          {loading ? (
            <Skeleton className="h-48 w-48" />
          ) : (
            <div className="bg-white p-2 rounded-md shadow-sm">
              <img 
                src={qrCodeDataUrl} 
                alt="UPI QR Code" 
                className="w-48 h-48"
              />
            </div>
          )}
        </div>
        
        <div className="mt-4 flex flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground">UPI ID</p>
          <div className="flex items-center text-sm border rounded-md overflow-hidden">
            <span className="px-3 py-1.5">{storeInfo.upiId}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-full px-3 py-1.5 rounded-none border-l"
              onClick={copyUpiId}
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default UPIQRCode;
