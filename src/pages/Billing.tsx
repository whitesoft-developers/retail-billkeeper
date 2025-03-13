
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import UPIQRCode from '@/components/UPIQRCode';
import { useInventory, useProducts, useBills, Product, BillItem, Bill } from '@/lib/db';
import { Search, Plus, ShoppingCart, Calendar, ArrowRight, IndianRupee } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import BillComponent from '@/components/BillItem';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const Billing = () => {
  const { inventory, updateInventoryItem } = useInventory();
  const { products } = useProducts();
  const { bills, addBill, getBill } = useBills();
  
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [billId, setBillId] = useState<number | undefined>(undefined);
  const [showQRCode, setShowQRCode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  
  // Bill calculations
  const subtotal = billItems.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = 0.18; // 18% GST
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  
  // Filter products based on search term
  const filteredProducts = searchTerm
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;
  
  // Filter products that have inventory
  const productsWithInventory = filteredProducts.filter(product => {
    const inventoryItems = inventory.filter(item => item.productId === product.id);
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    return totalQuantity > 0;
  });
  
  const handleAddToBill = (product: Product, quantity: number) => {
    // Check if product already in bill
    const existingItemIndex = billItems.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...billItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: newQuantity,
        amount: product.price * newQuantity
      };
      setBillItems(updatedItems);
    } else {
      // Add new item
      const newItem: BillItem = {
        productId: product.id!,
        name: product.name,
        price: product.price,
        quantity: quantity,
        hsn: product.hsn,
        amount: product.price * quantity
      };
      setBillItems(prev => [...prev, newItem]);
    }
    
    toast.success(`${quantity} × ${product.name} added to bill`);
  };
  
  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    const updatedItems = billItems.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity: newQuantity,
          amount: item.price * newQuantity
        };
      }
      return item;
    });
    
    setBillItems(updatedItems);
  };
  
  const handleRemoveItem = (productId: number) => {
    setBillItems(prev => prev.filter(item => item.productId !== productId));
  };
  
  const updateInventoryQuantity = async () => {
    for (const item of billItems) {
      // Get all inventory locations for this product
      const locations = inventory.filter(inv => inv.productId === item.productId);
      
      let remainingQuantity = item.quantity;
      
      // Deduct from each location until quantity is fulfilled
      for (const location of locations) {
        if (remainingQuantity <= 0) break;
        
        const deductAmount = Math.min(location.quantity, remainingQuantity);
        remainingQuantity -= deductAmount;
        
        // Update inventory
        await updateInventoryItem({
          ...location,
          quantity: location.quantity - deductAmount
        });
      }
      
      if (remainingQuantity > 0) {
        toast.error(`Not enough inventory for ${item.name}`);
        return false;
      }
    }
    
    return true;
  };
  
  const handleCreateBill = async () => {
    if (billItems.length === 0) {
      toast.error("Please add items to the bill");
      return;
    }
    
    try {
      // Check and update inventory
      const inventoryUpdated = await updateInventoryQuantity();
      if (!inventoryUpdated) return;
      
      // Create bill
      const bill: Bill = {
        date: new Date(),
        items: billItems,
        subtotal,
        tax: taxAmount,
        total,
        payment: {
          method: paymentMethod,
        },
        customer: {
          name: customerName,
          phone: customerPhone,
        }
      };
      
      const success = await addBill(bill);
      if (success) {
        // Show QR code for UPI payment
        if (paymentMethod === 'upi') {
          setShowQRCode(true);
        }
        
        toast.success(`Bill created successfully`);
        
        // Reset form
        setBillItems([]);
        setCustomerName('');
        setCustomerPhone('');
      }
    } catch (error) {
      console.error("Error creating bill:", error);
      toast.error("Failed to create bill");
    }
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
      </div>
      
      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="new">New Bill</TabsTrigger>
          <TabsTrigger value="history">Bill History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Select Products</h3>
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search products..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {productsWithInventory.map(product => {
                    const inventoryItem = inventory.find(item => item.productId === product.id);
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        inventoryItem={inventoryItem}
                        onAddToBill={handleAddToBill}
                        compact
                      />
                    );
                  })}
                  
                  {productsWithInventory.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <p className="text-muted-foreground">No products found</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
            
            <div className="md:col-span-1">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Current Bill
                  </h3>
                  {billItems.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setBillItems([])}>
                      Clear
                    </Button>
                  )}
                </div>
                
                {billItems.length > 0 ? (
                  <div className="space-y-4">
                    <div className="divide-y max-h-[300px] overflow-y-auto">
                      {billItems.map((item) => (
                        <BillComponent
                          key={item.productId}
                          item={item}
                          onUpdateQuantity={handleUpdateQuantity}
                          onRemove={handleRemoveItem}
                        />
                      ))}
                    </div>
                    
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>GST (18%):</span>
                        <span>₹{taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold">
                        <span>Total:</span>
                        <span>₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="customerName">Customer Name (Optional)</Label>
                        <Input
                          id="customerName"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Enter customer name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="customerPhone">Phone Number (Optional)</Label>
                        <Input
                          id="customerPhone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Enter phone number"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={(value) => setPaymentMethod(value as 'cash' | 'upi' | 'card')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button className="w-full" onClick={handleCreateBill}>
                      Complete Bill
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No items added to bill</p>
                    <p className="text-xs text-muted-foreground mt-1">Search and add products from the left panel</p>
                  </div>
                )}
              </Card>
              
              {showQRCode && paymentMethod === 'upi' && (
                <div className="mt-4">
                  <UPIQRCode amount={total} billId={billId} />
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <Card className="p-4">
            <h3 className="font-medium mb-4">Bill History</h3>
            
            {bills.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell>{bill.id}</TableCell>
                      <TableCell>{format(new Date(bill.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell>{bill.customer?.name || 'Walk-in Customer'}</TableCell>
                      <TableCell>{bill.items.length} items</TableCell>
                      <TableCell className="font-medium">₹{bill.total.toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{bill.payment.method}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">
                No billing history available yet. Bills will appear here once created.
              </p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Billing;
