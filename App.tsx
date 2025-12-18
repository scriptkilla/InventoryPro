import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Settings, 
  Search, 
  Bell, 
  Plus, 
  Trash2, 
  Edit3, 
  BrainCircuit, 
  TrendingUp, 
  MapPin, 
  ChevronRight, 
  Loader2, 
  X, 
  Scan, 
  Maximize, 
  Menu, 
  ChevronLeft, 
  BarChart3,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  MapPinned,
  Store,
  DollarSign,
  ShieldCheck,
  RotateCcw,
  Download,
  Image as ImageIcon,
  Upload,
  Hash,
  FileSpreadsheet,
  FileText,
  Database,
  QrCode,
  Images,
  Truck,
  Printer,
  Grid,
  Check,
  Moon,
  Sun,
  Camera,
  Wand2,
  History,
  FileUp,
  AlertOctagon,
  RefreshCw,
  Globe,
  ArrowRightLeft,
  Users,
  Shield,
  UserPlus,
  FileJson,
  FileCode,
  File as FileIcon
} from 'lucide-react';
import { Product, Category, Section, AppSettings, ActivityLog, User, UserRole } from './types';
import { geminiService } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BrowserMultiFormatReader } from '@zxing/browser';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
// @ts-ignore
import JsBarcode from 'jsbarcode';

// --- Constants ---

const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', description: 'Gadgets and computing devices' },
  { id: '2', name: 'Furniture', description: 'Office and home furniture' },
  { id: '3', name: 'Office Supplies', description: 'Stationery and daily tools' },
];

const INITIAL_LOCATIONS: string[] = [
  'Warehouse A', 'Warehouse B', 'Main Storefront', 'Showroom', 'Cold Storage'
];

const INITIAL_TEAM: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@inventorypro.ai', role: 'admin', avatarColor: 'bg-purple-500' },
  { id: '2', name: 'Stock Manager', email: 'manager@inventorypro.ai', role: 'editor', avatarColor: 'bg-blue-500' }
];

const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'InventoryPro AI',
  currency: '$',
  defaultLowStockThreshold: 10,
  enableAiFeatures: true,
  enableNotifications: true,
  theme: 'dark'
};

// --- Helper Functions ---

const getTotalQty = (stocks: Record<string, number> = {}) => {
  return Object.values(stocks).reduce((sum, q) => sum + (Number(q) || 0), 0);
};

// --- Helper Components ---

const Barcode: React.FC<{ value: string; className?: string }> = ({ value, className }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 14,
          fontOptions: "bold",
          background: 'transparent',
          lineColor: '#000000',
          margin: 10
        });
      } catch (err) {
        console.error("Barcode generation error:", err);
      }
    }
  }, [value]);

  if (!value) return null;

  return (
    <div className={`bg-white p-2 rounded-lg flex justify-center items-center ${className}`}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard: React.FC<{ label: string, value: string | number, icon: React.ReactNode, color: string, warning?: boolean }> = ({ label, value, icon, color, warning }) => (
  <div className={`bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border dark:border-slate-800 transition-all hover:shadow-2xl hover:-translate-y-1 duration-300 ${warning && value !== 0 && value !== '0' ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-900/10' : ''}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{label}</p>
        <h3 className={`text-3xl font-black tracking-tight ${warning && value !== 0 && value !== '0' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>{value}</h3>
      </div>
      <div className={`w-14 h-14 ${color} text-white rounded-2xl flex items-center justify-center shadow-xl transform rotate-3`}>{icon}</div>
    </div>
  </div>
);

const SidebarContent: React.FC<{ activeSection: Section, navigateTo: (s: Section) => void, storeName: string }> = ({ activeSection, navigateTo, storeName }) => (
  <div className="flex flex-col h-full">
    <div className="p-6 border-b border-slate-800 flex items-center gap-3">
      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg"><Package className="text-white" size={24} /></div>
      <h1 className="text-xl font-bold tracking-tight text-white truncate">{storeName}</h1>
    </div>
    <div className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
      <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeSection === 'dashboard'} onClick={() => navigateTo('dashboard')} />
      <NavItem icon={<Package size={20}/>} label="Inventory" active={activeSection === 'inventory'} onClick={() => navigateTo('inventory')} />
      <NavItem icon={<Tags size={20}/>} label="Categories" active={activeSection === 'categories'} onClick={() => navigateTo('categories')} />
      <NavItem icon={<MapPinned size={20}/>} label="Locations" active={activeSection === 'locations'} onClick={() => navigateTo('locations')} />
      <NavItem icon={<Printer size={20}/>} label="Print Center" active={activeSection === 'print'} onClick={() => navigateTo('print')} />
      <NavItem icon={<BrainCircuit size={20}/>} label="AI Research" active={activeSection === 'ai-research'} onClick={() => navigateTo('ai-research')} />
      <div className="pt-4 mt-4 border-t border-slate-800"><NavItem icon={<Settings size={20}/>} label="Settings" active={activeSection === 'settings'} onClick={() => navigateTo('settings')} /></div>
    </div>
  </div>
);

// --- View Sub-Components ---

const DashboardView: React.FC<{ stats: any, inventory: Product[], settings: AppSettings, logs: ActivityLog[] }> = ({ stats, inventory, settings, logs }) => {
  const chartData = useMemo(() => {
    return inventory.slice(0, 8).map(item => ({
      name: item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name,
      value: getTotalQty(item.locationStocks)
    }));
  }, [inventory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Assets" value={`${settings.currency}${stats.totalValue.toLocaleString()}`} icon={<DollarSign size={24} />} color="bg-blue-600" />
        <StatCard label="Total Items" value={stats.totalItems} icon={<Package size={24} />} color="bg-slate-900" />
        <StatCard label="Low Stock" value={stats.lowStock} icon={<AlertTriangle size={24} />} color="bg-amber-500" warning />
        <StatCard label="Out of Stock" value={stats.outOfStock} icon={<AlertCircle size={24} />} color="bg-red-500" warning />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border dark:border-slate-800">
          <h3 className="text-xl font-black mb-8">Stock Level Analytics</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={settings.theme === 'dark' ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value === 0 ? '#ef4444' : entry.value < 10 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border dark:border-slate-800">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2"><History size={20}/> Recent Activity</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            {logs.length > 0 ? logs.map(log => (
              <div key={log.id} className="flex gap-3 items-start group">
                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${log.type === 'add' ? 'bg-emerald-500' : log.type === 'delete' ? 'bg-red-500' : 'bg-blue-500'}`} />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{log.text}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            )) : <p className="text-center text-slate-400 py-10 font-bold uppercase tracking-widest text-xs">No activity recorded</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryView: React.FC<{ 
  inventory: Product[], 
  onAdd: () => void, 
  onEdit: (p: Product) => void, 
  onDelete: (id: string) => void, 
  onResearch: (p: Product, type: 'price' | 'maps') => void,
  onTransfer: (p: Product) => void,
  settings: AppSettings
}> = ({ inventory, onAdd, onEdit, onDelete, onResearch, onTransfer, settings }) => (
  <div className="space-y-6 animate-in slide-in-from-bottom-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><h2 className="text-3xl font-black">Inventory</h2><p className="text-slate-500 dark:text-slate-400 font-medium">Manage and monitor stock levels</p></div>
      <button onClick={onAdd} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"><Plus size={20} /><span>Add Product</span></button>
    </div>
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800"><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Product Info</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total Stock</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Price</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {inventory.length > 0 ? inventory.map(item => {
              const totalQty = getTotalQty(item.locationStocks);
              return (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border dark:border-slate-700 flex items-center justify-center">
                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="text-slate-300 dark:text-slate-600"><ImageIcon size={20} /></div>}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[150px]">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-1">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">{item.category}</span></td>
                  <td className="px-6 py-4">{totalQty <= 0 ? <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase"><AlertCircle size={12}/>Out of Stock</span> : totalQty <= item.minStock ? <span className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black uppercase"><AlertTriangle size={12}/>Low Stock</span> : <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase"><CheckCircle2 size={12}/>Optimal</span>}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-slate-100">{totalQty}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-slate-100">{settings.currency}{item.price.toFixed(2)}</td>
                  <td className="px-6 py-4"><div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => onTransfer(item)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all" title="Transfer Stock"><ArrowRightLeft size={18}/></button><button onClick={() => onResearch(item, 'price')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all" title="Market Price Analysis"><TrendingUp size={18}/></button><button onClick={() => onResearch(item, 'maps')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all" title="Find Suppliers"><MapPin size={18}/></button><button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-all" title="Edit"><Edit3 size={18}/></button><button onClick={() => onDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all" title="Delete"><Trash2 size={18}/></button></div></td>
                </tr>
              );
            }) : <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No products found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const CategoriesView: React.FC<{ 
  categories: Category[], 
  inventory: Product[], 
  onAdd: () => void, 
  onEdit: (c: Category) => void, 
  onDelete: (id: string) => void 
}> = ({ categories, inventory, onAdd, onEdit, onDelete }) => (
  <div className="space-y-6 animate-in slide-in-from-bottom-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><h2 className="text-3xl font-black">Categories</h2><p className="text-slate-500 dark:text-slate-400 font-medium">Organize your inventory catalog</p></div>
      <button onClick={onAdd} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"><Plus size={20} /><span>New Category</span></button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map(cat => {
        const itemCount = inventory.filter(p => p.category === cat.name).length;
        return (
          <div key={cat.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 space-y-6 group hover:shadow-2xl transition-all">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400"><Tags size={24}/></div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(cat)} className="p-2 text-slate-400 hover:text-amber-500 transition-colors"><Edit3 size={18}/></button>
                <button onClick={() => onDelete(cat.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black">{cat.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{cat.description}</p>
            </div>
            <div className="pt-6 border-t dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Products</span>
              <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-black">{itemCount} items</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const LocationsView: React.FC<{ 
  locations: string[], 
  inventory: Product[], 
  onAdd: () => void, 
  onDelete: (l: string) => void 
}> = ({ locations, inventory, onAdd, onDelete }) => (
  <div className="space-y-6 animate-in slide-in-from-bottom-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><h2 className="text-3xl font-black">Locations</h2><p className="text-slate-500 dark:text-slate-400 font-medium">Physical storage zones</p></div>
      <button onClick={onAdd} className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all"><Plus size={20} /><span>Add Zone</span></button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {locations.map(loc => {
        const itemCount = inventory.filter(p => p.locationStocks && (Number(p.locationStocks[loc]) || 0) > 0).length;
        const totalStock = inventory.reduce((sum, p) => sum + (Number(p.locationStocks?.[loc]) || 0), 0);
        return (
          <div key={loc} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 space-y-6 group hover:shadow-2xl transition-all">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400"><MapPin size={24}/></div>
              <button onClick={() => onDelete(loc)} className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
            </div>
            <h3 className="text-xl font-black">{loc}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">SKUs Here</p>
                <p className="text-lg font-black">{itemCount}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Items</p>
                <p className="text-lg font-black">{totalStock}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const AiResearchView: React.FC<{ 
  analysis: any, 
  isLoading: boolean, 
  onNavigate: (s: Section) => void 
}> = ({ analysis, isLoading, onNavigate }) => (
  <div className="space-y-6 animate-in slide-in-from-bottom-4">
    <div className="flex items-center gap-4">
      <button onClick={() => onNavigate('inventory')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"><ChevronLeft size={24}/></button>
      <div><h2 className="text-3xl font-black">Market Intelligence</h2><p className="text-slate-500 dark:text-slate-400 font-medium">Real-time AI research and sourcing</p></div>
    </div>
    
    {isLoading ? (
      <div className="bg-white dark:bg-slate-900 p-20 rounded-[3rem] border dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-600" size={60}/>
          <span className="absolute -top-2 -right-2 text-amber-500 animate-bounce">
            <Sparkles size={24}/>
          </span>
        </div>
        <div>
          <h3 className="text-xl font-black italic">Consulting the Oracle...</h3>
          <p className="text-slate-400 mt-2 font-medium max-w-xs">Our AI is currently scouring global markets and local maps for you.</p>
        </div>
      </div>
    ) : analysis ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-blue-100 dark:text-blue-900/20 transform translate-x-4 -translate-y-4"><BrainCircuit size={120}/></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-6"><Sparkles size={18} className="text-blue-600"/><span className="text-[10px] font-black uppercase tracking-widest text-blue-600">AI Summary</span></div>
              <div className="prose dark:prose-invert max-w-none"><p className="text-lg font-bold leading-relaxed">{analysis.text}</p></div>
            </div>
          </div>
          
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-6">
             <div className="flex items-center gap-2"><Globe className="text-emerald-400" size={18}/><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Information Sources</span></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {analysis.sources?.map((source: any, i: number) => {
                 const uri = source.web?.uri || source.maps?.uri;
                 const title = source.web?.title || source.maps?.title || 'Grounding Source';
                 if (!uri) return null;
                 return (
                   <a key={i} href={uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-slate-800 hover:bg-slate-700 transition-all rounded-2xl group">
                     <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Search size={14}/></div>
                     <span className="text-xs font-bold truncate">{title}</span>
                     <ChevronRight size={14} className="ml-auto text-slate-600"/>
                   </a>
                 );
               })}
               {(!analysis.sources || analysis.sources.length === 0) && <p className="text-slate-500 text-xs font-bold uppercase italic p-4">Direct AI synthesis from knowledge base</p>}
             </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-blue-600 p-8 rounded-[3rem] text-white shadow-xl shadow-blue-500/20">
            <h4 className="text-lg font-black mb-4 flex items-center gap-2"><TrendingUp size={20}/> Insights</h4>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm"><CheckCircle2 className="text-blue-200 shrink-0" size={18}/><span>Real-time price monitoring active</span></li>
              <li className="flex gap-3 text-sm"><CheckCircle2 className="text-blue-200 shrink-0" size={18}/><span>Competitive analysis generated</span></li>
              <li className="flex gap-3 text-sm"><CheckCircle2 className="text-blue-200 shrink-0" size={18}/><span>Supplier credibility checked</span></li>
            </ul>
          </div>
        </div>
      </div>
    ) : (
      <div className="bg-white dark:bg-slate-900 p-20 rounded-[3rem] border dark:border-slate-800 text-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Select a product from inventory to begin research</p>
      </div>
    )}
  </div>
);

const ScannerModal: React.FC<{ 
  onScan: (res: string) => void, 
  onClose: () => void, 
  title: string 
}> = ({ onScan, onClose, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let controls: any;

    const startScanner = async () => {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) return;
        
        const selectedDeviceId = videoInputDevices.find(d => d.label.toLowerCase().includes('back'))?.deviceId || videoInputDevices[0].deviceId;
        
        controls = await codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result) => {
          if (result) {
            onScan(result.getText());
          }
        });
      } catch (err) {
        console.error("Scanner error:", err);
      }
    };

    startScanner();

    return () => {
      if (controls) controls.stop();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-between items-center text-white">
          <h3 className="text-xl font-black uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X/></button>
        </div>
        <div className="relative aspect-square w-full bg-slate-800 rounded-[3rem] overflow-hidden border-4 border-blue-500 shadow-2xl shadow-blue-500/20">
          <video ref={videoRef} className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
            <div className="w-full h-full border-2 border-blue-400/50 rounded-2xl relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse" />
            </div>
          </div>
        </div>
        <p className="text-center text-slate-400 font-medium">Position the barcode or QR code within the frame</p>
      </div>
    </div>
  );
};

// --- App Component ---

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [inventory, setInventory] = useState<Product[]>(() => {
    const data = JSON.parse(localStorage.getItem('inventory') || '[]');
    // Migrate data if locationStocks doesn't exist
    return data.map((p: any) => {
      if (p.quantity !== undefined && !p.locationStocks) {
        return {
          ...p,
          locationStocks: { [p.location || 'Default']: p.quantity }
        };
      }
      return p;
    });
  });
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('categories') || JSON.stringify(INITIAL_CATEGORIES)));
  const [locations, setLocations] = useState<string[]>(() => JSON.parse(localStorage.getItem('locations') || JSON.stringify(INITIAL_LOCATIONS)));
  const [team, setTeam] = useState<User[]>(() => JSON.parse(localStorage.getItem('team_members') || JSON.stringify(INITIAL_TEAM)));
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  const [logs, setLogs] = useState<ActivityLog[]>(() => JSON.parse(localStorage.getItem('activity_logs') || '[]'));

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'search' | 'sku' | 'audit'>('search');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  // Modal Form State
  const [modalSku, setModalSku] = useState('');
  const [modalName, setModalName] = useState('');
  const [modalCategory, setModalCategory] = useState('');
  const [modalPrice, setModalPrice] = useState(0);
  const [modalLocationStocks, setModalLocationStocks] = useState<Record<string, number>>({});
  const [modalDescription, setModalDescription] = useState('');
  const [modalMinStock, setModalMinStock] = useState(5);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // User Modal State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('viewer');

  // Transfer Modal State
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState(1);

  // Import/Export Refs
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('locations', JSON.stringify(locations));
    localStorage.setItem('team_members', JSON.stringify(team));
    localStorage.setItem('app_settings', JSON.stringify(settings));
    localStorage.setItem('activity_logs', JSON.stringify(logs));
  }, [inventory, categories, locations, settings, logs, team]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.price * getTotalQty(item.locationStocks)), 0);
    const lowStock = inventory.filter(i => {
      const q = getTotalQty(i.locationStocks);
      return q > 0 && q <= i.minStock;
    }).length;
    const outOfStock = inventory.filter(i => getTotalQty(i.locationStocks) === 0).length;
    return { totalItems, totalValue, lowStock, outOfStock };
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return inventory.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [inventory, searchQuery]);

  const addLog = (text: string, type: ActivityLog['type']) => {
    setLogs(prev => [{ id: Date.now().toString(), text, timestamp: Date.now(), type }, ...prev].slice(0, 50));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: editingProduct?.id || Date.now().toString(),
      sku: modalSku,
      name: modalName,
      category: modalCategory || categories[0]?.name || '',
      locationStocks: modalLocationStocks,
      price: modalPrice,
      minStock: modalMinStock,
      description: modalDescription,
      image: modalImage || undefined,
      lastUpdated: new Date().toISOString()
    };
    if (editingProduct) {
      setInventory(prev => prev.map(p => p.id === product.id ? product : p));
      addLog(`Updated product: ${product.name}`, 'update');
    } else {
      setInventory(prev => [...prev, product]);
      addLog(`Added new product: ${product.name}`, 'add');
    }
    setIsModalOpen(false);
    setToast({ message: 'Saved successfully', type: 'success' });
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
    const newUser: User = {
      id: Date.now().toString(),
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      avatarColor: colors[Math.floor(Math.random() * colors.length)]
    };
    setTeam(prev => [...prev, newUser]);
    addLog(`Added team member: ${newUserName}`, 'update');
    setIsUserModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setToast({ message: 'Team member added', type: 'success' });
  };

  const handleRemoveUser = (id: string) => {
    const user = team.find(u => u.id === id);
    if (user?.role === 'admin' && team.filter(u => u.role === 'admin').length <= 1) {
      setToast({ message: 'Cannot remove the last admin', type: 'error' });
      return;
    }
    setTeam(prev => prev.filter(u => u.id !== id));
    addLog(`Removed team member: ${user?.name}`, 'delete');
    setToast({ message: 'Member removed', type: 'info' });
  };

  const handleUpdateUserRole = (id: string, role: UserRole) => {
    setTeam(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    setToast({ message: 'Role updated', type: 'success' });
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProduct || !transferFrom || !transferTo || transferAmount <= 0) return;
    
    const sourceQty = Number(transferProduct.locationStocks[transferFrom]) || 0;
    if (sourceQty < transferAmount) {
      setToast({ message: 'Insufficient stock in source location', type: 'error' });
      return;
    }

    setInventory(prev => prev.map(p => {
      if (p.id === transferProduct.id) {
        const newStocks = { ...p.locationStocks };
        newStocks[transferFrom] = (Number(newStocks[transferFrom]) || 0) - transferAmount;
        newStocks[transferTo] = (Number(newStocks[transferTo]) || 0) + transferAmount;
        return { ...p, locationStocks: newStocks };
      }
      return p;
    }));

    addLog(`Transferred ${transferAmount} of ${transferProduct.name} from ${transferFrom} to ${transferTo}`, 'update');
    setIsTransferModalOpen(false);
    setToast({ message: 'Transfer complete', type: 'success' });
  };

  const generateAutoSku = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    const prefix = modalCategory ? modalCategory.substring(0, 3).toUpperCase() : "SKU";
    setModalSku(`${prefix}-${random}`);
  };

  const handleMagicEntry = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setIsLoading(true);
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const result = await geminiService.analyzeProductImage(base64);
          if (result.name) setModalName(result.name);
          if (result.category) setModalCategory(result.category);
          if (result.price) setModalPrice(result.price);
          if (result.description) setModalDescription(result.description);
          if (result.suggestedSku) setModalSku(result.suggestedSku);
          setModalImage(reader.result as string);
          setToast({ message: 'AI Analysis complete', type: 'success' });
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setToast({ message: 'AI Analysis failed', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    input.click();
  };

  const generateAIDescription = async () => {
    if (!modalName) return setToast({ message: 'Enter name first', type: 'info' });
    setIsLoading(true);
    try {
      const desc = await geminiService.generateProductDescription(modalName, modalCategory);
      setModalDescription(desc);
      setToast({ message: 'Description generated', type: 'success' });
    } catch {
      setToast({ message: 'Generation failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanResult = (res: string) => {
    setIsScannerOpen(false);
    if (scannerTarget === 'search') {
      setSearchQuery(res);
      setActiveSection('inventory');
    } else if (scannerTarget === 'sku') {
      setModalSku(res);
    } else if (scannerTarget === 'audit') {
      const p = inventory.find(item => item.sku === res);
      if (p) {
        setEditingProduct(p);
        setModalSku(p.sku);
        setModalName(p.name);
        setModalCategory(p.category);
        setModalPrice(p.price);
        setModalLocationStocks(p.locationStocks || {});
        setModalDescription(p.description || '');
        setModalImage(p.image || null);
        setIsModalOpen(true);
      } else {
        setToast({ message: 'SKU not found in inventory', type: 'error' });
      }
    }
  };

  // Data Management: Exports
  const handleExportXLSX = () => {
    if (inventory.length === 0) return setToast({ message: 'Nothing to export', type: 'info' });
    const exportData = inventory.map(item => ({
      SKU: item.sku,
      Name: item.name,
      Category: item.category,
      Price: item.price,
      'Min Stock': item.minStock,
      Description: item.description || '',
      'Total Qty': getTotalQty(item.locationStocks),
      ...item.locationStocks
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `${settings.storeName}_Inventory.xlsx`);
    setToast({ message: 'Excel exported', type: 'success' });
  };

  const handleExportCSV = () => {
    if (inventory.length === 0) return setToast({ message: 'Nothing to export', type: 'info' });
    const exportData = inventory.map(item => ({
      SKU: item.sku,
      Name: item.name,
      Category: item.category,
      Price: item.price,
      'Min Stock': item.minStock,
      'Total Qty': getTotalQty(item.locationStocks)
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${settings.storeName}_Inventory.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: 'CSV exported', type: 'success' });
  };

  const handleExportPDF = () => {
    if (inventory.length === 0) return setToast({ message: 'Nothing to export', type: 'info' });
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${settings.storeName} - Inventory Report`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    const tableColumn = ["SKU", "Product Name", "Category", "Price", "Total Stock"];
    const tableRows = inventory.map(item => [
      item.sku,
      item.name,
      item.category,
      `${settings.currency}${item.price.toFixed(2)}`,
      getTotalQty(item.locationStocks).toString()
    ]);

    (doc as any).autoTable({
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`${settings.storeName}_Inventory.pdf`);
    setToast({ message: 'PDF exported', type: 'success' });
  };

  const handleExportJSON = () => {
    if (inventory.length === 0) return setToast({ message: 'Nothing to export', type: 'info' });
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inventory, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${settings.storeName}_Inventory.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setToast({ message: 'JSON exported', type: 'success' });
  };

  const handleExportXML = () => {
    if (inventory.length === 0) return setToast({ message: 'Nothing to export', type: 'info' });
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<inventory>\n';
    inventory.forEach(item => {
      xml += '  <product>\n';
      xml += `    <sku>${item.sku}</sku>\n`;
      xml += `    <name>${item.name}</name>\n`;
      xml += `    <category>${item.category}</category>\n`;
      xml += `    <price>${item.price}</price>\n`;
      xml += `    <total_qty>${getTotalQty(item.locationStocks)}</total_qty>\n`;
      xml += '  </product>\n';
    });
    xml += '</inventory>';
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${settings.storeName}_Inventory.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ message: 'XML exported', type: 'success' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    reader.onload = (event) => {
      try {
        let rawData: any[] = [];

        if (extension === 'json') {
          const text = new TextDecoder().decode(event.target?.result as ArrayBuffer);
          const parsed = JSON.parse(text);
          rawData = Array.isArray(parsed) ? parsed : [parsed];
        } else if (extension === 'xml') {
          const text = new TextDecoder().decode(event.target?.result as ArrayBuffer);
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, "text/xml");
          const products = xmlDoc.getElementsByTagName("product");
          for (let i = 0; i < products.length; i++) {
            const item: any = {};
            const children = products[i].children;
            for (let j = 0; j < children.length; j++) {
              item[children[j].tagName] = children[j].textContent;
            }
            rawData.push(item);
          }
        } else {
          // Default to XLSX/CSV
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          rawData = XLSX.utils.sheet_to_json(worksheet);
        }

        const importedProducts: Product[] = rawData.map((row: any) => {
          const locStocks: Record<string, number> = {};
          locations.forEach(loc => {
            const qty = row[loc] ?? row.locationStocks?.[loc] ?? 0;
            locStocks[loc] = parseInt(qty) || 0;
          });

          return {
            id: row.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            sku: String(row.SKU || row.sku || `IMP-${Math.floor(Math.random() * 10000)}`),
            name: String(row.Name || row.name || 'Imported Item'),
            category: String(row.Category || row.category || 'Uncategorized'),
            price: parseFloat(row.Price || row.price) || 0,
            minStock: parseInt(row['Min Stock'] || row.minStock || row.min_stock) || settings.defaultLowStockThreshold,
            description: String(row.Description || row.description || ''),
            locationStocks: locStocks,
            lastUpdated: new Date().toISOString()
          };
        });

        setInventory(prev => [...prev, ...importedProducts]);
        addLog(`Imported ${importedProducts.length} items from ${extension?.toUpperCase()}`, 'add');
        setToast({ message: `Successfully imported ${importedProducts.length} items`, type: 'success' });
        if (importInputRef.current) importInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        setToast({ message: 'Failed to import: check file format', type: 'error' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const clearAllData = () => {
    setInventory([]);
    setLogs([]);
    addLog("Database wiped", "delete");
    setToast({ message: 'Database wiped', type: 'info'});
    setIsClearAllModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-col shadow-2xl flex-shrink-0">
        <SidebarContent activeSection={activeSection} navigateTo={setActiveSection} storeName={settings.storeName} />
      </aside>

      <div className={`fixed inset-0 z-[100] lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        <aside className={`absolute left-0 top-0 bottom-0 w-72 bg-slate-900 transform transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent activeSection={activeSection} navigateTo={(s) => { setActiveSection(s); setIsSidebarOpen(false); }} storeName={settings.storeName} />
        </aside>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2"><Menu size={24}/></button>
            <div className="flex-1 max-w-md relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search SKU or Name..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm outline-none font-medium" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => { setScannerTarget('search'); setIsScannerOpen(true); }} className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
              <Scan size={20}/>
            </button>
            <button onClick={() => setSettings(s => ({...s, theme: s.theme === 'dark' ? 'light' : 'dark'}))} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
              {settings.theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {activeSection === 'dashboard' && <DashboardView stats={stats} inventory={inventory} settings={settings} logs={logs} />}
            {activeSection === 'inventory' && <InventoryView inventory={filteredInventory} settings={settings} onAdd={() => {setEditingProduct(null); setModalSku(''); setModalName(''); setModalImage(null); setModalDescription(''); setModalLocationStocks({}); setIsModalOpen(true);}} onEdit={p => {setEditingProduct(p); setModalSku(p.sku); setModalName(p.name); setModalCategory(p.category); setModalPrice(p.price); setModalLocationStocks(p.locationStocks || {}); setModalDescription(p.description || ''); setModalImage(p.image || null); setIsModalOpen(true);}} onDelete={id => setInventory(prev => prev.filter(i => i.id !== id))} onResearch={async (p, t) => { setIsLoading(true); setActiveSection('ai-research'); try { setAiAnalysis(t === 'price' ? await geminiService.getMarketPrice(p.name) : await geminiService.findSuppliers(p.name, { lat: 37, lng: -122 })); } finally { setIsLoading(false); } }} onTransfer={(p) => { setTransferProduct(p); const hasStock = Object.entries(p.locationStocks).filter(([_, q]) => (Number(q) || 0) > 0); setTransferFrom(hasStock[0]?.[0] || locations[0]); setTransferTo(locations.find(l => l !== (hasStock[0]?.[0] || locations[0])) || ''); setTransferAmount(1); setIsTransferModalOpen(true); }} />}
            {activeSection === 'ai-research' && <AiResearchView analysis={aiAnalysis} isLoading={isLoading} onNavigate={setActiveSection} />}
            {activeSection === 'categories' && <CategoriesView categories={categories} inventory={inventory} onAdd={() => setIsCategoryModalOpen(true)} onEdit={c => {setEditingCategory(c); setIsCategoryModalOpen(true);}} onDelete={id => setCategories(prev => prev.filter(c => c.id !== id))} />}
            {activeSection === 'locations' && <LocationsView locations={locations} inventory={inventory} onAdd={() => setIsLocationModalOpen(true)} onDelete={l => setLocations(prev => prev.filter(loc => loc !== l))} />}
            {activeSection === 'settings' && <div className="space-y-8 animate-in slide-in-from-bottom-4 max-w-4xl">
              <div className="flex justify-between items-end">
                <div><h2 className="text-3xl font-black">Settings</h2><p className="text-slate-500 dark:text-slate-400 font-medium">Control center & team management</p></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border dark:border-slate-800 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">System Tools</h3>
                  <button onClick={() => { setScannerTarget('audit'); setIsScannerOpen(true); }} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 transition-colors text-left">
                    <div className="flex items-center gap-3"><Scan size={20} className="text-emerald-500"/><span className="font-bold">Stock Audit Mode</span></div>
                    <ChevronRight size={16}/>
                  </button>
                  <button onClick={() => setIsClearAllModalOpen(true)} className="w-full p-4 bg-red-950/40 border border-red-900/30 rounded-2xl flex items-center gap-2 hover:bg-red-900/40 transition-colors text-center font-bold text-red-500">Wipe All Data</button>
                </div>
                {/* Data Management Section */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border dark:border-slate-800 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Data Management</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button onClick={handleExportPDF} className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-red-600 hover:text-white transition-all group">
                        <FileIcon size={20} className="text-red-500 group-hover:text-white mb-1"/>
                        <span className="font-bold text-[10px] uppercase">PDF</span>
                      </button>
                      <button onClick={handleExportCSV} className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-600 hover:text-white transition-all group">
                        <FileText size={20} className="text-slate-500 group-hover:text-white mb-1"/>
                        <span className="font-bold text-[10px] uppercase">CSV</span>
                      </button>
                      <button onClick={handleExportXLSX} className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-emerald-600 hover:text-white transition-all group">
                        <FileSpreadsheet size={20} className="text-emerald-500 group-hover:text-white mb-1"/>
                        <span className="font-bold text-[10px] uppercase">Excel</span>
                      </button>
                      <button onClick={handleExportXML} className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-amber-600 hover:text-white transition-all group">
                        <FileCode size={20} className="text-amber-500 group-hover:text-white mb-1"/>
                        <span className="font-bold text-[10px] uppercase">XML</span>
                      </button>
                      <button onClick={handleExportJSON} className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-blue-600 hover:text-white transition-all group">
                        <FileJson size={20} className="text-blue-500 group-hover:text-white mb-1"/>
                        <span className="font-bold text-[10px] uppercase">JSON</span>
                      </button>
                      <button onClick={() => importInputRef.current?.click()} className="flex flex-col items-center justify-center p-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-purple-600 hover:text-white transition-all group border-2 border-dashed border-slate-300 dark:border-slate-600">
                        <FileUp size={20} className="text-purple-500 group-hover:text-white mb-1"/>
                        <span className="font-bold text-[10px] uppercase">Import</span>
                        <input type="file" ref={importInputRef} onChange={handleImport} className="hidden" accept=".xlsx,.xls,.csv,.xml,.json" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Team & Permissions Section */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border dark:border-slate-800 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                      <Shield size={20}/>
                    </div>
                    <div>
                      <h3 className="text-lg font-black">Team & Permissions</h3>
                      <p className="text-xs text-slate-400 font-medium">Manage who can access and edit inventory</p>
                    </div>
                  </div>
                  <button onClick={() => setIsUserModalOpen(true)} className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                    <UserPlus size={16}/> <span className="hidden sm:inline">Add Member</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {team.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl group transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 ${member.avatarColor} rounded-full flex items-center justify-center text-white font-black text-sm uppercase`}>
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{member.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <select 
                          value={member.role} 
                          onChange={(e) => handleUpdateUserRole(member.id, e.target.value as UserRole)}
                          className="bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button onClick={() => handleRemoveUser(member.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>}
            {activeSection === 'print' && <div className="space-y-6">
              <h2 className="text-3xl font-black">Print Center</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {inventory.map(item => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border dark:border-slate-800 space-y-4 group">
                    <div className="flex justify-between items-start">
                      <div className="truncate pr-4"><p className="font-bold truncate text-lg">{item.name}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.sku}</p></div>
                      <button onClick={() => window.print()} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"><Printer size={20}/></button>
                    </div>
                    <Barcode value={item.sku} className="border dark:border-slate-700" />
                  </div>
                ))}
              </div>
            </div>}
          </div>
        </main>
      </div>

      {/* Modals Section */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 lg:p-8 border dark:border-slate-800 overflow-y-auto max-h-[90vh] relative custom-scrollbar">
            {isLoading && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingProduct ? 'Edit' : 'Add'} Product</h3>
              <div className="flex items-center gap-2">
                {!editingProduct && (
                   <button type="button" onClick={handleMagicEntry} className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl flex items-center gap-1.5 transition-colors" title="Analyze with AI">
                    <Sparkles size={18}/>
                    <span className="text-xs font-black uppercase hidden sm:inline">Magic Entry</span>
                  </button>
                )}
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X/></button>
              </div>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center border dark:border-slate-700">
                  {modalImage ? <img src={modalImage} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-slate-300"/>}
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">SKU</label>
                  <div className="flex gap-2">
                    <input required className="flex-1 px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 outline-none font-bold uppercase" value={modalSku} onChange={e => setModalSku(e.target.value.toUpperCase())} />
                    <button type="button" onClick={generateAutoSku} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-amber-600 hover:text-white transition-colors" title="Generate SKU"><RefreshCw size={18}/></button>
                  </div>
                  {modalSku && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400">Barcode Preview</p>
                      <Barcode value={modalSku} className="border dark:border-slate-700 h-24" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Product Name</label>
                <input required className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 outline-none font-bold" value={modalName} onChange={e => setModalName(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Category</label>
                  <select className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 outline-none font-bold" value={modalCategory} onChange={e => setModalCategory(e.target.value)}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Price ({settings.currency})</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 outline-none font-bold" value={modalPrice} onChange={e => setModalPrice(parseFloat(e.target.value) || 0)} />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 block">Stock by Location</label>
                <div className="space-y-3">
                  {locations.map(loc => (
                    <div key={loc} className="flex items-center justify-between">
                      <span className="text-sm font-bold">{loc}</span>
                      <input 
                        type="number" 
                        className="w-24 px-3 py-1.5 border rounded-lg dark:bg-slate-900 dark:border-slate-700 outline-none text-right font-black" 
                        value={modalLocationStocks[loc] || 0}
                        onChange={e => setModalLocationStocks(prev => ({ ...prev, [loc]: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Description</label>
                  <button type="button" onClick={generateAIDescription} className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Wand2 size={12}/> AI Generate
                  </button>
                </div>
                <textarea className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 outline-none min-h-[80px]" value={modalDescription} onChange={e => setModalDescription(e.target.value)} />
              </div>

              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Team Member Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 border dark:border-slate-800 space-y-6 animate-in zoom-in-95">
             <div className="flex justify-between items-center">
              <h3 className="text-xl font-black">Add Team Member</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-100"><X/></button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Full Name</label>
                <input 
                  required 
                  className="w-full px-4 py-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold" 
                  placeholder="e.g. John Doe"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Email Address</label>
                <input 
                  required 
                  type="email"
                  className="w-full px-4 py-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold" 
                  placeholder="john@company.com"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Initial Role</label>
                <select 
                  className="w-full px-4 py-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold"
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                >
                  <option value="viewer">Viewer (Read Only)</option>
                  <option value="editor">Editor (Can edit stock)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>
              <button className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/20">Invite Member</button>
            </form>
          </div>
        </div>
      )}

      {isTransferModalOpen && transferProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 border dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black">Transfer Stock</h3>
              <button onClick={() => setIsTransferModalOpen(false)}><X/></button>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{transferProduct.name}</p>
              <p className="text-xs text-slate-500">Current Total: {getTotalQty(transferProduct.locationStocks)}</p>
            </div>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">From</label>
                <select className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold" value={transferFrom} onChange={e => setTransferFrom(e.target.value)}>
                  {Object.entries(transferProduct.locationStocks).filter(([_, q]) => (Number(q) || 0) > 0).map(([l, q]) => (
                    <option key={l} value={l}>{l} ({q} available)</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">To</label>
                <select className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold" value={transferTo} onChange={e => setTransferTo(e.target.value)}>
                  {locations.filter(l => l !== transferFrom).map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Amount</label>
                <input required type="number" min="1" max={Number(transferProduct.locationStocks[transferFrom]) || 0} className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 font-bold" value={transferAmount} onChange={e => setTransferAmount(parseInt(e.target.value) || 0)} />
              </div>
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all">Move Stock</button>
            </form>
          </div>
        </div>
      )}

      {isClearAllModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 border dark:border-slate-800 text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto">
              <AlertOctagon size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black">Erase Everything?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">This action is permanent. All data will be deleted.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={clearAllData} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 shadow-xl shadow-red-500/20 transition-all">Yes, Delete All Data</button>
              <button onClick={() => setIsClearAllModalOpen(false)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl font-black uppercase tracking-widest text-xs transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 lg:p-8 border dark:border-slate-800">
             <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Category</h3>
              <button onClick={() => setIsCategoryModalOpen(false)}><X/></button>
            </div>
            <form onSubmit={(e) => {
               e.preventDefault();
               const formData = new FormData(e.currentTarget);
               const name = formData.get('name') as string;
               const description = formData.get('description') as string;
               setCategories(prev => [...prev, { id: Date.now().toString(), name, description }]);
               addLog(`Created category: ${name}`, 'add');
               setIsCategoryModalOpen(false);
            }} className="space-y-4">
              <input name="name" required placeholder="Category Name" className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 outline-none font-bold" />
              <textarea name="description" placeholder="Description" className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 outline-none h-24" />
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Save</button>
            </form>
          </div>
        </div>
      )}

      {isLocationModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 lg:p-8 border dark:border-slate-800">
             <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">New Zone</h3>
              <button onClick={() => setIsLocationModalOpen(false)}><X/></button>
            </div>
            <form onSubmit={(e) => {
               e.preventDefault();
               const formData = new FormData(e.currentTarget);
               const name = formData.get('name') as string;
               if (!locations.includes(name)) {
                 setLocations(prev => [...prev, name]);
                 addLog(`Created location zone: ${name}`, 'add');
               }
               setIsLocationModalOpen(false);
            }} className="space-y-4">
              <input name="name" required placeholder="Zone Name (e.g. Aisle 4)" className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 outline-none font-bold" />
              <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold">Create Zone</button>
            </form>
          </div>
        </div>
      )}

      {isScannerOpen && <ScannerModal onScan={handleScanResult} onClose={() => setIsScannerOpen(false)} title={scannerTarget === 'audit' ? 'Stock Auditing' : 'Scanning...'} />}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-bottom-4 font-bold z-[200]">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default App;