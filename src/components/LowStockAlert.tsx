
import { useInventory } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const LowStockAlert = () => {
  const { inventory, loading } = useInventory(true); // Only get low stock items
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-5 w-36 bg-muted rounded"></div>
        <div className="mt-2 h-4 w-48 bg-muted rounded"></div>
        <div className="mt-4 h-8 w-24 bg-muted rounded"></div>
      </Card>
    );
  }
  
  if (inventory.length === 0) {
    return (
      <Card className="p-4 bg-green-50 border-green-100 animate-fade-in">
        <div className="flex items-center text-green-600">
          <p className="text-sm font-medium">All stock levels are good</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={cn(
      "overflow-hidden animate-fade-in",
      inventory.length > 0 ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"
    )}>
      <div className="p-4">
        <div className="flex items-center text-amber-700">
          <AlertCircle className="h-4 w-4 mr-2" />
          <h3 className="font-medium">Low Stock Alert</h3>
        </div>
        
        <p className="mt-1 text-sm text-amber-600">
          {inventory.length} {inventory.length === 1 ? 'item is' : 'items are'} running low on stock.
        </p>
        
        {inventory.length > 0 && (
          <div className="mt-2 space-y-2">
            {inventory.slice(0, 3).map((item) => (
              <div key={item.productId} className="flex justify-between items-center py-1 text-sm">
                <span className="font-medium">{item.product?.name}</span>
                <span className="text-amber-700">{item.quantity} left</span>
              </div>
            ))}
            
            {inventory.length > 3 && (
              <div className="text-xs text-amber-600 py-1">
                ... and {inventory.length - 3} more
              </div>
            )}
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-3 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800"
          onClick={() => navigate('/inventory')}
        >
          <span>View Inventory</span>
          <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
};

export default LowStockAlert;
