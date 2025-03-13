
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import LowStockAlert from "@/components/LowStockAlert";
import { useStoreSettings, useBills, useProducts, useInventory } from "@/lib/db";
import { Receipt, Package2, IndianRupee, ShoppingBag, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStat {
  label: string;
  value: string | number;
  description: string;
  icon: JSX.Element;
  change?: {
    value: number;
    isPositive: boolean;
  };
}

const Index = () => {
  const navigate = useNavigate();
  const { storeInfo } = useStoreSettings();
  const { bills } = useBills();
  const { products } = useProducts();
  const { inventory } = useInventory();
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  
  useEffect(() => {
    if (bills.length && products.length) {
      // Calculate total sales, today's sales
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      
      const allSales = bills.reduce((sum, bill) => sum + bill.total, 0);
      const todaySales = bills
        .filter(bill => new Date(bill.date) >= todayStart)
        .reduce((sum, bill) => sum + bill.total, 0);
      
      const yesterdaySales = bills
        .filter(bill => new Date(bill.date) >= yesterdayStart && new Date(bill.date) < todayStart)
        .reduce((sum, bill) => sum + bill.total, 0);
        
      const todayBillCount = bills.filter(bill => new Date(bill.date) >= todayStart).length;
      
      // Calculate total inventory value
      const inventoryValue = inventory.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product ? product.price * item.quantity : 0);
      }, 0);
      
      // Calculate low stock items
      const lowStockCount = inventory.filter(
        item => item.quantity <= item.lowStockThreshold
      ).length;
      
      setStats([
        {
          label: "Today's Sales",
          value: `₹${todaySales.toFixed(2)}`,
          description: `${todayBillCount} transactions today`,
          icon: <IndianRupee className="h-4 w-4" />,
          change: {
            value: yesterdaySales ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0,
            isPositive: todaySales >= yesterdaySales
          }
        },
        {
          label: "Total Sales",
          value: `₹${allSales.toFixed(2)}`,
          description: `${bills.length} total transactions`,
          icon: <ShoppingBag className="h-4 w-4" />
        },
        {
          label: "Inventory Value",
          value: `₹${inventoryValue.toFixed(2)}`,
          description: `${products.length} products`,
          icon: <Package2 className="h-4 w-4" />
        },
        {
          label: "Low Stock Items",
          value: lowStockCount,
          description: `${lowStockCount} items below threshold`,
          icon: <TrendingUp className="h-4 w-4" />
        }
      ]);
      
      // Prepare sales data for chart
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        return date;
      }).reverse();
      
      const chartData = last7Days.map(date => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const dayTotal = bills
          .filter(bill => {
            const billDate = new Date(bill.date);
            return billDate >= date && billDate < nextDay;
          })
          .reduce((sum, bill) => sum + bill.total, 0);
          
        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          sales: dayTotal
        };
      });
      
      setSalesData(chartData);
    }
  }, [bills, products, inventory]);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-primary">
            <IndianRupee className="h-3 w-3 inline mr-1" />
            {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-xl animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to {storeInfo?.name || 'Retail Billing'}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button
            variant="outline"
            className="flex items-center"
            onClick={() => navigate('/inventory')}
          >
            <Package2 className="mr-2 h-4 w-4" />
            Inventory
          </Button>
          <Button
            onClick={() => navigate('/billing')}
          >
            <Receipt className="mr-2 h-4 w-4" />
            New Bill
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="animate-scale-in" style={{ animationDelay: `${index * 50}ms` }}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className="bg-primary/10 p-2 rounded-full">
                  {stat.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription className="flex items-center mt-1">
                {stat.description}
                {stat.change && (
                  <span className={`ml-2 text-xs font-medium flex items-center ${
                    stat.change.isPositive ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {stat.change.isPositive ? '↑' : '↓'} {Math.abs(stat.change.value).toFixed(1)}%
                  </span>
                )}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="animate-fade-in" style={{ animationDelay: "200ms" }}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Sales Overview</CardTitle>
                <Button variant="outline" size="sm" className="h-8">
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  <span>Last 7 days</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <LowStockAlert />
          
          <Card className="animate-fade-in" style={{ animationDelay: "300ms" }}>
            <CardHeader>
              <CardTitle>Recent Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="bills">
                <TabsList className="w-full">
                  <TabsTrigger value="bills" className="flex-1">Recent Bills</TabsTrigger>
                  <TabsTrigger value="inventory" className="flex-1">Inventory</TabsTrigger>
                </TabsList>
                <TabsContent value="bills" className="mt-4 space-y-4">
                  {bills.slice(0, 5).map((bill, index) => (
                    <div key={bill.id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">Bill #{bill.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(bill.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="font-semibold">₹{bill.total.toFixed(2)}</div>
                    </div>
                  ))}
                  
                  {bills.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2 text-center">
                      No bills created yet
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="inventory" className="mt-4 space-y-4">
                  {inventory
                    .filter(item => item.product)
                    .sort((a, b) => a.quantity - b.quantity)
                    .slice(0, 5)
                    .map((item) => (
                      <div key={item.productId} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.location}
                          </p>
                        </div>
                        <div className={`font-semibold ${
                          item.quantity <= item.lowStockThreshold ? 'text-amber-500' : ''
                        }`}>
                          {item.quantity} left
                        </div>
                      </div>
                    ))}
                    
                    {inventory.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2 text-center">
                        No inventory items added yet
                      </p>
                    )}
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => navigate('/inventory')}>
                <Package2 className="mr-2 h-4 w-4" />
                View All Items
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
