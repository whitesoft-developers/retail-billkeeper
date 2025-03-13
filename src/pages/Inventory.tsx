
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Search } from 'lucide-react';
import { InventoryItem, Product, useInventory, useProducts } from '@/lib/db';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ProductFormDialog from '@/components/ProductFormDialog';
import InventoryFormDialog from '@/components/InventoryFormDialog';
import AddStockForm from '@/components/AddStockForm';
import ProductBatchViewer from '@/components/ProductBatchViewer';
import { toast } from 'sonner';

const Inventory = () => {
  // Product state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  
  // Inventory state
  const [inventoryFormOpen, setInventoryFormOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<(InventoryItem & { product?: Product }) | undefined>();
  
  // Stock management state
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [productForStock, setProductForStock] = useState<Product | null>(null);
  const [batchViewerOpen, setBatchViewerOpen] = useState(false);
  
  // Fetch data hooks
  const { products, loading: productsLoading, addProduct, updateProduct } = useProducts({ query: searchQuery });
  const { inventory, loading: inventoryLoading, updateInventoryItem } = useInventory();
  
  // Handle product form submission
  const handleSaveProduct = async (product: Product) => {
    try {
      if (product.id) {
        await updateProduct(product);
        toast.success(`Updated ${product.name}`);
      } else {
        await addProduct(product);
        toast.success(`Added ${product.name}`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };
  
  // Handle inventory form submission
  const handleSaveInventory = async (item: InventoryItem) => {
    try {
      await updateInventoryItem(item);
      toast.success('Updated inventory');
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast.error('Failed to update inventory');
    }
  };
  
  // Handle adding a new inventory item for a product
  const handleAddInventory = (productId: number) => {
    setSelectedInventoryItem(undefined);
    setInventoryFormOpen(true);
    // Find existing inventory for this product
    const existingItem = inventory.find(item => item.productId === productId);
    if (existingItem) {
      setSelectedInventoryItem(existingItem);
    } else {
      // Prepare for new inventory item
      setSelectedInventoryItem({
        productId: productId,
        quantity: 0,
        location: '',
        lowStockThreshold: 5,
        batchId: `BATCH-${Date.now().toString().slice(-6)}`,
        product: products.find(p => p.id === productId)
      });
    }
  };
  
  // Handle opening stock management
  const handleAddStock = (product: Product) => {
    setProductForStock(product);
    setAddStockOpen(true);
  };
  
  // Handle opening batch viewer
  const handleViewBatches = (product: Product) => {
    setProductForStock(product);
    setBatchViewerOpen(true);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Button onClick={() => setProductFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>
      
      <div className="flex w-full items-center space-x-2 mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products by name or barcode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>
      
      <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="space-y-4">
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2 h-28">
                    <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-9 w-full bg-gray-200 rounded"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.length === 0 ? (
                searchQuery ? (
                  <div className="col-span-full text-center p-8">
                    <p className="text-lg text-muted-foreground">No products found matching '{searchQuery}'</p>
                  </div>
                ) : (
                  <div className="col-span-full text-center p-8">
                    <p className="text-lg text-muted-foreground">No products added yet. Click 'Add Product' to get started.</p>
                  </div>
                )
              ) : (
                products.map((product) => {
                  const inventoryItem = inventory.find(i => i.productId === product.id);
                  const isLowStock = inventoryItem ? 
                    inventoryItem.quantity <= inventoryItem.lowStockThreshold : true;
                  
                  return (
                    <Card key={product.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {product.name}
                              {isLowStock && <Badge variant="destructive">Low Stock</Badge>}
                            </CardTitle>
                            <CardDescription>{product.category}</CardDescription>
                          </div>
                          <div>
                            <Badge variant="outline">₹{product.price.toFixed(2)}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="text-sm">
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Barcode:</span>
                            <span>{product.barcode || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">HSN:</span>
                            <span>{product.hsn || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">Stock:</span>
                            <span className={isLowStock ? 'text-destructive font-medium' : ''}>
                              {inventoryItem ? inventoryItem.quantity : 'Not tracked'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedProduct(product);
                            setProductFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <div className="flex-1 flex gap-2">
                          <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => handleAddStock(product)}
                          >
                            Add Stock
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewBatches(product)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Group products by category and display counts */}
            {Object.entries(
              products.reduce((acc, product) => {
                const category = product.category || 'Uncategorized';
                acc[category] = (acc[category] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([category, count]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{count} product{count !== 1 ? 's' : ''}</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery(category);
                      setActiveTab('products');
                    }}
                  >
                    View All
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="low-stock">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory
              .filter(item => item.quantity <= item.lowStockThreshold)
              .map(item => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return null;
                
                return (
                  <Card key={`${item.productId}-${item.location}-${item.batchId}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {product.name}
                        <Badge variant="destructive">Low Stock</Badge>
                      </CardTitle>
                      <CardDescription>{product.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Stock:</span>
                          <span className="text-destructive font-medium">{item.quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Threshold:</span>
                          <span>{item.lowStockThreshold}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span>{item.location}</span>
                        </div>
                        {item.expiryDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Expires:</span>
                            <span>{new Date(item.expiryDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={() => handleAddStock(product)}
                        className="w-full"
                      >
                        Restock
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Product Form Dialog */}
      <ProductFormDialog
        open={productFormOpen}
        onOpenChange={setProductFormOpen}
        onSave={handleSaveProduct}
        product={selectedProduct}
        title={selectedProduct ? "Edit Product" : "Add Product"}
      />
      
      {/* Inventory Form Dialog */}
      <InventoryFormDialog
        open={inventoryFormOpen}
        onOpenChange={setInventoryFormOpen}
        onSave={handleSaveInventory}
        inventoryItem={selectedInventoryItem}
        title="Update Inventory"
      />
      
      {/* Add Stock Form */}
      {productForStock && (
        <AddStockForm
          open={addStockOpen}
          onOpenChange={setAddStockOpen}
          product={productForStock}
          onComplete={() => {
            setProductForStock(null);
          }}
        />
      )}
      
      {/* Product Batch Viewer */}
      {productForStock && (
        <ProductBatchViewer
          product={productForStock}
          open={batchViewerOpen}
          onOpenChange={setBatchViewerOpen}
          onEditInventory={(item) => {
            setSelectedInventoryItem(item);
            setInventoryFormOpen(true);
            setBatchViewerOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Inventory;
