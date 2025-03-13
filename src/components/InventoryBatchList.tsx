
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InventoryItem, Product } from '@/lib/db';
import { format } from 'date-fns';
import { isAfter, isBefore, addDays } from 'date-fns';
import { toast } from 'sonner';

interface InventoryBatchListProps {
  inventoryItems: (InventoryItem & { product?: Product })[];
  product: Product;
  onEditInventory: (item: InventoryItem & { product?: Product }) => void;
  onRefresh: () => void;
}

const InventoryBatchList = ({ 
  inventoryItems, 
  product, 
  onEditInventory,
  onRefresh
}: InventoryBatchListProps) => {
  // Filter inventory items for this product
  const filteredItems = inventoryItems.filter(item => item.productId === product.id);
  
  // Determine expiry status
  const getExpiryStatus = (expiryDate?: Date) => {
    if (!expiryDate) return { status: 'ok', label: 'No Expiry' };
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    
    // Check if already expired
    if (isBefore(expiry, now)) {
      return { status: 'expired', label: 'Expired' };
    }
    
    // Check if expiring in 30 days
    if (isBefore(expiry, addDays(now, 30))) {
      return { status: 'expiring', label: 'Expiring Soon' };
    }
    
    return { status: 'ok', label: 'Valid' };
  };
  
  // Map expiry status to badge variant
  const getExpiryBadgeVariant = (status: string) => {
    switch (status) {
      case 'expired':
        return 'destructive';
      case 'expiring':
        return 'secondary'; // Changed from 'warning' to 'secondary'
      default:
        return 'outline';
    }
  };
  
  if (filteredItems.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground mb-4">No inventory batches found for this product.</p>
        <Button size="sm" onClick={onRefresh}>Refresh</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Total Quantity: {filteredItems.reduce((sum, item) => sum + item.quantity, 0)}
        </p>
        <Button size="sm" variant="outline" onClick={onRefresh}>Refresh</Button>
      </div>
      
      <div className="grid gap-4">
        {filteredItems.map((item) => {
          const expiryStatus = getExpiryStatus(item.expiryDate);
          
          return (
            <Card key={`${item.productId}-${item.location}-${item.batchId}`}>
              <CardHeader className="py-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{item.location}</CardTitle>
                    <CardDescription className="text-xs">Batch: {item.batchId}</CardDescription>
                  </div>
                  <Badge variant={getExpiryBadgeVariant(expiryStatus.status)}>
                    {expiryStatus.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="ml-2 font-medium">{item.quantity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Threshold:</span>
                    <span className="ml-2">{item.lowStockThreshold}</span>
                  </div>
                  
                  {item.purchaseDate && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Purchased:</span>
                      <span className="ml-2">{format(new Date(item.purchaseDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  
                  {item.expiryDate && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="ml-2">{format(new Date(item.expiryDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="py-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => onEditInventory(item)}
                >
                  Edit
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryBatchList;
