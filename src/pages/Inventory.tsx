
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Edit, 
  MapPin,
  PackageCheck,
  Package
} from 'lucide-react';
import { useInventory, useProducts, Product, InventoryItem } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductFormDialog from '@/components/ProductFormDialog';
import InventoryFormDialog from '@/components/InventoryFormDialog';
import { toast } from 'sonner';

const Inventory = () => {
  const { inventory, loading: inventoryLoading, updateInventoryItem, refresh: refreshInventory } = useInventory();
  const { products, loading: productsLoading, addProduct, updateProduct, refresh: refreshProducts } = useProducts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [inventoryFormOpen, setInventoryFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<(InventoryItem & { product?: Product }) | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('inventory');
  
  const filteredInventory = searchTerm
    ? inventory.filter(item => 
        item.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product?.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : inventory;
  
  const filteredProducts = searchTerm
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;
  
  const handleAddProduct = () => {
    setSelectedProduct(undefined);
    setProductFormOpen(true);
  };
  
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductFormOpen(true);
  };
  
  const handleSaveProduct = async (product: Product) => {
    try {
      if (product.id) {
        await updateProduct(product);
        toast.success("Product updated successfully");
      } else {
        await addProduct(product);
        toast.success("Product added successfully");
      }
      refreshProducts();
      refreshInventory();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    }
  };
  
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
        product: products.find(p => p.id === productId)
      });
    }
  };
  
  const handleEditInventory = (item: InventoryItem & { product?: Product }) => {
    setSelectedInventoryItem(item);
    setInventoryFormOpen(true);
  };
  
  const handleSaveInventory = async (item: InventoryItem) => {
    try {
      await updateInventoryItem(item);
      toast.success("Inventory updated successfully");
      refreshInventory();
    } catch (error) {
      console.error("Error saving inventory:", error);
      toast.error("Failed to update inventory");
    }
  };
  
  const loading = inventoryLoading || productsLoading;
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => setActiveTab('products')} variant="outline">
            <Package className="h-4 w-4 mr-2" />
            Products
          </Button>
          <Button onClick={handleAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-4">
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
                <div className="grid grid-cols-7 font-medium text-xs uppercase text-muted-foreground">
                  <div className="col-span-2">Product</div>
                  <div>Category</div>
                  <div>Price</div>
                  <div>Quantity</div>
                  <div>Location</div>
                  <div>Actions</div>
                </div>
                
                <div className="divide-y">
                  {filteredInventory.map((item) => (
                    <div key={`${item.productId}-${item.location}`} className="grid grid-cols-7 py-3 items-center">
                      <div className="col-span-2 font-medium">{item.product?.name}</div>
                      <div className="text-muted-foreground">{item.product?.category || 'N/A'}</div>
                      <div>₹{item.product?.price.toFixed(2)}</div>
                      <div className={item.quantity <= (item.lowStockThreshold || 5) ? 'text-red-500 font-medium' : ''}>
                        {item.quantity}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
                        <span className="text-sm">{item.location}</span>
                      </div>
                      <div>
                        <Button variant="ghost" size="sm" onClick={() => handleEditInventory(item)}>
                          <Edit className="h-4 w-4 mr-1" />
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
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
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
            ) : filteredProducts.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-7 font-medium text-xs uppercase text-muted-foreground">
                  <div className="col-span-2">Product</div>
                  <div>Category</div>
                  <div>Price</div>
                  <div>HSN</div>
                  <div>Barcode</div>
                  <div>Actions</div>
                </div>
                
                <div className="divide-y">
                  {filteredProducts.map((product) => {
                    const inventoryItems = inventory.filter(item => item.productId === product.id);
                    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
                    
                    return (
                      <div key={product.id} className="grid grid-cols-7 py-3 items-center">
                        <div className="col-span-2 font-medium">
                          <div>{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {totalQuantity > 0 ? (
                              <Badge variant="outline" className="mt-1">
                                {totalQuantity} in stock
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 mt-1">
                                Out of stock
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-muted-foreground capitalize">{product.category}</div>
                        <div>₹{product.price.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{product.hsn || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{product.barcode || 'N/A'}</div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleAddInventory(product.id!)}>
                            <PackageCheck className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No products found</p>
              </div>
            )}
          </Card>
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
        productId={selectedInventoryItem?.productId}
        title={selectedInventoryItem?.quantity ? "Edit Inventory" : "Add Inventory"}
      />
    </div>
  );
};

export default Inventory;
