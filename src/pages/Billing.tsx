import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bill, BillItem, Product, useProducts, useBills, StoreInfo, useStoreSettings } from '@/lib/db';
import { Plus, Search, Printer, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import BillPrint from '@/components/BillPrint';
import UPIQRCode from '@/components/UPIQRCode';
import BillHistory from '@/components/BillHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductRowProps {
  product: Product;
  onAdd: (product: Product) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({ product, onAdd }) => {
  return (
    <TableRow>
      <TableCell>{product.name}</TableCell>
      <TableCell>{product.category}</TableCell>
      <TableCell>₹{product.price.toFixed(2)}</TableCell>
      <TableCell>
        <Button size="sm" onClick={() => onAdd(product)}>Add</Button>
      </TableCell>
    </TableRow>
  );
};

const Billing = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [printOnSave, setPrintOnSave] = useState(false);
  const [billPrinted, setBillPrinted] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('new-bill');
  
  const [billData, setBillData] = useState<Bill>({
    date: new Date(),
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    payment: { method: 'cash' },
  });
  
  const navigate = useNavigate();
  const { products, loading, error } = useProducts({ 
    query: searchQuery, 
    category: categoryFilter === 'all' ? '' : categoryFilter 
  });
  const { addBill } = useBills();
  const { storeInfo } = useStoreSettings();
  const componentRef = useRef<HTMLDivElement>(null);
  
  const [billNumber, setBillNumber] = useState<string | null>(null);

  useEffect(() => {
    const generateBillNumber = () => {
      const now = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `RB-${now.slice(-6)}-${random}`;
    };

    setBillNumber(generateBillNumber());
  }, []);

  const calculateBill = () => {
    let subtotal = 0;
    billItems.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const tax = billItems.reduce((acc, item) => {
      const cgstAmount = (item.cgst / 100) * item.price * item.quantity;
      const sgstAmount = (item.sgst / 100) * item.price * item.quantity;
      return acc + cgstAmount + sgstAmount;
    }, 0);

    const total = subtotal + tax;

    setBillData({
      date: new Date(),
      items: billItems,
      subtotal: subtotal,
      tax: tax,
      total: total,
      payment: { method: paymentMethod, reference: paymentReference },
      customer: { name: customerName, phone: customerPhone },
      billNumber: billNumber || 'N/A',
    });
  };

  useEffect(() => {
    calculateBill();
  }, [billItems, paymentMethod, paymentReference, customerName, customerPhone, billNumber]);

  const handleAddProduct = (product: Product) => {
    const existingItem = billItems.find(item => item.productId === product.id);
    if (existingItem) {
      const updatedItems = billItems.map(item =>
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      setBillItems(updatedItems);
    } else {
      const newItem: BillItem = {
        productId: product.id!,
        name: product.name,
        price: product.price,
        quantity: 1,
        hsn: product.hsn,
        amount: product.price,
        cgst: product.cgst,
        sgst: product.sgst,
      };
      setBillItems([...billItems, newItem]);
    }
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity < 0) return;
    const updatedItems = billItems.map(item =>
      item.productId === productId ? { ...item, quantity: quantity } : item
    );
    setBillItems(updatedItems);
  };

  const handleRemoveItem = (productId: number) => {
    const updatedItems = billItems.filter(item => item.productId !== productId);
    setBillItems(updatedItems);
  };

  const resetBill = () => {
    setBillItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMethod('cash');
    setPaymentReference('');
    setPrintOnSave(false);
    setBillPrinted(false);
    const now = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setBillNumber(`RB-${now.slice(-6)}-${random}`);
    setQrCodeDialogOpen(false);
  };

  const handlePrint = useReactToPrint({
    documentTitle: `Invoice-${billData.billNumber || ''}`,
    onAfterPrint: () => {
      setBillPrinted(true);
      setPrintDialogOpen(false);
    },
    contentRef: () => componentRef.current,
  });

  const handleCreateBill = async () => {
    if (billItems.length === 0) {
      toast.error('Cannot create an empty bill');
      return;
    }

    if (paymentMethod === 'upi') {
      setQrCodeDialogOpen(true);
      return;
    }

    saveBill();
  };

  const saveBill = async () => {
    try {
      await addBill(billData);
      toast.success(`Bill created successfully with bill number ${billNumber}`);

      if (printOnSave) {
        setPrintDialogOpen(true);
        setTimeout(() => {
          handlePrint();
        }, 300);
      } else {
        setTimeout(() => {
          resetBill();
        }, 300);
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error('Failed to create bill');
    }
  };

  const handleUpiPaymentComplete = () => {
    setQrCodeDialogOpen(false);
    saveBill();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Billing</h1>

      <Tabs defaultValue="new-bill" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="new-bill">New Bill</TabsTrigger>
          <TabsTrigger value="bill-history">Bill History</TabsTrigger>
        </TabsList>

        <TabsContent value="new-bill" className="space-y-4">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="w-full md:w-1/2 space-y-4">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <h2 className="text-xl font-semibold">Products</h2>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryFilter">Category Filter</Label>
                    <Select onValueChange={(value) => setCategoryFilter(value)} defaultValue="all">
                      <SelectTrigger id="categoryFilter" className="w-full">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="grocery">Grocery</SelectItem>
                        <SelectItem value="medical">Medical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-destructive">{error}</TableCell>
                        </TableRow>
                      ) : products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">No products found. Please add products in the Products section.</TableCell>
                        </TableRow>
                      ) : (
                        products.map(product => (
                          <ProductRow key={product.id} product={product} onAdd={handleAddProduct} />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="w-full md:w-1/2 space-y-4">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <h2 className="text-xl font-semibold">Bill Details</h2>
                  <div className="text-sm text-muted-foreground">
                    Bill Number: {billNumber}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      placeholder="Customer Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Customer Phone</Label>
                    <Input
                      id="customerPhone"
                      placeholder="Customer Phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billItems.map(item => (
                        <TableRow key={item.productId}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value))}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="destructive" onClick={() => handleRemoveItem(item.productId)}>Remove</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {billItems.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">No items in bill</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select 
                      onValueChange={(value) => setPaymentMethod(value as 'cash' | 'upi' | 'card')} 
                      defaultValue="cash"
                      value={paymentMethod}
                    >
                      <SelectTrigger id="paymentMethod" className="w-full">
                        <SelectValue placeholder="Select Payment Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod !== 'cash' && paymentMethod !== 'upi' && (
                    <div className="space-y-2">
                      <Label htmlFor="paymentReference">Payment Reference</Label>
                      <Input
                        id="paymentReference"
                        placeholder="Payment Reference"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="printOnSave">
                      <Input
                        type="checkbox"
                        id="printOnSave"
                        checked={printOnSave}
                        onChange={(e) => setPrintOnSave(e.target.checked)}
                        className="mr-2"
                      />
                      Print on Save
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold">Subtotal: ₹{billData.subtotal.toFixed(2)}</p>
                    <p className="font-semibold">Tax: ₹{billData.tax.toFixed(2)}</p>
                    <p className="text-xl font-bold">Total: ₹{billData.total.toFixed(2)}</p>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      className="w-full" 
                      onClick={handleCreateBill}
                      disabled={billItems.length === 0}
                    >
                      {paymentMethod === 'upi' ? (
                        <>
                          <QrCode className="mr-2 h-4 w-4" />
                          Generate QR Code
                        </>
                      ) : (
                        'Create Bill'
                      )}
                    </Button>
                    
                    {billItems.length > 0 && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setPrintDialogOpen(true);
                          setTimeout(() => {
                            handlePrint();
                          }, 300);
                        }}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bill-history">
          <BillHistory />
        </TabsContent>
      </Tabs>

      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Printing Invoice</DialogTitle>
          </DialogHeader>
          <p>Please wait while the invoice is being printed...</p>
        </DialogContent>
      </Dialog>

      <Dialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>UPI Payment</DialogTitle>
          </DialogHeader>
          <UPIQRCode 
            amount={billData.total} 
            billId={billNumber} 
            onPaymentComplete={handleUpiPaymentComplete}
          />
        </DialogContent>
      </Dialog>
      
      <div style={{ display: 'none' }}>
        <div ref={componentRef} className="p-4">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">{storeInfo?.name || 'Retail Store'}</h1>
            <p>{storeInfo?.address || 'Address not available'}</p>
            <p>Phone: {storeInfo?.phone || 'Phone not available'}</p>
            <p>GST: {storeInfo?.gst || 'GST not available'}</p>
          </div>

          <div className="flex justify-between mb-2">
            <div>
              <p>Bill Number: {billData.billNumber}</p>
              <p>Date: {new Date().toLocaleDateString()}</p>
            </div>
            <div>
              {customerName && <p>Customer: {customerName}</p>}
              {customerPhone && <p>Phone: {customerPhone}</p>}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billData.items.map(item => (
                <TableRow key={item.productId}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>₹{item.price.toFixed(2)}</TableCell>
                  <TableCell>₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="text-right mt-4">
            <p>Subtotal: ₹{billData.subtotal.toFixed(2)}</p>
            <p>Tax: ₹{billData.tax.toFixed(2)}</p>
            <h2 className="text-xl font-bold">Total: ₹{billData.total.toFixed(2)}</h2>
            <p>Payment Method: {billData.payment.method}</p>
            {billData.payment.reference && <p>Reference: {billData.payment.reference}</p>}
          </div>

          <div className="text-center mt-8">
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
