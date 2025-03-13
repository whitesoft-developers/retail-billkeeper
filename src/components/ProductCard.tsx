
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Plus, Minus, Package } from "lucide-react";
import { useState } from "react";
import { Product, InventoryItem } from "@/lib/db";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  inventoryItem?: InventoryItem;
  onAddToBill?: (product: Product, quantity: number) => void;
  compact?: boolean;
}

const ProductCard = ({ 
  product, 
  inventoryItem, 
  onAddToBill,
  compact = false 
}: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  
  const incrementQuantity = () => {
    if (inventoryItem && quantity >= inventoryItem.quantity) {
      return; // Don't exceed available stock
    }
    setQuantity(prev => prev + 1);
  };
  
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };
  
  const handleAddToBill = () => {
    if (onAddToBill) {
      onAddToBill(product, quantity);
      setQuantity(1); // Reset quantity after adding
    }
  };
  
  const isLowStock = inventoryItem && inventoryItem.quantity <= inventoryItem.lowStockThreshold;
  
  if (compact) {
    return (
      <Card className={cn(
        "hover:shadow-md transition-shadow overflow-hidden group",
        isLowStock && "border-amber-200"
      )}>
        <div className="p-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
              <p className="text-xs text-muted-foreground">{product.category}</p>
            </div>
            
            <Badge variant={isLowStock ? "outline" : "secondary"} className={cn(
              "text-xs",
              isLowStock && "border-amber-200 text-amber-600"
            )}>
              {inventoryItem?.quantity || 0} in stock
            </Badge>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <p className="flex items-center text-sm font-medium">
              <IndianRupee className="h-3 w-3 mr-1" />
              {product.price.toFixed(2)}
            </p>
            
            {onAddToBill && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleAddToBill}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={cn(
      "overflow-hidden hover:shadow-md transition-all duration-200 animate-scale-in",
      isLowStock && "border-amber-200"
    )}>
      <div className="p-4">
        <div className="flex justify-between">
          <div>
            <h3 className="font-medium">{product.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
          </div>
          
          {inventoryItem && (
            <Badge variant={isLowStock ? "outline" : "secondary"} className={cn(
              isLowStock && "border-amber-200 text-amber-600"
            )}>
              {inventoryItem.quantity} in stock
            </Badge>
          )}
        </div>
        
        <div className="mt-3 flex items-center">
          <div className="bg-muted p-2 rounded-md mr-2">
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">HSN: {product.hsn}</p>
            <p className="text-xs text-muted-foreground">Barcode: {product.barcode}</p>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center font-medium">
            <IndianRupee className="h-4 w-4 mr-1" />
            <span>{product.price.toFixed(2)}</span>
          </div>
          
          {onAddToBill && (
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7" 
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <span className="w-8 text-center">{quantity}</span>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7" 
                onClick={incrementQuantity}
                disabled={inventoryItem && quantity >= inventoryItem.quantity}
              >
                <Plus className="h-3 w-3" />
              </Button>
              
              <Button onClick={handleAddToBill} className="ml-2" size="sm">
                Add to Bill
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
