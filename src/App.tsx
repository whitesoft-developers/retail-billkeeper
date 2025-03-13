
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Index from "./pages/Index";
import Billing from "./pages/Billing";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  
  useEffect(() => {
    // Initialize database on app load
    const initDb = async () => {
      try {
        const { initDatabase } = await import('./lib/db');
        await initDatabase();
        setIsDbInitialized(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };
    
    initDb();
  }, []);
  
  // Optional loading state while DB initializes
  if (!isDbInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse-subtle flex flex-col items-center space-y-2">
            <div className="bg-primary text-primary-foreground font-medium p-2 rounded text-lg">RB</div>
            <p className="text-muted-foreground">Initializing...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />
        <BrowserRouter>
          <Navbar />
          <div className="pt-16 pb-16 md:pb-0 min-h-screen">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
