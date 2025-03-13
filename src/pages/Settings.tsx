
import { useState, useRef, ChangeEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStoreSettings, StoreInfo } from '@/lib/db';
import { toast } from 'sonner';
import { Loader2, Upload, Image } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

const Settings = () => {
  const { storeInfo, loading, updateStoreInfo } = useStoreSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<StoreInfo>({
    id: 'storeInfo',
    name: '',
    address: '',
    phone: '',
    email: '',
    gst: '',
    upiId: '',
    logo: '',
    billWidth: 80,  // Default thermal receipt width: 80mm
    billHeight: 200, // Default height
  });
  
  // Update form when storeInfo is loaded
  if (!loading && storeInfo && formData.name === '') {
    setFormData({
      ...storeInfo,
      billWidth: storeInfo.billWidth || 80,
      billHeight: storeInfo.billHeight || 200,
    });
    
    if (storeInfo.logo) {
      setLogo(storeInfo.logo);
    }
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      // Include logo in the data if it exists
      await updateStoreInfo({
        ...formData,
        logo: logo || formData.logo || '',
      });
      toast.success("Store settings updated successfully");
    } catch (error) {
      console.error("Error updating store settings:", error);
      toast.error("Failed to update store settings");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
      toast.error("Logo image must be smaller than 1MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogo(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleBillWidthChange = (value: number[]) => {
    setFormData(prev => ({
      ...prev,
      billWidth: value[0]
    }));
  };
  
  const handleBillHeightChange = (value: number[]) => {
    setFormData(prev => ({
      ...prev,
      billHeight: value[0]
    }));
  };
  
  if (loading) {
    return (
      <div className="container py-6 flex justify-center items-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>
      
      <Tabs defaultValue="store" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="store">Store Information</TabsTrigger>
          <TabsTrigger value="billing">Billing Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="store">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter store name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo">Store Logo</Label>
                  <div className="flex flex-col items-center space-y-3">
                    {logo && (
                      <div className="border rounded p-2 w-full flex justify-center">
                        <img src={logo} alt="Store Logo" className="h-24 object-contain" />
                      </div>
                    )}
                    
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {logo ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                      
                      {logo && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="ml-2 text-destructive"
                          onClick={() => setLogo(null)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter store address"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gst">GST Number</Label>
                    <Input
                      id="gst"
                      name="gst"
                      value={formData.gst}
                      onChange={handleChange}
                      placeholder="Enter GST number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleChange}
                      placeholder="Enter UPI ID for payments"
                    />
                  </div>
                </div>
              </div>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="billing">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Bill Format Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure the dimensions of your thermal receipt printer output.
                  </p>
                  
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label htmlFor="billWidth">Bill Width (mm): {formData.billWidth}mm</Label>
                      </div>
                      <Slider
                        id="billWidth"
                        min={50}
                        max={110}
                        step={1}
                        value={[formData.billWidth]}
                        onValueChange={handleBillWidthChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Standard thermal receipt widths: 58mm, 80mm (most common)
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label htmlFor="billHeight">Min Bill Height (mm): {formData.billHeight}mm</Label>
                      </div>
                      <Slider
                        id="billHeight"
                        min={100}
                        max={300}
                        step={10}
                        value={[formData.billHeight]}
                        onValueChange={handleBillHeightChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        The actual bill length will adjust based on content. This sets the minimum.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
