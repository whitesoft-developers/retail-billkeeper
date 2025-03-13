
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Product, useInventory } from '@/lib/db';
import InventoryBatchList from './InventoryBatchList';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductBatchViewerProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditInventory: (item: any) => void;
}

const ProductBatchViewer = ({ 
  product, 
  open, 
  onOpenChange, 
  onEditInventory 
}: ProductBatchViewerProps) => {
  const { inventory, loading, refresh } = useInventory(false, true); // Include expired items
  
  if (!product) return null;
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Inventory Batches</SheetTitle>
        </SheetHeader>
        
        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="py-4">
            <InventoryBatchList 
              inventoryItems={inventory}
              product={product}
              onEditInventory={onEditInventory}
              onRefresh={refresh}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ProductBatchViewer;
