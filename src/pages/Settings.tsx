
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useStoreSettings } from '@/lib/db';
import { isValidUpiId } from '@/lib/upiUtils';
import { toast } from 'sonner';

const Settings = () => {
  const { storeInfo, updateStoreInfo, loading } = useStoreSettings();
  
  const [storeSettings, setStoreSettings] = useState({
    id: 'storeInfo',
    name: '',
    address: '',
    phone: '',
    email: '',
    upiId: '',
    gst: '',
  });
  
  // Update form when storeInfo is loaded
  useEffect(() => {
    if (storeInfo) {
      setStoreSettings({
        id: storeInfo.id,
        name: storeInfo.name,
        address: storeInfo.address,
        phone: storeInfo.phone,
        email: storeInfo.email,
        upiId: storeInfo.upiId,
        gst: storeInfo.gst,
      });
    }
  }, [storeInfo]);
  
  const handleSaveSettings = async () => {
    // Validate UPI ID
    if (storeSettings.upiId && !isValidUpiId(storeSettings.upiId)) {
      toast.error('Please enter a valid UPI ID (e.g., example@upi)');
      return;
    }
    
    try {
      await updateStoreInfo(storeSettings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStoreSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Store Information</h3>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={storeSettings.name}
                    onChange={handleInputChange}
                    placeholder="Enter store name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={storeSettings.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={storeSettings.address}
                  onChange={handleInputChange}
                  placeholder="Enter store address"
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={storeSettings.email}
                    onChange={handleInputChange}
                    placeholder="Enter email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gst">GST Number</Label>
                  <Input
                    id="gst"
                    name="gst"
                    value={storeSettings.gst}
                    onChange={handleInputChange}
                    placeholder="Enter GST number"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="payment" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Payment Settings</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  name="upiId"
                  value={storeSettings.upiId}
                  onChange={handleInputChange}
                  placeholder="yourname@upi"
                />
                <p className="text-sm text-muted-foreground">
                  Enter your UPI ID to enable QR code payments (e.g., yourname@okhdfcbank)
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Appearance Settings</h3>
            <p className="text-muted-foreground mb-4">
              Customize the appearance of your billing application.
            </p>
            
            <p className="text-sm text-muted-foreground mb-4">
              More appearance options coming soon.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={loading}>
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;
