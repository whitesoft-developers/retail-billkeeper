
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InventoryItem, Product } from '@/lib/db';
import { toast } from 'sonner';

interface InventoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: InventoryItem) => Promise<void>;
  inventoryItem?: InventoryItem & { product?: Product };
  productId?: number;
  title?: string;
}

const InventoryFormDialog = ({ 
  open, 
  onOpenChange, 
  onSave, 
  inventoryItem, 
  productId,
  title = "Update Inventory" 
}: InventoryFormDialogProps) => {
  const [formData, setFormData] = useState<InventoryItem>({
    productId: productId || 0,
    quantity: 0,
    location: '',
    lowStockThreshold: 5,
    batchId: `BATCH-${Date.now().toString().slice(-6)}`
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (inventoryItem) {
      setFormData({
        productId: inventoryItem.productId,
        quantity: inventoryItem.quantity,
        location: inventoryItem.location,
        lowStockThreshold: inventoryItem.lowStockThreshold,
        batchId: inventoryItem.batchId
      });
    } else if (productId) {
      // Reset form when adding new inventory for a product
      setFormData({
        productId: productId,
        quantity: 0,
        location: '',
        lowStockThreshold: 5,
        batchId: `BATCH-${Date.now().toString().slice(-6)}`
      });
    }
  }, [inventoryItem, productId, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['quantity', 'lowStockThreshold'].includes(name) 
        ? parseInt(value, 10) || 0 
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (formData.quantity < 0) {
      toast.error("Quantity cannot be negative");
      return;
    }
    
    if (!formData.location.trim()) {
      toast.error("Location is required");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving inventory item:", error);
      toast.error("Failed to save inventory item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Enter quantity"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Shelf A-1"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="batchId">Batch ID</Label>
            <Input
              id="batchId"
              name="batchId"
              value={formData.batchId}
              onChange={handleChange}
              placeholder="Enter batch ID"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
            <Input
              id="lowStockThreshold"
              name="lowStockThreshold"
              type="number"
              min="1"
              value={formData.lowStockThreshold}
              onChange={handleChange}
              placeholder="Enter threshold"
              required
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryFormDialog;
