
import { useState } from 'react';
import { InventoryItem, Product } from '@/lib/db';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { formatDistanceToNow, format, isPast, isAfter, addDays } from 'date-fns';
import AddStockForm from './AddStockForm';

interface InventoryBatchListProps {
  inventoryItems: (InventoryItem & { product?: Product })[];
  product: Product;
  onEditInventory: (item: InventoryItem & { product?: Product }) => void;
  onRefresh: () => void;
}

const InventoryBatchList = ({ inventoryItems, product, onEditInventory, onRefresh }: InventoryBatchListProps) => {
  const [addStockOpen, setAddStockOpen] = useState(false);
  
  const getExpiryStatus = (expiryDate?: Date) => {
    if (!expiryDate) return { status: 'none', label: 'No expiry' };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    
    if (isPast(expiry)) {
      return { status: 'expired', label: 'Expired' };
    }
    
    if (isAfter(addDays(today, 30), expiry)) {
      return { status: 'expiring-soon', label: 'Expiring soon' };
    }
    
    return { status: 'valid', label: 'Valid' };
  };
  
  const filteredItems = inventoryItems.filter(item => item.productId === product.id);
  
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{product.name} - Inventory</h3>
        <Button onClick={() => setAddStockOpen(true)}>Add Stock</Button>
      </div>
      
      {filteredItems.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch ID</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const expiryStatus = getExpiryStatus(item.expiryDate);
              
              return (
                <TableRow key={`${item.productId}-${item.location}-${item.batchId}`}>
                  <TableCell>{item.batchId}</TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell className={item.quantity <= (item.lowStockThreshold || 5) ? 'text-red-500 font-medium' : ''}>
                    {item.quantity}
                  </TableCell>
                  <TableCell>
                    {item.expiryDate ? format(new Date(item.expiryDate), 'dd/MM/yyyy') : 'N/A'}
                    {item.expiryDate && (
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.expiryDate), { addSuffix: true })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {expiryStatus.status === 'expired' && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {expiryStatus.label}
                      </Badge>
                    )}
                    {expiryStatus.status === 'expiring-soon' && (
                      <Badge variant="warning" className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {expiryStatus.label}
                      </Badge>
                    )}
                    {expiryStatus.status === 'valid' && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {expiryStatus.label}
                      </Badge>
                    )}
                    {expiryStatus.status === 'none' && (
                      <Badge variant="outline">{expiryStatus.label}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => onEditInventory(item)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">No inventory found for this product</p>
          <Button className="mt-4" onClick={() => setAddStockOpen(true)}>Add Stock</Button>
        </div>
      )}
      
      <AddStockForm 
        open={addStockOpen} 
        onOpenChange={setAddStockOpen} 
        product={product} 
        onComplete={onRefresh}
      />
    </>
  );
};

export default InventoryBatchList;
