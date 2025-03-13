import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import UPIQRCode from '@/components/UPIQRCode';
import { useInventory, useProducts, useBills, useStoreSettings, Product, BillItem, Bill } from '@/lib/db';
import { Search, Plus, ShoppingCart, Calendar, ArrowRight, IndianRupee, Printer, Bookmark, TrendingUp, Package } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import BillComponent from '@/components/BillItem';
import BillPrint from '@/components/BillPrint';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, subDays, subMonths, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useReactToPrint } from 'react-to-print';

const Billing = () => {
  const { inventory, updateInventoryItem } = useInventory();
  const { products } = useProducts();
  const { bills, addBill, getBill } = useBills();
  const { storeInfo } = useStoreSettings();
  
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [billId, setBillId] = useState<number | undefined>(undefined);
  const [showQRCode, setShowQRCode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [billSearchTerm, setBillSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [insightPeriod, setInsightPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  
  const printBillRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    documentTitle: "Bill Receipt",
    onBeforeGetContent: () => Promise.resolve(),
    onAfterPrint: () => console.log("Printed successfully"),
    removeAfterPrint: true,
  });
  
  const generateBillNumber = () => {
    const date = new Date();
    const prefix = 'INV';
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${year}${month}${day}${random}`;
  };
  
  const calculateBill = () => {
    const subtotal = billItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = billItems.reduce((sum, item) => {
      const cgstAmount = (item.amount * item.cgst) / 100;
      const sgstAmount = (item.amount * item.sgst) / 100;
      return sum + cgstAmount + sgstAmount;
    }, 0);
    
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount
    };
  };
  
  const { subtotal, taxAmount, total } = calculateBill();
  
  const filteredProducts = searchTerm
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;
  
  const productsWithInventory = filteredProducts.filter(product => {
    const inventoryItems = inventory.filter(item => item.productId === product.id);
    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    return totalQuantity > 0;
  });
  
  const getFilteredBills = () => {
    let filtered = [...bills];
    
    if (billSearchTerm) {
      filtered = filtered.filter(bill => 
        (bill.billNumber && bill.billNumber.toLowerCase().includes(billSearchTerm.toLowerCase())) ||
        (bill.id && bill.id.toString().includes(billSearchTerm))
      );
    } else {
      filtered = filtered.filter(bill => {
        const billDate = new Date(bill.date);
        return billDate >= dateRange.from && billDate <= endOfDay(dateRange.to);
      });
    }
    
    return filtered;
  };
  
  const filteredBills = getFilteredBills();
  
  useEffect(() => {
    const now = new Date();
    
    switch (insightPeriod) {
      case 'day':
        setDateRange({ from: startOfDay(now), to: now });
        break;
      case 'week':
        setDateRange({ from: subDays(now, 7), to: now });
        break;
      case 'month':
        setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case 'year':
        setDateRange({ from: startOfYear(now), to: endOfYear(now) });
        break;
      // 'custom' case is handled by the date picker directly
    }
  }, [insightPeriod]);
  
  const handleAddToBill = (product: Product, quantity: number) => {
    const existingItemIndex = billItems.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...billItems];
      const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: newQuantity,
        amount: product.price * newQuantity
      };
      setBillItems(updatedItems);
    } else {
      const newItem: BillItem = {
        productId: product.id!,
        name: product.name,
        price: product.price,
        quantity: quantity,
        hsn: product.hsn,
        amount: product.price * quantity,
        cgst: product.cgst || 9,
        sgst: product.sgst || 9
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
      const locations = inventory.filter(inv => inv.productId === item.productId);
      
      let remainingQuantity = item.quantity;
      
      for (const location of locations) {
        if (remainingQuantity <= 0) break;
        
        const deductAmount = Math.min(location.quantity, remainingQuantity);
        remainingQuantity -= deductAmount;
        
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
      const inventoryUpdated = await updateInventoryQuantity();
      if (!inventoryUpdated) return;
      
      const billNumber = generateBillNumber();
      
      const bill: Bill = {
        date: new Date(),
        items: billItems,
        subtotal,
        tax: taxAmount,
        total,
        billNumber,
        payment: {
          method: paymentMethod,
        },
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress
        }
      };
      
      const createdBill = await addBill(bill);
      setSelectedBill({...bill, id: createdBill as number});
      
      if (paymentMethod === 'upi') {
        setShowQRCode(true);
      }
      
      toast.success(`Bill ${billNumber} created successfully`);
      
      setTimeout(() => {
        setBillItems([]);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setCustomerAddress('');
        
        if (paymentMethod !== 'upi' || (paymentMethod === 'upi' && showQRCode)) {
          handlePrint();
        }
      }, 500);
    } catch (error) {
      console.error("Error creating bill:", error);
      toast.error("Failed to create bill");
    }
  };
  
  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill);
  };
  
  const getSalesData = () => {
    const salesByDay = new Map();
    const salesByCategory = new Map();
    
    filteredBills.forEach(bill => {
      const date = format(new Date(bill.date), 'yyyy-MM-dd');
      const currentTotal = salesByDay.get(date) || 0;
      salesByDay.set(date, currentTotal + bill.total);
      
      bill.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const category = product.category || 'Uncategorized';
          const currentCategoryTotal = salesByCategory.get(category) || 0;
          salesByCategory.set(category, currentCategoryTotal + item.amount);
        }
      });
    });
    
    const dailyData = Array.from(salesByDay.entries()).map(([date, total]) => ({
      date,
      total
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    const categoryData = Array.from(salesByCategory.entries()).map(([category, total]) => ({
      category,
      value: total
    }));
    
    return { dailyData, categoryData };
  };
  
  const { dailyData, categoryData } = getSalesData();
  
  const totalSales = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
  const totalTransactions = filteredBills.length;
  const averageTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  const handleSearchBill = () => {
    if (!billSearchTerm) return;
    
    const found = bills.find(bill => 
      (bill.billNumber && bill.billNumber.toLowerCase() === billSearchTerm.toLowerCase()) ||
      (bill.id && bill.id.toString() === billSearchTerm)
    );
    
    if (found) {
      setSelectedBill(found);
      toast.success(`Bill #${found.billNumber || found.id} found`);
    } else {
      toast.error("Bill not found");
    }
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
      </div>
      
      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="new">New Bill</TabsTrigger>
          <TabsTrigger value="history">Bill History</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
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
                        <span>Tax (GST):</span>
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
                        <Label htmlFor="customerEmail">Email (Optional)</Label>
                        <Input
                          id="customerEmail"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="Enter email address"
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
            <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
              <h3 className="font-medium">Bill History</h3>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by bill number..."
                    className="pl-8 min-w-[220px]"
                    value={billSearchTerm}
                    onChange={(e) => setBillSearchTerm(e.target.value)}
                  />
                </div>
                
                <Button variant="outline" size="sm" onClick={handleSearchBill}>
                  <Search className="h-4 w-4 mr-2" />
                  Find Bill
                </Button>
              </div>
            </div>
            
            {filteredBills.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell>{bill.billNumber || bill.id}</TableCell>
                        <TableCell>{format(new Date(bill.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell>{bill.customer?.name || 'Walk-in Customer'}</TableCell>
                        <TableCell>{bill.items.length} items</TableCell>
                        <TableCell className="font-medium">₹{bill.total.toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{bill.payment.method}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewBill(bill)}>
                              <Bookmark className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedBill(bill); setTimeout(handlePrint, 100); }}>
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No billing history available yet. Bills will appear here once created.
              </p>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="insights">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-4">
              <div className="mb-4">
                <h3 className="font-medium mb-2">Sales Overview</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={insightPeriod === 'day' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setInsightPeriod('day')}
                  >
                    Today
                  </Button>
                  <Button 
                    variant={insightPeriod === 'week' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setInsightPeriod('week')}
                  >
                    Last 7 Days
                  </Button>
                  <Button 
                    variant={insightPeriod === 'month' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setInsightPeriod('month')}
                  >
                    This Month
                  </Button>
                  <Button 
                    variant={insightPeriod === 'year' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setInsightPeriod('year')}
                  >
                    This Year
                  </Button>
                  <Button 
                    variant={insightPeriod === 'custom' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setInsightPeriod('custom')}
                  >
                    Custom
                  </Button>
                </div>
                
                {insightPeriod === 'custom' && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="startDate">From</Label>
                      <DatePicker
                        date={dateRange.from}
                        setDate={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endDate">To</Label>
                      <DatePicker
                        date={dateRange.to}
                        setDate={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">₹{totalSales.toFixed(2)}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold">{totalTransactions}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground">Avg. Bill Value</p>
                  <p className="text-2xl font-bold">₹{averageTransactionValue.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Sales']} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#8884d8" name="Sales" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="font-medium mb-4">Sales by Category</h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="category"
                      label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Sales']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">Top Selling Products</h4>
                <div className="space-y-2">
                  {getTopSellingProducts()}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="hidden">
        {selectedBill && storeInfo && (
          <div ref={printBillRef}>
            <BillPrint bill={selectedBill} storeInfo={storeInfo} />
          </div>
        )}
      </div>
    </div>
  );
};

function getTopSellingProducts() {
  return (
    <p className="text-sm text-muted-foreground">
      No sales data available for this period.
    </p>
  );
}

export default Billing;
