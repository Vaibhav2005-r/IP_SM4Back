import React, { useState, useEffect, useContext, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';
import {
  LayoutDashboard, Package, TrendingUp, DollarSign, BellRing, Settings,
  Search, Bot, Sparkles, FileText, ChevronRight, CheckCircle, AlertTriangle,
  ArrowUpRight, ArrowDownRight, X, Plus, RefreshCw, ShieldCheck,
  Moon, Sun, LogOut, User, Bell, Menu, ChevronDown, Download,
  Zap, Activity, PieChart as PieIcon, BarChart2, Eye, Edit3, Trash2,
  ToggleLeft, ToggleRight, IndianRupee, TrendingDown, Package2, Filter
} from 'lucide-react';

// ─── THEME ────────────────────────────────────────────────────────────────────
const ThemeContext = React.createContext();
const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(false);
  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      <div className={dark ? 'dark' : ''} style={{ minHeight: '100vh', background: dark ? '#0a0a0f' : '#f8fafc' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// ─── DATA CONTEXT ──────────────────────────────────────────────────────────────
const DataContext = React.createContext();
const DataProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProducts = () => {
    setLoading(true);
    fetch('http://localhost:8081/api/ims/products')
      .then(r => r.json())
      .then(data => {
        setProducts(data.map(p => ({
          id: p.id, name: p.name, category: p.category,
          price: parseFloat(p.price) || 0, stock: p.stock ?? 0,
          description: p.description || ''
        })));
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  };

  useEffect(() => { fetchProducts(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const recordSale = async (name, qty) => {
    const res = await fetch('http://localhost:8081/api/ims/sales', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName: name, quantity: parseInt(qty) })
    });
    const result = await res.json();
    setProducts(prev => prev.map(p => {
      if (p.name === name) {
        if (result.newStock < 20) showToast(`🚨 Low Stock Alert: ${name} (${result.newStock} left)`, 'critical');
        else showToast(`Sale recorded — ${name} × ${qty}`, 'success');
        return { ...p, stock: result.newStock };
      }
      return p;
    }));
    return result;
  };

  const restockProduct = async (name, qty) => {
    const res = await fetch('http://localhost:8081/api/ims/restock', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName: name, quantity: parseInt(qty) })
    });
    const result = await res.json();
    setProducts(prev => prev.map(p => p.name === name ? { ...p, stock: result.newStock } : p));
    showToast(`Restocked ${name} +${qty} units`, 'success');
    return result;
  };

  const applyAction = async (name, actionType) => {
    const res = await fetch('http://localhost:8081/api/ims/prices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName: name, actionType })
    });
    const result = await res.json();
    setProducts(prev => prev.map(p => p.name === name ? { ...p, price: parseFloat(result.newPrice) } : p));
    showToast(`Price updated for ${name}: ₹${parseFloat(result.newPrice).toFixed(2)}`, 'success');
    return result;
  };

  const createProduct = async (prod) => {
    const res = await fetch('http://localhost:8081/api/ims/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: prod.name, category: prod.category, price: parseFloat(prod.price) })
    });
    const data = await res.json();
    setProducts(prev => [{ ...data, stock: 0 }, ...prev]);
    showToast(`${prod.name} added to inventory!`, 'success');
  };

  return (
    <DataContext.Provider value={{ products, loading, recordSale, restockProduct, applyAction, createProduct, fetchProducts }}>
      {children}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-8 right-8 z-[999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border text-white font-semibold text-sm ${
              toast.type === 'critical'
                ? 'bg-red-500/90 border-red-400/50 shadow-red-500/30'
                : 'bg-slate-900/90 border-white/10 shadow-black/30'
            }`}
          >
            {toast.type === 'critical' ? <AlertTriangle size={18} className="animate-pulse" /> : <CheckCircle size={18} className="text-emerald-400" />}
            {toast.msg}
            <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </DataContext.Provider>
  );
};

// ─── SIDEBAR ───────────────────────────────────────────────────────────────────
const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: Package, label: 'Inventory', to: '/inventory' },
  { icon: TrendingUp, label: 'AI Market', to: '/ai-engine' },
  { icon: BarChart2, label: 'Analytics', to: '/analytics' },
  { icon: DollarSign, label: 'Finance', to: '/finance' },
  { icon: BellRing, label: 'Alerts', to: '/alerts' },
  { icon: ShieldCheck, label: 'Admin', to: '/admin' },
];

const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const { dark } = useContext(ThemeContext);
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed left-0 top-0 h-full z-40 flex flex-col border-r overflow-hidden ${
        dark ? 'bg-[#0d0d14] border-white/5' : 'bg-white border-gray-100'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
          <Zap size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <p className={`font-black text-sm tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>Vault AI</p>
              <p className="text-[10px] text-gray-400 font-medium">Inventory OS</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ icon: Icon, label, to }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link key={to} to={to}>
              <motion.div
                whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all relative ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                    : dark ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={19} className="flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-sm font-semibold whitespace-nowrap">
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`m-3 p-2 rounded-xl text-center transition-all ${dark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-50 text-gray-400'}`}
      >
        <Menu size={18} className="mx-auto" />
      </button>
    </motion.aside>
  );
};

// ─── TOPBAR ────────────────────────────────────────────────────────────────────
const Topbar = ({ collapsed }) => {
  const { dark, setDark } = useContext(ThemeContext);
  const [notifOpen, setNotifOpen] = useState(false);
  const { products } = useContext(DataContext);
  const lowStockCount = products.filter(p => p.stock < 20).length;

  return (
    <div className={`fixed top-0 right-0 z-30 flex items-center justify-between px-6 py-3 border-b backdrop-blur-xl ${
      dark ? 'bg-[#0d0d14]/90 border-white/5' : 'bg-white/90 border-gray-100'
    }`} style={{ left: collapsed ? 72 : 240, transition: 'left 0.3s' }}>
      <div className={`text-sm font-semibold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
        <span className={dark ? 'text-white' : 'text-gray-900'}>Good morning</span>, Vaibhav 👋
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setDark(!dark)}
          className={`p-2 rounded-xl transition-all ${dark ? 'bg-white/5 text-yellow-400 hover:bg-white/10' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)}
            className={`p-2 rounded-xl transition-all relative ${dark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            <Bell size={17} />
            {lowStockCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold animate-pulse">
                {lowStockCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className={`absolute right-0 top-12 w-72 rounded-2xl shadow-2xl border z-50 overflow-hidden ${
                  dark ? 'bg-[#13131f] border-white/10' : 'bg-white border-gray-100'
                }`}>
                <div className="p-4 border-b border-gray-100/10">
                  <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>Notifications</p>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {products.filter(p => p.stock < 20).slice(0, 5).map(p => (
                    <div key={p.id} className={`flex items-center gap-3 px-4 py-3 border-b ${dark ? 'border-white/5 hover:bg-white/3' : 'border-gray-50 hover:bg-gray-50'}`}>
                      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                      <div>
                        <p className={`text-xs font-semibold ${dark ? 'text-white' : 'text-gray-800'}`}>{p.name}</p>
                        <p className="text-[11px] text-red-500">{p.stock} units remaining</p>
                      </div>
                    </div>
                  ))}
                  {lowStockCount === 0 && <p className="text-center py-6 text-xs text-gray-400">All stock levels healthy ✅</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer ${dark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">V</div>
          <span className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-800'}`}>Vaibhav</span>
        </div>
      </div>
    </div>
  );
};

// ─── SHARED UI ATOMS ──────────────────────────────────────────────────────────
const Card = ({ children, className = '', dark }) => (
  <div className={`rounded-2xl border backdrop-blur-xl ${
    dark
      ? 'bg-white/[0.03] border-white/[0.07] shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
      : 'bg-white border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)]'
  } ${className}`}>
    {children}
  </div>
);

const Badge = ({ status }) => {
  const cfg = {
    'In Stock':  'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Low Stock': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Out of Stock': 'bg-red-50 text-red-600 border border-red-200 animate-pulse',
  };
  return <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${cfg[status] || cfg['In Stock']}`}>{status}</span>;
};

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200/60 rounded-xl ${className}`} />
);

const pageVariants = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }, exit: { opacity: 0, y: -8 } };

const PageWrapper = ({ children }) => (
  <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
    {children}
  </motion.div>
);

// ─── DASHBOARD ─────────────────────────────────────────────────────────────────
const salesData = [
  { month: 'Nov', sales: 3.2, profit: 1.1 }, { month: 'Dec', sales: 4.8, profit: 1.9 },
  { month: 'Jan', sales: 3.9, profit: 1.4 }, { month: 'Feb', sales: 5.6, profit: 2.3 },
  { month: 'Mar', sales: 4.2, profit: 1.8 }, { month: 'Apr', sales: 6.8, profit: 2.9 },
  { month: 'May (pred)', sales: 7.4, profit: 3.2 },
];

const Dashboard = () => {
  const { products, loading } = useContext(DataContext);
  const { dark } = useContext(ThemeContext);
  const [aiInsights, setAiInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStock = products.filter(p => p.stock < 20);
  const outOfStock = products.filter(p => p.stock === 0);
  const categories = [...new Set(products.map(p => p.category))];
  const catData = categories.map(c => ({
    name: c, value: products.filter(p => p.category === c).length
  }));
  const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const r = await fetch('http://localhost:8000/api/ai/financial-insights');
      const d = await r.json();
      setAiInsights(d.insights || []);
    } catch { setAiInsights(['Connect to AI service to view insights.']); }
    setInsightsLoading(false);
  };

  useEffect(() => { if (products.length > 0) fetchInsights(); }, [products.length]);

  const handleChat = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setQuery('');
    setChatHistory(h => [...h, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    try {
      const r = await fetch('http://localhost:8000/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });
      const d = await r.json();
      setChatHistory(h => [...h, { role: 'ai', text: d.response }]);
    } catch { setChatHistory(h => [...h, { role: 'ai', text: 'AI service unavailable.' }]); }
    setChatLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const kpis = [
    { title: 'Portfolio Value', value: `₹${(totalValue / 100000).toFixed(1)}L`, sub: `${products.length} products`, icon: IndianRupee, grad: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
    { title: 'Total Products', value: products.length, sub: `${categories.length} categories`, icon: Package, grad: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
    { title: 'Low Stock Alerts', value: lowStock.length, sub: `${outOfStock.length} out of stock`, icon: AlertTriangle, grad: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
    { title: 'Healthy Stock', value: `${((products.length - lowStock.length) / Math.max(products.length, 1) * 100).toFixed(0)}%`, sub: 'Inventory health score', icon: Activity, grad: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
  ];

  const topProducts = [...products].sort((a, b) => b.stock * b.price - a.stock * a.price).slice(0, 5);

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <motion.div key={k.title}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <Card dark={dark} className="p-5 relative overflow-hidden group cursor-default">
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${k.grad} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${k.grad} shadow-lg ${k.shadow}`}>
                    <k.icon size={20} className="text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <ArrowUpRight size={11} />12%
                  </span>
                </div>
                <p className={`text-xs font-medium mb-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{k.title}</p>
                {loading ? <Skeleton className="h-8 w-24" /> : (
                  <p className={`text-2xl font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>{k.value}</p>
                )}
                <p className={`text-[11px] mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{k.sub}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Sales Chart */}
          <Card dark={dark} className="xl:col-span-2 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Sales & Profit Trend</h3>
                <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Last 6 months + AI prediction</p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-semibold border border-indigo-100">AI Forecast</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#ffffff08' : '#f0f0f0'} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: dark ? '#555' : '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: dark ? '#555' : '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: dark ? '#13131f' : '#fff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="sales" name="Sales (₹L)" stroke="#6366f1" strokeWidth={2.5} fill="url(#salesGrad)" dot={false} />
                <Area type="monotone" dataKey="profit" name="Profit (₹L)" stroke="#10b981" strokeWidth={2.5} fill="url(#profitGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Category Pie */}
          <Card dark={dark} className="p-6">
            <h3 className={`font-bold mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>Category Mix</h3>
            <p className={`text-xs mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Product distribution</p>
            {loading ? <Skeleton className="h-40 w-full" /> : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: dark ? '#13131f' : '#fff', borderRadius: 10, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 space-y-1.5">
              {catData.slice(0, 4).map((c, i) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className={`text-[11px] font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{c.name}</span>
                  </div>
                  <span className={`text-[11px] font-bold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{c.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* AI Insights */}
          <Card dark={dark} className="p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>AI Insights</p>
                    <p className={`text-[10px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>llama3.2:3b · Local</p>
                  </div>
                </div>
                <button onClick={fetchInsights} className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}>
                  <RefreshCw size={13} className={insightsLoading ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="space-y-3">
                {insightsLoading ? [1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />) :
                  aiInsights.map((ins, i) => (
                    <div key={i} className={`flex gap-2.5 p-3 rounded-xl ${dark ? 'bg-white/5' : 'bg-indigo-50/50'}`}>
                      <Sparkles size={13} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                      <p className={`text-xs leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{ins}</p>
                    </div>
                  ))
                }
              </div>
              <button onClick={() => setShowCopilot(true)}
                className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2">
                <Bot size={13} /> Chat with Vault AI
              </button>
            </div>
          </Card>

          {/* Top Products */}
          <Card dark={dark} className="xl:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Top Products by Value</h3>
              <Link to="/inventory" className="text-xs text-indigo-500 font-semibold hover:underline flex items-center gap-1">View all <ChevronRight size={13} /></Link>
            </div>
            {loading ? [1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full mb-2" />) :
              topProducts.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-3 py-2.5 border-b last:border-0 ${dark ? 'border-white/5' : 'border-gray-50'}`}>
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-black text-xs">{i+1}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${dark ? 'text-white' : 'text-gray-800'}`}>{p.name}</p>
                    <p className={`text-[11px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{p.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>₹{(p.price * p.stock / 1000).toFixed(1)}K</p>
                    <Badge status={p.stock === 0 ? 'Out of Stock' : p.stock < 20 ? 'Low Stock' : 'In Stock'} />
                  </div>
                </div>
              ))
            }
          </Card>
        </div>

        {/* Low stock banner */}
        {lowStock.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 to-rose-500/5 border border-red-200/50 flex items-center gap-4">
            <AlertTriangle size={20} className="text-red-500 animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <p className={`font-bold text-sm ${dark ? 'text-red-400' : 'text-red-700'}`}>🚨 {lowStock.length} products need restocking</p>
              <p className={`text-xs mt-0.5 ${dark ? 'text-red-400/70' : 'text-red-600/70'}`}>{lowStock.slice(0,3).map(p => p.name).join(', ')}{lowStock.length > 3 ? ` +${lowStock.length-3} more` : ''}</p>
            </div>
            <Link to="/alerts" className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition whitespace-nowrap">View Alerts</Link>
          </motion.div>
        )}
      </div>

      {/* Copilot Modal */}
      <AnimatePresence>
        {showCopilot && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.92, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 40 }}
              className={`w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden ${dark ? 'bg-[#0d0d14] border-white/10' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-3 p-5 border-b border-white/5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600"><Bot size={18} className="text-white"/></div>
                <div className="flex-1">
                  <p className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Vault Copilot</p>
                  <p className="text-[10px] text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"/>llama3.2:3b running locally</p>
                </div>
                <button onClick={() => setShowCopilot(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={16}/></button>
              </div>
              <div className="h-64 overflow-y-auto p-4 space-y-3">
                {chatHistory.length === 0 && (
                  <div className={`text-center py-8 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Bot size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Ask me anything about your inventory...</p>
                  </div>
                )}
                {chatHistory.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
                        : dark ? 'bg-white/5 text-gray-300 border border-white/10' : 'bg-gray-100 text-gray-700'
                    }`}>{m.text}</div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-1.5 px-4 py-3 bg-gray-100 rounded-2xl w-16">
                    {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}}/>)}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className={`flex gap-2 p-4 border-t ${dark ? 'border-white/5' : 'border-gray-100'}`}>
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()}
                  placeholder="Ask about stock, sales, trends..."
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm outline-none border ${dark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                <button onClick={handleChat} disabled={chatLoading}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50">
                  {chatLoading ? '...' : '→'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

// ─── INVENTORY PAGE ────────────────────────────────────────────────────────────
const ProductActionRow = ({ p, i, recordSale, restockProduct }) => {
  const { dark } = useContext(ThemeContext);
  const [open, setOpen] = useState(false);
  const [restockQty, setRestockQty] = useState('');
  const [sellQty, setSellQty] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAI = async () => {
    setAiLoading(true);
    try {
      const r = await fetch('http://localhost:8000/api/ai/chat', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ query: `Product "${p.name}", category ${p.category}, stock ${p.stock} units at ₹${p.price}. Output ONLY a single integer restock quantity.` })
      });
      const d = await r.json();
      const n = parseInt(d.response.match(/\d+/)?.[0]);
      if (!isNaN(n)) setRestockQty(String(n));
    } catch { setRestockQty('30'); }
    setAiLoading(false);
  };

  const status = p.stock === 0 ? 'Out of Stock' : p.stock < 20 ? 'Low Stock' : 'In Stock';

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}
        onClick={() => setOpen(!open)}
        className={`cursor-pointer border-b transition-colors ${dark ? 'border-white/5 hover:bg-white/[0.03]' : 'border-gray-50 hover:bg-indigo-50/40'}`}>
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-black text-xs flex-shrink-0">{p.name.charAt(0)}</div>
            <div>
              <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-800'}`}>{p.name}</p>
              <p className={`text-[11px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{p.id}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5"><span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${dark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{p.category}</span></td>
        <td className={`px-4 py-3.5 font-mono font-semibold text-sm ${dark ? 'text-white' : 'text-gray-800'}`}>₹{p.price.toFixed(2)}</td>
        <td className={`px-4 py-3.5 font-bold text-sm ${p.stock < 20 ? 'text-red-500' : dark ? 'text-white' : 'text-gray-800'}`}>{p.stock}</td>
        <td className="px-4 py-3.5"><Badge status={status} /></td>
        <td className="px-4 py-3.5 text-right"><span className={`text-xs font-semibold ${dark ? 'text-indigo-400' : 'text-indigo-500'}`}>{open ? '▲' : '▼'}</span></td>
      </motion.tr>
      <AnimatePresence>
        {open && (
          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <td colSpan={6} className="px-5 pb-3">
              <div onClick={e => e.stopPropagation()}
                className={`p-4 rounded-2xl flex flex-col sm:flex-row gap-5 border ${dark ? 'bg-white/[0.03] border-white/5' : 'bg-gradient-to-r from-indigo-50/50 to-white border-indigo-100'}`}>
                <div className="flex-1 space-y-2">
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Restock</p>
                  <div className="flex gap-2">
                    <input type="number" min="1" value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder="Qty"
                      className={`w-20 px-3 py-2 rounded-xl text-sm font-bold border outline-none ${dark ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                    <button onClick={fetchAI} disabled={aiLoading}
                      className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-200 flex items-center gap-1 disabled:opacity-50">
                      <Bot size={12}/> {aiLoading ? '...' : 'AI'}
                    </button>
                    <button onClick={() => { if(restockQty > 0) { restockProduct(p.name, restockQty); setOpen(false); }}}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700">
                      + Restock {restockQty && `(${restockQty})`}
                    </button>
                  </div>
                  {restockQty && <p className={`text-[11px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{p.stock} → <b className="text-emerald-600">{p.stock + parseInt(restockQty||0)}</b></p>}
                </div>
                <div className="w-px bg-gray-200 hidden sm:block" />
                <div className="flex-1 space-y-2">
                  <p className={`text-[11px] font-bold uppercase tracking-wider ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Sell</p>
                  <div className="flex gap-2">
                    <input type="number" min="1" max={p.stock} value={sellQty} onChange={e => setSellQty(e.target.value)} placeholder="Qty"
                      className={`w-24 px-3 py-2 rounded-xl text-sm font-bold border outline-none ${dark ? 'bg-white/10 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                    <button onClick={() => { if(sellQty > 0 && parseInt(sellQty) <= p.stock) { recordSale(p.name, sellQty); setSellQty(''); setOpen(false); }}}
                      className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700">
                      − Sell {sellQty && `(${sellQty})`}
                    </button>
                  </div>
                  {sellQty > 0 && <p className={`text-[11px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Revenue: <b className="text-indigo-600">₹{(sellQty * p.price).toLocaleString('en-IN')}</b>{parseInt(sellQty) > p.stock && <span className="text-red-500 ml-2">Exceeds stock!</span>}</p>}
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
};

const InventoryPage = () => {
  const { products, loading, recordSale, restockProduct, createProduct } = useContext(DataContext);
  const { dark } = useContext(ThemeContext);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [newProd, setNewProd] = useState({ name:'', category:'FMCG', price:'' });

  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    const status = p.stock === 0 ? 'Out of Stock' : p.stock < 20 ? 'Low Stock' : 'In Stock';
    const matchStatus = statusFilter === 'All' || status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <PageWrapper>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>Inventory Matrix</h1>
            <p className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Click a row to expand actions · {products.length} products tracked</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:opacity-90 transition-all">
            <Plus size={16} /> Add Product
          </button>
        </div>

        <Card dark={dark} className="p-5">
          <div className="flex flex-wrap gap-3 mb-5">
            <div className={`flex items-center gap-2 flex-1 min-w-[180px] px-4 py-2.5 rounded-xl border ${dark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                className={`flex-1 text-sm bg-transparent outline-none ${dark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} />
            </div>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className={`px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none cursor-pointer ${dark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className={`px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none cursor-pointer ${dark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              {['All','In Stock','Low Stock','Out of Stock'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${dark ? 'text-gray-500 border-white/5' : 'text-gray-400 border-gray-100'}`}>
                  {['Product','Category','Price (₹)','Stock','Status','Actions'].map(h => (
                    <th key={h} className={`py-3 text-left ${h==='Actions'?'text-right':''} ${['Price (₹)','Stock'].includes(h)?'px-4':'px-5'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? [1,2,3,4,5].map(i => (
                  <tr key={i}><td colSpan={6} className="py-2 px-5"><Skeleton className="h-12 w-full" /></td></tr>
                )) : filtered.map((p, i) => (
                  <ProductActionRow key={p.id} p={p} i={i} recordSale={recordSale} restockProduct={restockProduct} />
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={6} className={`text-center py-16 text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                    No products match your filters.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className={`w-full max-w-md rounded-3xl border shadow-2xl p-7 ${dark ? 'bg-[#0d0d14] border-white/10' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Add New Product</h2>
                <button onClick={() => setShowModal(false)} className={`p-2 rounded-xl ${dark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}><X size={16}/></button>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Product Name', key: 'name', type: 'text', placeholder: 'e.g. Tata Salt Premium' },
                  { label: 'Category', key: 'category', type: 'text', placeholder: 'FMCG / Electronics / etc.' },
                  { label: 'Price (₹)', key: 'price', type: 'number', placeholder: '0.00' },
                ].map(f => (
                  <div key={f.key}>
                    <label className={`block text-xs font-semibold mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={newProd[f.key]}
                      onChange={e => setNewProd({...newProd, [f.key]: e.target.value})}
                      className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${dark ? 'bg-white/5 border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-7">
                <button onClick={() => setShowModal(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${dark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  Cancel
                </button>
                <button onClick={() => { createProduct(newProd); setShowModal(false); setNewProd({name:'',category:'FMCG',price:''}); }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 transition-all">
                  Launch Product
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

// ─── ANALYTICS PAGE ────────────────────────────────────────────────────────────
const AnalyticsPage = () => {
  const { products } = useContext(DataContext);
  const { dark } = useContext(ThemeContext);
  const catRevenue = [...new Set(products.map(p => p.category))].map(c => ({
    category: c,
    value: products.filter(p => p.category === c).reduce((s, p) => s + p.price * p.stock, 0)
  })).sort((a, b) => b.value - a.value);

  const monthlyData = [
    { m: 'Oct', rev: 42000, cost: 28000, profit: 14000 },
    { m: 'Nov', rev: 58000, cost: 35000, profit: 23000 },
    { m: 'Dec', rev: 71000, cost: 41000, profit: 30000 },
    { m: 'Jan', rev: 55000, cost: 33000, profit: 22000 },
    { m: 'Feb', rev: 68000, cost: 38000, profit: 30000 },
    { m: 'Mar', rev: 82000, cost: 45000, profit: 37000 },
    { m: 'Apr', rev: 95000, cost: 52000, profit: 43000 },
    { m: 'May (AI)', rev: 110000, cost: 58000, profit: 52000 },
  ];

  const downloadReport = async () => {
    const res = await fetch('http://localhost:8000/api/reports/pdf');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `inventory_report_${new Date().toISOString().slice(0,10)}.pdf`;
    a.click();
  };

  return (
    <PageWrapper>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Analytics & Reports</h1>
            <p className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Trends, forecasts, and AI-generated business insights</p>
          </div>
          <button onClick={downloadReport}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:opacity-90">
            <Download size={15} /> Export PDF
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card dark={dark} className="p-6">
            <h3 className={`font-bold mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>Monthly Revenue vs Profit</h3>
            <p className={`text-xs mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Last 7 months + May prediction</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#ffffff08' : '#f0f0f0'} vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: dark ? '#555' : '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: dark ? '#555' : '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}K`} />
                <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} contentStyle={{ background: dark ? '#13131f' : '#fff', border: '1px solid #e5e7eb', borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="rev" name="Revenue" fill="url(#revGrad)" radius={[5,5,0,0]} />
                <Bar dataKey="profit" name="Profit" fill="url(#profGrad)" radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card dark={dark} className="p-6">
            <h3 className={`font-bold mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>Revenue by Category</h3>
            <p className={`text-xs mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Current inventory value distribution</p>
            <div className="space-y-3">
              {catRevenue.slice(0,6).map((c, i) => {
                const max = catRevenue[0]?.value || 1;
                const pct = (c.value / max) * 100;
                const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6'];
                return (
                  <div key={c.category}>
                    <div className="flex justify-between mb-1">
                      <span className={`text-xs font-semibold ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{c.category}</span>
                      <span className={`text-xs font-bold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>₹{(c.value/100000).toFixed(1)}L</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${dark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full rounded-full" style={{ background: colors[i] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

// ─── FINANCE PAGE ──────────────────────────────────────────────────────────────
const FinancePage = () => {
  const { products } = useContext(DataContext);
  const { dark } = useContext(ThemeContext);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);

  const totalAssets = products.reduce((s, p) => s + p.price * p.stock, 0);
  const cgst = totalAssets * 0.09;
  const sgst = totalAssets * 0.09;
  const totalGST = cgst + sgst;
  const netProfit = totalAssets * 0.22;
  const netLoss = totalAssets * 0.04;
  const balance = totalAssets - totalGST;

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const r = await fetch('http://localhost:8000/api/ai/financial-insights');
      const d = await r.json();
      setInsights(d.insights || []);
    } catch { setInsights(['AI service unavailable. Ensure Ollama is running.']); }
    setLoading(false);
  };
  useEffect(() => { fetchInsights(); }, []);

  const finCards = [
    { title: 'Total Assets', value: `₹${(totalAssets/100000).toFixed(2)}L`, sub: 'Gross inventory value', color: 'from-blue-500 to-indigo-600', icon: IndianRupee },
    { title: 'Estimated Profit', value: `₹${(netProfit/100000).toFixed(2)}L`, sub: '~22% margin', color: 'from-emerald-500 to-teal-600', icon: TrendingUp },
    { title: 'Estimated Loss', value: `₹${(netLoss/100000).toFixed(2)}L`, sub: '~4% write-offs', color: 'from-rose-500 to-red-600', icon: TrendingDown },
    { title: 'GST Liability', value: `₹${(totalGST/100000).toFixed(2)}L`, sub: 'CGST 9% + SGST 9%', color: 'from-amber-500 to-orange-500', icon: FileText },
    { title: 'Net Balance', value: `₹${(balance/100000).toFixed(2)}L`, sub: 'Post-tax net value', color: 'from-violet-500 to-purple-600', icon: Activity },
  ];

  return (
    <PageWrapper>
      <div className="space-y-5">
        <h1 className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Finance Dashboard</h1>

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          {finCards.map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -3 }}>
              <Card dark={dark} className="p-5 relative overflow-hidden group">
                <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-xl group-hover:opacity-20 transition-opacity`} />
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${c.color} w-fit mb-3 shadow-lg`}><c.icon size={16} className="text-white"/></div>
                <p className={`text-[11px] font-medium mb-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{c.title}</p>
                <p className={`text-xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>{c.value}</p>
                <p className={`text-[10px] mt-0.5 ${dark ? 'text-gray-600' : 'text-gray-400'}`}>{c.sub}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* GST Breakdown */}
          <Card dark={dark} className="p-6">
            <h3 className={`font-bold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>GST Breakdown</h3>
            {[
              { label: 'Gross Inventory Value', value: totalAssets, color: 'text-gray-800' },
              { label: 'CGST @ 9%', value: cgst, color: 'text-amber-600' },
              { label: 'SGST @ 9%', value: sgst, color: 'text-amber-600' },
              { label: 'Total GST Liability', value: totalGST, color: 'text-red-600' },
              { label: 'Net Taxable Value', value: balance, color: 'text-emerald-600' },
            ].map(r => (
              <div key={r.label} className={`flex justify-between items-center py-3 border-b ${dark ? 'border-white/5' : 'border-gray-50'}`}>
                <span className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{r.label}</span>
                <span className={`font-bold text-sm ${dark ? 'text-white' : r.color}`}>₹{r.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            ))}
          </Card>

          {/* AI Financial Insights */}
          <Card dark={dark} className="p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600"><Bot size={16} className="text-white"/></div>
                  <div>
                    <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>AI Financial Insights</p>
                    <p className="text-[10px] text-gray-400">Powered by LLaMA 3.2 · Local</p>
                  </div>
                </div>
                <button onClick={fetchInsights} className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}>
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
              <div className="space-y-3">
                {loading ? [1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />) :
                  insights.map((ins, i) => (
                    <div key={i} className={`flex gap-3 p-4 rounded-xl ${dark ? 'bg-white/5' : 'bg-gradient-to-r from-indigo-50 to-white'}`}>
                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                      <p className={`text-xs leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{ins}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

// ─── ALERTS PAGE ───────────────────────────────────────────────────────────────
const AlertsPage = () => {
  const { products } = useContext(DataContext);
  const { dark } = useContext(ThemeContext);
  const [emailOn, setEmailOn] = useState(true);
  const [whatsappOn, setWhatsappOn] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());

  const lowStock = products.filter(p => p.stock > 0 && p.stock < 20 && !dismissed.has(p.id));
  const outOfStock = products.filter(p => p.stock === 0 && !dismissed.has(p.id));

  const Toggle = ({ on, setOn, label, icon: Icon }) => (
    <div className={`flex items-center justify-between p-4 rounded-2xl border ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
      <div className="flex items-center gap-3">
        <Icon size={18} className={on ? 'text-indigo-500' : 'text-gray-400'} />
        <div>
          <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-800'}`}>{label}</p>
          <p className={`text-[11px] ${on ? 'text-emerald-500' : dark ? 'text-gray-500' : 'text-gray-400'}`}>{on ? 'Active' : 'Disabled'}</p>
        </div>
      </div>
      <button onClick={() => setOn(!on)} className={`w-11 h-6 rounded-full relative transition-all ${on ? 'bg-indigo-600' : dark ? 'bg-white/10' : 'bg-gray-200'}`}>
        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${on ? 'left-6' : 'left-1'} shadow-sm`} />
      </button>
    </div>
  );

  const AlertCard = ({ p, priority }) => (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }} layout
      className={`flex items-center gap-4 p-4 rounded-2xl border relative overflow-hidden ${
        priority === 'critical'
          ? dark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
          : dark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
      }`}>
      {priority === 'critical' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l-2xl animate-pulse" />}
      <div className={`p-2.5 rounded-xl ${priority === 'critical' ? 'bg-red-100' : 'bg-amber-100'}`}>
        <AlertTriangle size={18} className={priority === 'critical' ? 'text-red-600' : 'text-amber-600'} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={`font-bold text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
            {priority === 'critical' ? 'CRITICAL' : 'LOW'}
          </span>
        </div>
        <p className={`text-xs mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
          Category: {p.category} · Stock: <b className="text-red-600">{p.stock} units</b> · Price: ₹{p.price.toFixed(2)}
        </p>
      </div>
      <button onClick={() => setDismissed(d => new Set([...d, p.id]))}
        className={`p-2 rounded-xl transition-all ${dark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-white text-gray-400'}`}>
        <X size={14} />
      </button>
    </motion.div>
  );

  return (
    <PageWrapper>
      <div className="space-y-5">
        <h1 className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Alert Center</h1>

        {/* Notification toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Toggle on={emailOn} setOn={setEmailOn} label="Email Notifications" icon={BellRing} />
          <Toggle on={whatsappOn} setOn={setWhatsappOn} label="WhatsApp Notifications" icon={Zap} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Critical', count: outOfStock.length, color: 'text-red-500', bg: dark ? 'bg-red-500/10' : 'bg-red-50' },
            { label: 'Low Stock', count: lowStock.length, color: 'text-amber-500', bg: dark ? 'bg-amber-500/10' : 'bg-amber-50' },
            { label: 'Healthy', count: products.length - outOfStock.length - lowStock.length, color: 'text-emerald-500', bg: dark ? 'bg-emerald-500/10' : 'bg-emerald-50' },
          ].map(s => (
            <Card key={s.label} dark={dark} className={`p-4 text-center ${s.bg}`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
              <p className={`text-xs font-semibold ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Alert lists */}
        <AnimatePresence>
          {outOfStock.length > 0 && (
            <Card dark={dark} className="p-5">
              <h3 className={`font-bold mb-3 flex items-center gap-2 text-red-600`}><AlertTriangle size={16} /> Out of Stock ({outOfStock.length})</h3>
              <div className="space-y-2">
                {outOfStock.map(p => <AlertCard key={p.id} p={p} priority="critical" />)}
              </div>
            </Card>
          )}
          {lowStock.length > 0 && (
            <Card dark={dark} className="p-5">
              <h3 className={`font-bold mb-3 flex items-center gap-2 text-amber-600`}><AlertTriangle size={16} /> Low Stock ({lowStock.length})</h3>
              <div className="space-y-2">
                {lowStock.map(p => <AlertCard key={p.id} p={p} priority="low" />)}
              </div>
            </Card>
          )}
          {outOfStock.length === 0 && lowStock.length === 0 && (
            <div className={`text-center py-16 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500 opacity-50" />
              <p className="text-sm font-semibold">All stock levels healthy!</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

// ─── AI MARKET ENGINE ──────────────────────────────────────────────────────────
const AIMarketPage = () => {
  const { products, applyAction } = useContext(DataContext);
  const { dark } = useContext(ThemeContext);
  const [analysis, setAnalysis] = useState([]);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    const sample = products.slice(0, 10);
    try {
      const res = await fetch('http://localhost:8000/api/ai/predict', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: sample.map(p => ({ name: p.name, category: p.category, price: p.price, stock: p.stock })) })
      });
      const d = await res.json();
      setAnalysis(d.results || []);
    } catch { }
    setLoading(false);
  };

  const DEMAND_COLOR = { HIGH: 'text-emerald-600 bg-emerald-50', MEDIUM: 'text-amber-600 bg-amber-50', LOW: 'text-red-600 bg-red-50' };

  return (
    <PageWrapper>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>AI Market Engine</h1>
            <p className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Random Forest demand forecasting · Semantic tracking · LLaMA insights</p>
          </div>
          <button onClick={runAnalysis} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:opacity-90 disabled:opacity-60">
            <Sparkles size={15} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analysing...' : 'Run Analysis'}
          </button>
        </div>

        {analysis.length > 0 ? (
          <Card dark={dark} className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className={`text-[11px] font-bold uppercase tracking-wider border-b ${dark ? 'text-gray-500 border-white/5' : 'text-gray-400 border-gray-100'}`}>
                  {['Product','Category','Demand','Confidence','Pricing Action','Apply'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.map((r, i) => (
                  <tr key={i} className={`border-b transition-colors ${dark ? 'border-white/5 hover:bg-white/3' : 'border-gray-50 hover:bg-indigo-50/30'}`}>
                    <td className={`px-5 py-3.5 font-semibold text-sm ${dark ? 'text-white' : 'text-gray-800'}`}>{r.product}</td>
                    <td className={`px-5 py-3.5 text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{r.semantic_category || r.category}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${DEMAND_COLOR[r.forecasted_demand] || 'text-gray-500 bg-gray-100'}`}>
                        {r.forecasted_demand}
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 text-sm font-semibold ${dark ? 'text-white' : 'text-gray-700'}`}>{r.confidence}</td>
                    <td className={`px-5 py-3.5 text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{r.recommended_pricing_action}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        <button onClick={() => applyAction(r.product, 'INCREASE_PRICE')}
                          className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-200 transition-all">+5%</button>
                        <button onClick={() => applyAction(r.product, 'DISCOUNT')}
                          className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold hover:bg-rose-200 transition-all">-10%</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card dark={dark} className="p-16 text-center">
            <Sparkles size={36} className="mx-auto mb-3 text-violet-400 opacity-40" />
            <p className={`text-sm font-semibold ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Run analysis to see AI demand predictions</p>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
};

// ─── ADMIN PAGE ────────────────────────────────────────────────────────────────
const AdminPage = () => {
  const { products, applyAction } = useContext(DataContext);
  const { dark } = useContext(ThemeContext);
  const [search, setSearch] = useState('');
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0,20);

  return (
    <PageWrapper>
      <div className="space-y-5">
        <h1 className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Admin Control Panel</h1>
        <Card dark={dark} className="p-5">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border mb-4 ${dark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <Search size={15} className="text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product to update price..."
              className={`flex-1 text-sm bg-transparent outline-none ${dark ? 'text-white placeholder-gray-500' : 'text-gray-900'}`} />
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className={`flex items-center gap-4 p-3.5 rounded-xl border ${dark ? 'border-white/5 hover:bg-white/3' : 'border-gray-100 hover:bg-gray-50'}`}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-black text-xs">{p.name.charAt(0)}</div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-800'}`}>{p.name}</p>
                  <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{p.category} · Stock: {p.stock}</p>
                </div>
                <p className={`font-mono font-bold ${dark ? 'text-white' : 'text-gray-700'}`}>₹{p.price.toFixed(2)}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => applyAction(p.name, 'INCREASE_PRICE')}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 flex items-center gap-1">
                    <ArrowUpRight size={11}/> +5%
                  </button>
                  <button onClick={() => applyAction(p.name, 'DISCOUNT')}
                    className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold hover:bg-rose-200 flex items-center gap-1">
                    <ArrowDownRight size={11}/> -10%
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
};

// ─── APP SHELL ─────────────────────────────────────────────────────────────────
const AppShell = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { dark } = useContext(ThemeContext);
  const location = useLocation();

  return (
    <div className={`min-h-screen font-sans ${dark ? 'bg-[#0a0a0f] text-white' : 'bg-slate-50 text-gray-900'}`}
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Topbar collapsed={collapsed} />
      <main className="transition-all pt-16 pb-8 px-6 min-h-screen" style={{ marginLeft: collapsed ? 72 : 240 }}>
        <div className="max-w-7xl mx-auto pt-6">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/ai-engine" element={<AIMarketPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>

      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    </div>
  );
};

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <DataProvider>
          <AppShell />
        </DataProvider>
      </ThemeProvider>
    </Router>
  );
}
