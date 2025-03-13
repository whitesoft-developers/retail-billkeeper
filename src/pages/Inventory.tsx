
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { useInventory } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';

const Inventory = () => {
  const { inventory, loading } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredInventory = searchTerm
    ? inventory.filter(item => 
        item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : inventory;
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>
      
      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search inventory..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredInventory.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-6 font-medium text-xs uppercase text-muted-foreground">
              <div className="col-span-2">Product</div>
              <div>Category</div>
              <div>Price</div>
              <div>Quantity</div>
              <div>Actions</div>
            </div>
            
            <div className="divide-y">
              {filteredInventory.map((item) => (
                <div key={item.id} className="grid grid-cols-6 py-3 items-center">
                  <div className="col-span-2 font-medium">{item.product?.name}</div>
                  <div className="text-muted-foreground">{item.product?.category || 'N/A'}</div>
                  <div>₹{item.product?.price.toFixed(2)}</div>
                  <div className={item.quantity <= (item.lowStockThreshold || 5) ? 'text-red-500 font-medium' : ''}>
                    {item.quantity}
                  </div>
                  <div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No inventory items found</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Inventory;
