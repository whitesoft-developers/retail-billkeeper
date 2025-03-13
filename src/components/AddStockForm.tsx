
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventory, Product, InventoryItem } from '@/lib/db';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { addDays } from 'date-fns';

interface AddStockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onComplete: () => void;
}

const AddStockForm = ({ open, onOpenChange, product, onComplete }: AddStockFormProps) => {
  const { addInventoryBatch } = useInventory();
  
  const [quantity, setQuantity] = useState<number>(1);
  const [location, setLocation] = useState<string>('');
  const [batchId, setBatchId] = useState<string>(`BATCH-${Date.now().toString().slice(-6)}`);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(addDays(new Date(), 365));
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date());
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }
    
    if (!location) {
      toast.error('Location is required');
      return;
    }
    
    try {
      const newBatch: InventoryItem = {
        productId: product.id!,
        quantity,
        location,
        batchId,
        expiryDate,
        purchaseDate,
        lowStockThreshold
      };
      
      await addInventoryBatch(newBatch);
      toast.success(`Added ${quantity} units of ${product.name} to inventory`);
      onOpenChange(false);
      onComplete();
      
      // Reset form
      setQuantity(1);
      setLocation('');
      setBatchId(`BATCH-${Date.now().toString().slice(-6)}`);
      setExpiryDate(addDays(new Date(), 365));
      setPurchaseDate(new Date());
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Failed to add stock');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Stock for {product.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Shelf A-1"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="batchId">Batch ID</Label>
            <Input
              id="batchId"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="Batch identifier"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <DatePicker
                date={purchaseDate}
                setDate={setPurchaseDate}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <DatePicker
                date={expiryDate}
                setDate={setExpiryDate}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
            <Input
              id="lowStockThreshold"
              type="number"
              min="1"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 5)}
            />
          </div>
          
          <DialogFooter>
            <Button type="submit">Add Stock</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStockForm;
