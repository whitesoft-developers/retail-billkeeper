
// Fix missing batchId property when preparing a new inventory item
// Update the handleAddInventory function to include the batchId:

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
