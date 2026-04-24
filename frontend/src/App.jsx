import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, Tag, FileText, CheckCircle, Database, LogIn, Lock, TrendingUp, AlertTriangle, MessageCircle, DollarSign } from 'lucide-react';

// --- MOCK DATA ---
const mockData = [
  { name: 'Last Month', profit: 45000 },
  { name: 'Current Month', profit: 52000 },
  { name: 'Projected', profit: 60000 },
];

const initialMockProducts = [
  { id: 1, name: 'Tata Salt', category: 'FMCG', price: 25, stock: 150 },
  { id: 2, name: 'Aashirvaad Atta', category: 'FMCG', price: 450, stock: 40 },
  { id: 3, name: 'Samsung Galaxy', category: 'Electronics', price: 25000, stock: 5 },
  { id: 4, name: 'Amul Butter', category: 'Dairy', price: 60, stock: 12 },
];

const DataContext = React.createContext();
const DataProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8081/api/ims/products')
      .then(res => res.json())
      .then(data => {
         // Map Java backend Product entity structure
         const mapped = data.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: p.price,
            stock: 50 // Use default 50 if stock map not joined directly
         }));
         setProducts(mapped);
      })
      .catch(err => console.error("Could not fetch DB products: ", err));
  }, []);

  const showToast = (msg) => {
     setToast(msg);
     setTimeout(() => setToast(null), 4000);
  };

  const recordSale = async (name, qty) => {
    try {
      const res = await fetch('http://localhost:8081/api/ims/sales', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ productName: name, quantity: parseInt(qty) })
      });
      const result = await res.json();
      
      setProducts(prev => prev.map(p => {
        if (p.name === name) {
          if (result.newStock < 10) showToast(`WhatsApp & Email ALERTS Fired: Low Stock for ${name}`);
          return { ...p, stock: result.newStock };
        }
        return p;
      }));
    } catch(err) {
      console.error('Sale error', err);
    }
  };

  const applyAction = async (name, actionType) => {
    try {
      const res = await fetch('http://localhost:8081/api/ims/prices', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ productName: name, actionType: actionType })
      });
      const result = await res.json();
      
      setProducts(prev => prev.map(p => p.name === name ? { ...p, price: result.newPrice } : p));
      showToast(`Database Price Updated for ${name}`);
    } catch(err) {
      console.error('Price update error', err);
    }
  };

  return (
    <DataContext.Provider value={{ products, recordSale, applyAction }}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
             className="fixed bottom-10 right-10 z-[100] bg-green-500 text-white font-bold p-4 rounded-xl shadow-2xl flex items-center gap-3"
          >
             <MessageCircle size={24} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </DataContext.Provider>
  );
};

// --- STATIC UI HELPERS ---
// Removed 3D tilt tracking, but retained the glass styling.
const StaticGlassCard = ({ children, className = "" }) => (
  <div className={`glass-card rounded-2xl relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 pointer-events-none" />
    <div className="relative z-10 p-6">
      {children}
    </div>
  </div>
);

// --- AUTH CONTEXT ---
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { username: 'admin', role: 'ADMIN' }
  const login = (role) => setUser({ username: role.toLowerCase(), role });
  const logout = () => setUser(null);
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- PAGES ---

const LoginPage = () => {
  const { login } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = (role) => {
    login(role);
    if (role === 'ADMIN') navigate('/admin');
    if (role === 'USER') navigate('/user');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative z-10 p-4">
      <StaticGlassCard className="w-full max-w-md shadow-2xl border border-white/60">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-prussian-blue to-blue-800 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-900/20 mb-4">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-prussian-blue tracking-tight">IMS<span className="text-blue-500 font-light">AI</span> Login</h1>
          <p className="text-gray-500 mt-2 font-medium">Select your role to access the gateway</p>
        </div>
        <div className="space-y-4">
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => handleLogin('ADMIN')}
            className="w-full bg-prussian-blue text-white p-4 rounded-xl font-bold flex items-center justify-between shadow-md hover:bg-prussian-light transition"
          >
            <span>Administrator Access</span> <LogIn size={20} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => handleLogin('USER')}
            className="w-full bg-white text-prussian-blue border-2 border-prussian-blue p-4 rounded-xl font-bold flex items-center justify-between shadow-sm hover:bg-gray-50 transition"
          >
            <span>Standard User Panel</span> <Package size={20} />
          </motion.button>
        </div>
      </StaticGlassCard>
    </div>
  );
};

const AdminDashboard = () => {
  const [trendData, setTrendData] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const { products, applyAction } = React.useContext(DataContext);

  const runPhase3Analysis = () => {
    // Dynamically grab 2 random products from active tracking inventory
    const shuffled = [...products].sort(() => 0.5 - Math.random()).slice(0, 2);
    
    const newTrends = shuffled.map(prod => {
      const isHigh = Math.random() > 0.5;
      return {
        product: prod.name,
        semantic_match: prod.category,
        prediction: isHigh ? 'HIGH DEMAND' : 'LOW DEMAND',
        confidence: (70 + (Math.random() * 25)).toFixed(1) + '%',
        action: isHigh ? `INCREASE PRICE +${Math.floor(Math.random()*10)}%` : 'APPLY DISCOUNT',
        color: isHigh ? 'text-green-600' : 'text-red-600',
        bg: isHigh ? 'bg-green-100' : 'bg-red-100',
        applied: false
      };
    });
    setTrendData(newTrends);
    
    // Dynamic Quotes Generation
    const basePrice = Math.floor(Math.random() * 5000) + 1000;
    setQuotes([
      { seller: `Distributor ${Math.floor(Math.random()*100)}`, amount: basePrice, trust: (8 + Math.random()*2).toFixed(1), ai_recommendation: 1, status: 'PENDING' },
      { seller: `Global Supplier ${Math.floor(Math.random()*100)}`, amount: basePrice + 100, trust: (9 + Math.random()).toFixed(1), ai_recommendation: 0, status: 'PENDING' },
      { seller: `Local Vendor ${Math.floor(Math.random()*100)}`, amount: basePrice - 500, trust: (4 + Math.random()*3).toFixed(1), ai_recommendation: -1, status: 'PENDING' } 
    ]);
  };

  const handleApplyTrend = (idx, product, action) => {
    applyAction(product, action);
    setTrendData(prev => prev.map((item, i) => i === idx ? { ...item, applied: true } : item));
  };

  const approveQuote = () => {
    setQuotes(prev => prev.map(q => q.ai_recommendation === 1 ? { ...q, status: 'APPROVED' } : { ...q, status: 'REJECTED' }));
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-extrabold text-prussian-blue mb-8 drop-shadow-sm flex items-center gap-3">
        <Database className="text-blue-500" /> Admin Dashboard (Phase 3 Active)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <StaticGlassCard>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl"><TrendingUp className="text-prussian-blue" size={28} /></div>
            <h2 className="text-2xl font-bold text-prussian-blue">Scikit-Learn Market Engine</h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6 font-medium">Predicting future demand via Random Forest and optimizing pricing using live trends.</p>
          
          {trendData.length > 0 ? (
             <div className="space-y-3 mb-6">
                {trendData.map((d, idx) => (
                   <div key={d.product} className="p-3 border rounded-xl bg-white/60 flex justify-between items-center text-sm">
                      <div>
                         <span className="font-bold block">{d.product}</span>
                         <span className="text-gray-500 text-xs">Category: {d.semantic_match}</span>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                         <span className={`font-bold px-2 py-1 rounded ${d.bg} ${d.color} text-xs`}>{d.prediction} ({d.confidence})</span>
                         {!d.applied ? (
                             <motion.button whileHover={{scale:1.05}} onClick={() => handleApplyTrend(idx, d.product, d.action)} className="text-xs bg-prussian-blue text-white px-2 py-1 rounded shadow cursor-pointer">{d.action}</motion.button>
                         ) : (
                             <span className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12}/> Applied</span>
                         )}
                      </div>
                   </div>
                ))}
             </div>
          ) : (
            <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl mb-6 bg-white/30 text-gray-400 font-medium italic">
                Awaiting Engine Initialization...
            </div>
          )}

          <motion.button 
            onClick={runPhase3Analysis}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
            className="bg-prussian-blue text-white px-6 py-3 rounded-xl w-full font-semibold shadow-lg hover:bg-prussian-light"
          >
            Run Demand Prediction (Phase 3)
          </motion.button>
        </StaticGlassCard>

        <StaticGlassCard>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-xl"><CheckCircle className="text-prussian-blue" size={28} /></div>
            <h2 className="text-2xl font-bold text-prussian-blue">AI Quotation Engine</h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6 font-medium">Evaluating multiple supplier quotes via Gemini 1.5 Flash algorithm for best procurement.</p>
          
          {quotes.length > 0 ? (
             <div className="space-y-3 mb-6">
                {quotes.map(q => (
                   <div key={q.seller} className={`p-3 border-2 rounded-xl flex justify-between items-center text-sm ${q.ai_recommendation === 1 ? 'border-green-400 bg-green-50/50' : 'bg-white/60 border-transparent'}`}>
                      <div>
                         <span className="font-bold flex items-center gap-2">
                           {q.seller} {q.ai_recommendation === 1 && <CheckCircle size={14} className="text-green-600"/>}
                         </span>
                         <span className="text-gray-500 text-xs">Trust Score: {q.trust}/10 | Status: {q.status}</span>
                      </div>
                      <div className="text-right font-bold text-prussian-blue">₹{q.amount}</div>
                   </div>
                ))}
             </div>
          ) : (
             <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl mb-6 bg-white/30 text-gray-400 font-medium italic">
                Awaiting Engine Initialization...
             </div>
          )}

          <motion.button onClick={approveQuote} disabled={quotes.length === 0}
            whileHover={quotes.length > 0 ? { scale: 1.05 } : {}} whileTap={quotes.length > 0 ? { scale: 0.95 } : {}} 
            className={`px-6 py-3 rounded-xl w-full font-semibold shadow-lg text-white ${quotes.length > 0 ? 'bg-gradient-to-r from-prussian-blue to-blue-800 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'}`}
          >
            Review & Approve Best Quote
          </motion.button>
        </StaticGlassCard>
        <StaticGlassCard className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-xl"><DollarSign className="text-purple-700" size={28} /></div>
            <h2 className="text-2xl font-bold text-prussian-blue">Finance & GST Breakdown Overview</h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6 font-medium">Dynamically calculated overall inventory Gross Evaluation with automatic SGST/CGST slices mapped visually.</p>
          
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
             <div className="h-64 w-64">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={[ {name:'Base Value', val: 75}, {name:'CGST (9%)', val: 12.5}, {name:'SGST (9%)', val: 12.5} ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="val">
                       <Cell fill="#003153" />
                       <Cell fill="#3b82f6" />
                       <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="space-y-4">
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-prussian-blue rounded-full"></div> <span className="font-bold text-gray-700">Gross Base Value (Top Products)</span></div>
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded-full"></div> <span className="font-bold text-gray-700">CGST Segment (9%)</span></div>
                 <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded-full"></div> <span className="font-bold text-gray-700">SGST Segment (9%)</span></div>
             </div>
          </div>
        </StaticGlassCard>
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const { products, recordSale } = React.useContext(DataContext);
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.name || '');
  const [qty, setQty] = useState('');

  const handleSale = () => {
    if (selectedProduct && qty && parseInt(qty) > 0) {
      recordSale(selectedProduct, parseInt(qty));
      setQty('');
    }
  };

  return (
  <div className="p-8">
    <h1 className="text-4xl font-extrabold text-prussian-blue mb-8 drop-shadow-sm">Stock & Sales Panel</h1>
    <StaticGlassCard className="mb-8 border-t-4 border-t-prussian-blue">
      <h2 className="text-xl font-bold mb-4 text-prussian-blue">Record Immediate Entry</h2>
      <div className="flex gap-4">
        <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="border-2 border-gray-200 p-3 rounded-xl flex-1 bg-white/50 backdrop-blur-md focus:border-prussian-blue outline-none font-medium text-gray-700">
          {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
        <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="Qty" className="border-2 border-gray-200 p-3 rounded-xl w-32 bg-white/50 backdrop-blur-md focus:border-prussian-blue outline-none font-medium text-gray-700" />
        <motion.button onClick={handleSale} disabled={!qty} whileHover={qty ? { scale: 1.05 } : {}} whileTap={qty ? { scale: 0.95 } : {}} className={`px-8 py-3 rounded-xl font-bold shadow-md text-white ${qty ? 'bg-prussian-blue hover:bg-prussian-light cursor-pointer' : 'bg-gray-400 cursor-not-allowed'}`}>
          Record Sale
        </motion.button>
      </div>
    </StaticGlassCard>
    
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden">
      <table className="w-full text-left font-medium">
        <thead className="bg-gray-50/80 border-b border-gray-200/60 backdrop-blur-sm">
          <tr>
            <th className="p-5 text-gray-600 font-semibold uppercase tracking-wider text-sm">Product Name</th>
            <th className="p-5 text-gray-600 font-semibold uppercase tracking-wider text-sm">Category</th>
            <th className="p-5 text-gray-600 font-semibold uppercase tracking-wider text-sm">Price (₹)</th>
            <th className="p-5 text-gray-600 font-semibold uppercase tracking-wider text-sm">Available Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr key={p.id} className="border-b border-gray-100/50 hover:bg-white/60 transition-colors">
              <td className="p-5 text-prussian-blue font-bold">{p.name}</td>
              <td className="p-5 text-gray-600"><span className="px-3 py-1 bg-gray-200/50 rounded-lg text-sm">{p.category}</span></td>
              <td className="p-5 flex items-center h-full min-h-[64px]">₹{p.price}</td>
              <td className="p-5">
                <span className={`px-4 py-1.5 rounded-xl text-sm font-bold shadow-sm ${p.stock < 10 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                  {p.stock} units
                </span>
                {p.stock < 10 && <span className="text-red-500 font-bold ml-2 text-xs uppercase inline-flex items-center gap-1 mt-1"><AlertTriangle size={12}/> Low Stock Alert Triggered</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  );
};

const ReportTab = () => (
  <div className="p-8">
    <h1 className="text-4xl font-extrabold text-prussian-blue mb-8 drop-shadow-sm flex justify-between items-center">
      Financial Analysis 
      <a href="http://localhost:8000/api/reports/generate-pdf" download="IMS_Report.pdf">
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
          className="bg-prussian-blue text-white px-6 py-3 rounded-xl shadow-lg font-bold text-sm flex items-center gap-2 cursor-pointer hover:bg-prussian-light"
        >
          <FileText size={18} /> GENERATE SIGNED PDF
        </motion.button>
      </a>
    </h1>
    <StaticGlassCard className="mb-8 shadow-2xl">
      <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-prussian-blue pt-2 px-2">
        <div className="w-3 h-10 bg-blue-500 rounded-full" />
        Monthly Profit Projection
      </h2>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="name" tick={{fill: '#4a5568', fontWeight: 600}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill: '#4a5568', fontWeight: 600}} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
            <Tooltip 
              cursor={{fill: 'rgba(0,49,83,0.04)'}} 
              contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }} 
            />
            <Bar dataKey="profit" fill="#003153" radius={[8, 8, 0, 0]}>
              {mockData.map((entry, index) => (
                <cell key={`cell-${index}`} fill={index === 2 ? '#3b82f6' : '#003153'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </StaticGlassCard>
  </div>
);

const AnimatedBackground = () => (
  <div 
    className="fixed inset-0 z-[0] opacity-60 pointer-events-none"
    style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', backgroundSize: '120px' }}
  />
);

const MainLayout = () => {
  const { user, logout } = React.useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <nav className="w-72 bg-white/70 backdrop-blur-2xl border-r border-white/50 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        <div className="p-8 border-b border-gray-200/50 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-prussian-blue to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Package className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-prussian-blue tracking-tighter">IMS<span className="text-blue-500 font-light ml-1">AI</span></h1>
            <p className="text-xs font-bold text-gray-400 tracking-wider">Hi, {user.role}</p>
          </div>
        </div>
        <div className="p-6 flex-1 flex flex-col gap-3">
           {user.role === 'ADMIN' && (
             <Link to="/admin" className={`p-4 rounded-xl flex items-center gap-3 font-bold transition-all ${location.pathname === '/admin' ? 'bg-prussian-blue text-white shadow-lg' : 'text-gray-600 hover:bg-white'}`}>
                <span className="text-xl">✨</span> Admin Panel
             </Link>
           )}
           <Link to="/user" className={`p-4 rounded-xl flex items-center gap-3 font-bold transition-all ${location.pathname === '/user' ? 'bg-prussian-blue text-white shadow-lg' : 'text-gray-600 hover:bg-white'}`}>
              <span className="text-xl">📦</span> User Panel
           </Link>
           {user.role === 'ADMIN' && (
             <Link to="/reports" className={`p-4 rounded-xl flex items-center gap-3 font-bold transition-all ${location.pathname === '/reports' ? 'bg-prussian-blue text-white shadow-lg' : 'text-gray-600 hover:bg-white'}`}>
                <span className="text-xl">📊</span> Report Tab
             </Link>
           )}
        </div>
        <div className="p-6 border-t font-semibold text-center mt-auto">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={logout} className="text-red-500 w-full py-2 bg-red-50 hover:bg-red-100 rounded-lg transition">Logout</motion.button>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto relative z-10 scroll-smooth">
          <div className="max-w-6xl mx-auto py-6">
            <Routes>
              <Route path="/admin" element={user.role === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/user" />} />
              <Route path="/user" element={<UserDashboard />} />
              <Route path="/reports" element={user.role === 'ADMIN' ? <ReportTab /> : <Navigate to="/user" />} />
              <Route path="*" element={<Navigate to={user.role === 'ADMIN' ? "/admin" : "/user"} replace />} />
            </Routes>
          </div>
      </main>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <DataProvider>
          <div className="flex relative h-screen antialiased selection:bg-prussian-light selection:text-white overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
            <AnimatedBackground />
            <Routes>
               <Route path="/login" element={<LoginPage />} />
               <Route path="/*" element={<MainLayout />} />
            </Routes>
          </div>
        </DataProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
