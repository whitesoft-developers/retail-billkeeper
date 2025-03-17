import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/Navbar';
import Index from '@/pages/Index';
import Billing from '@/pages/Billing';
import BillHistory from '@/pages/BillHistory';
import Inventory from '@/pages/Inventory';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import '@/App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/bill-history" element={<BillHistory />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
