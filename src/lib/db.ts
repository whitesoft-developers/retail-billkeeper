
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/sonner';

// Initialize the SQLite database
export const initDatabase = async () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      toast.error("Your browser doesn't support a stable version of IndexedDB.");
      reject("IndexedDB not supported");
      return;
    }

    // Open the database
    const request = window.indexedDB.open('RetailBillingDB', 1);

    request.onerror = (event) => {
      toast.error("Database error: Unable to open database");
      reject("Database error");
    };

    // Create the schema if needed
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create Products store
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
        productStore.createIndex('name', 'name', { unique: false });
        productStore.createIndex('category', 'category', { unique: false });
        productStore.createIndex('barcode', 'barcode', { unique: true });
      }
      
      // Create Inventory store
      if (!db.objectStoreNames.contains('inventory')) {
        const inventoryStore = db.createObjectStore('inventory', { keyPath: 'productId' });
        inventoryStore.createIndex('quantity', 'quantity', { unique: false });
        inventoryStore.createIndex('location', 'location', { unique: false });
      }
      
      // Create Bills store
      if (!db.objectStoreNames.contains('bills')) {
        const billsStore = db.createObjectStore('bills', { keyPath: 'id', autoIncrement: true });
        billsStore.createIndex('date', 'date', { unique: false });
        billsStore.createIndex('total', 'total', { unique: false });
      }
      
      // Create Settings store
      if (!db.objectStoreNames.contains('settings')) {
        const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
      }
      
      // Add example data (for development only)
      const transaction = (event.target as IDBOpenDBRequest).transaction;
      
      if (transaction) {
        const productStore = transaction.objectStore('products');
        const inventoryStore = transaction.objectStore('inventory');
        const settingsStore = transaction.objectStore('settings');

        // Add sample products
        [
          { id: 1, name: 'Paracetamol', category: 'medical', price: 15.50, barcode: '8901234567890', hsn: '30049099' },
          { id: 2, name: 'USB Cable', category: 'electronics', price: 199.99, barcode: '8901234567891', hsn: '85444999' },
          { id: 3, name: 'Rice 1kg', category: 'grocery', price: 60.00, barcode: '8901234567892', hsn: '10063090' },
        ].forEach(product => {
          productStore.add(product);
          
          // Add inventory entry for each product
          inventoryStore.add({
            productId: product.id,
            quantity: Math.floor(Math.random() * 50) + 5,
            location: `Shelf ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 10) + 1}`,
            lowStockThreshold: 10
          });
        });
        
        // Add default settings
        settingsStore.add({
          id: 'storeInfo',
          name: 'My Retail Store',
          address: '123 Market Street, City',
          phone: '9876543210',
          email: 'store@example.com',
          gst: '22AAAAA0000A1Z5',
          upiId: 'store@upi'
        });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
  });
};

// Product type
export interface Product {
  id?: number;
  name: string;
  category: string;
  price: number;
  barcode: string;
  hsn: string;
}

// Inventory type
export interface InventoryItem {
  productId: number;
  quantity: number;
  location: string;
  lowStockThreshold: number;
}

// Bill type
export interface Bill {
  id?: number;
  date: Date;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment: {
    method: 'cash' | 'upi' | 'card';
    reference?: string;
  };
  customer?: {
    name?: string;
    phone?: string;
  };
}

// Bill item type
export interface BillItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  hsn: string;
  amount: number;
}

// Store Info type
export interface StoreInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  gst: string;
  upiId: string;
}

// Generic database operation - Get all items from a store
export const getAllItems = async <T>(storeName: string): Promise<T[]> => {
  try {
    const db = await initDatabase();
    return new Promise<T[]>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        toast.error(`Error retrieving ${storeName}`);
        reject(`Error retrieving ${storeName}`);
      };
    });
  } catch (error) {
    console.error(`Database error in getAllItems (${storeName}):`, error);
    toast.error(`Database error: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
};

// Get item by id
export const getItemById = async <T>(storeName: string, id: number | string): Promise<T | null> => {
  try {
    const db = await initDatabase();
    return new Promise<T | null>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        toast.error(`Error retrieving item from ${storeName}`);
        reject(`Error retrieving item from ${storeName}`);
      };
    });
  } catch (error) {
    console.error(`Database error in getItemById (${storeName}):`, error);
    toast.error(`Database error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
};

// Add item
export const addItem = async <T>(storeName: string, item: T): Promise<number | string> => {
  try {
    const db = await initDatabase();
    return new Promise<number | string>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => {
        toast.success(`Item added to ${storeName}`);
        resolve(request.result as number | string);
      };

      request.onerror = () => {
        toast.error(`Error adding item to ${storeName}`);
        reject(`Error adding item to ${storeName}`);
      };
    });
  } catch (error) {
    console.error(`Database error in addItem (${storeName}):`, error);
    toast.error(`Database error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Update item
export const updateItem = async <T>(storeName: string, item: T, id?: number | string): Promise<void> => {
  try {
    const db = await initDatabase();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // If id is provided separately (for stores without keyPath in the item)
      const request = id !== undefined ? store.put(item, id) : store.put(item);

      request.onsuccess = () => {
        toast.success(`Item updated in ${storeName}`);
        resolve();
      };

      request.onerror = () => {
        toast.error(`Error updating item in ${storeName}`);
        reject(`Error updating item in ${storeName}`);
      };
    });
  } catch (error) {
    console.error(`Database error in updateItem (${storeName}):`, error);
    toast.error(`Database error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Delete item
export const deleteItem = async (storeName: string, id: number | string): Promise<void> => {
  try {
    const db = await initDatabase();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        toast.success(`Item deleted from ${storeName}`);
        resolve();
      };

      request.onerror = () => {
        toast.error(`Error deleting item from ${storeName}`);
        reject(`Error deleting item from ${storeName}`);
      };
    });
  } catch (error) {
    console.error(`Database error in deleteItem (${storeName}):`, error);
    toast.error(`Database error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

// Custom hook for retrieving and managing products with optional filters
export const useProducts = (filter?: { category?: string; query?: string }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const allProducts = await getAllItems<Product>('products');
      
      let filteredProducts = allProducts;
      
      // Apply category filter if provided
      if (filter?.category) {
        filteredProducts = filteredProducts.filter(p => 
          p.category.toLowerCase() === filter.category!.toLowerCase()
        );
      }
      
      // Apply search query if provided
      if (filter?.query) {
        const query = filter.query.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.barcode.includes(query)
        );
      }
      
      setProducts(filteredProducts);
      setError(null);
    } catch (err) {
      setError(`Failed to load products: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error in useProducts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filter?.category, filter?.query]);

  const addProduct = async (product: Product) => {
    try {
      await addItem<Product>('products', product);
      fetchProducts();
    } catch (err) {
      console.error('Error adding product:', err);
      throw err;
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      if (!product.id) throw new Error('Product ID is required for updates');
      await updateItem<Product>('products', product);
      fetchProducts();
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      await deleteItem('products', id);
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  return { products, loading, error, addProduct, updateProduct, deleteProduct, refresh: fetchProducts };
};

// Custom hook for retrieving and managing inventory
export const useInventory = (lowStockOnly = false) => {
  const [inventory, setInventory] = useState<(InventoryItem & { product?: Product })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const inventoryItems = await getAllItems<InventoryItem>('inventory');
      const products = await getAllItems<Product>('products');
      
      // Join inventory with products
      const fullInventory = inventoryItems.map(item => {
        const product = products.find(p => p.id === item.productId);
        return { ...item, product };
      });
      
      // Filter for low stock if requested
      const filteredInventory = lowStockOnly 
        ? fullInventory.filter(item => item.quantity <= item.lowStockThreshold)
        : fullInventory;
      
      setInventory(filteredInventory);
      setError(null);
    } catch (err) {
      setError(`Failed to load inventory: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error in useInventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [lowStockOnly]);

  const updateInventoryItem = async (item: InventoryItem) => {
    try {
      await updateItem<InventoryItem>('inventory', item);
      fetchInventory();
    } catch (err) {
      console.error('Error updating inventory item:', err);
      throw err;
    }
  };

  return { inventory, loading, error, updateInventoryItem, refresh: fetchInventory };
};

// Custom hook for retrieving and managing bills
export const useBills = (filter?: { startDate?: Date; endDate?: Date }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const allBills = await getAllItems<Bill>('bills');
      
      let filteredBills = allBills;
      
      // Apply date filters if provided
      if (filter?.startDate || filter?.endDate) {
        filteredBills = filteredBills.filter(bill => {
          const billDate = new Date(bill.date);
          
          if (filter.startDate && billDate < filter.startDate) {
            return false;
          }
          
          if (filter.endDate) {
            // Add one day to include the end date fully
            const endDatePlusOne = new Date(filter.endDate);
            endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
            
            if (billDate >= endDatePlusOne) {
              return false;
            }
          }
          
          return true;
        });
      }
      
      // Sort bills by date (newest first)
      filteredBills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setBills(filteredBills);
      setError(null);
    } catch (err) {
      setError(`Failed to load bills: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error in useBills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [filter?.startDate, filter?.endDate]);

  const addBill = async (bill: Bill) => {
    try {
      const billWithDate = { ...bill, date: new Date() };
      await addItem<Bill>('bills', billWithDate);
      fetchBills();
      return true;
    } catch (err) {
      console.error('Error adding bill:', err);
      throw err;
    }
  };

  const getBill = async (id: number) => {
    try {
      return await getItemById<Bill>('bills', id);
    } catch (err) {
      console.error('Error getting bill:', err);
      throw err;
    }
  };

  return { bills, loading, error, addBill, getBill, refresh: fetchBills };
};

// Custom hook for store settings
export const useStoreSettings = () => {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStoreInfo = async () => {
    try {
      setLoading(true);
      const info = await getItemById<StoreInfo>('settings', 'storeInfo');
      setStoreInfo(info);
      setError(null);
    } catch (err) {
      setError(`Failed to load store information: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error in useStoreSettings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreInfo();
  }, []);

  const updateStoreInfo = async (info: StoreInfo) => {
    try {
      await updateItem<StoreInfo>('settings', { ...info, id: 'storeInfo' });
      fetchStoreInfo();
    } catch (err) {
      console.error('Error updating store info:', err);
      throw err;
    }
  };

  return { storeInfo, loading, error, updateStoreInfo };
};
