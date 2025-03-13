
import { BillItem as BillItemType } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { IndianRupee, Trash2, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BillItemProps {
  item: BillItemType;
  onUpdateQuantity?: (id: number, newQuantity: number) => void;
  onRemove?: (id: number) => void;
  editable?: boolean;
}

const BillItem = ({
  item,
  onUpdateQuantity,
  onRemove,
  editable = true
}: BillItemProps) => {
  const handleIncrementQuantity = () => {
    if (onUpdateQuantity) {
      onUpdateQuantity(item.productId, item.quantity + 1);
    }
  };

  const handleDecrementQuantity = () => {
    if (onUpdateQuantity && item.quantity > 1) {
      onUpdateQuantity(item.productId, item.quantity - 1);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(item.productId);
    }
  };

  return (
    <div className={cn(
      "py-3 animate-slide-in",
      !editable ? "grid grid-cols-12 gap-1 text-sm" : "flex items-center justify-between"
    )}>
      {!editable ? (
        <>
          <div className="col-span-5">
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">HSN: {item.hsn}</p>
          </div>
          <div className="col-span-2 text-center">{item.quantity}</div>
          <div className="col-span-2 text-right">
            <div className="flex items-center justify-end">
              <IndianRupee className="h-3 w-3" />
              <span>{item.price.toFixed(2)}</span>
            </div>
          </div>
          <div className="col-span-3 text-right">
            <div className="flex items-center justify-end font-medium">
              <IndianRupee className="h-3 w-3" />
              <span>{item.amount.toFixed(2)}</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1">
            <p className="font-medium">{item.name}</p>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <div className="flex items-center">
                <IndianRupee className="h-3 w-3 mr-0.5" />
                <span>{item.price.toFixed(2)}</span>
              </div>
              <span className="mx-1">×</span>
              <span>{item.quantity}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={handleDecrementQuantity}
                disabled={!editable || item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>

              <span className="w-5 text-center text-sm">{item.quantity}</span>

              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={handleIncrementQuantity}
                disabled={!editable}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex items-center font-medium w-16 justify-end">
              <IndianRupee className="h-3 w-3 mr-0.5" />
              <span>{item.amount.toFixed(2)}</span>
            </div>

            {editable && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                onClick={handleRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BillItem;
