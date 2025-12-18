
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
  AlertOctagon
} from 'lucide-react';
import { Product, Category, Section, AppSettings, ActivityLog } from './types';
import { geminiService } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BrowserMultiFormatReader } from '@zxing/browser';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// --- Constants ---

const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', description: 'Gadgets and computing devices' },
  { id: '2', name: 'Furniture', description: 'Office and home furniture' },
  { id: '3', name: 'Office Supplies', description: 'Stationery and daily tools' },
];

const INITIAL_LOCATIONS: string[] = [
  'Warehouse A', 'Warehouse B', 'Main Storefront', 'Showroom', 'Cold Storage'
];

const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'InventoryPro AI',
  currency: '$',
  defaultLowStockThreshold: 10,
  enableAiFeatures: true,
  enableNotifications: true,
  theme: 'dark'
};

// --- Shared Helper Components ---

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
      value: item.quantity
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
  settings: AppSettings
}> = ({ inventory, onAdd, onEdit, onDelete, onResearch, settings }) => (
  <div className="space-y-6 animate-in slide-in-from-bottom-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><h2 className="text-3xl font-black">Inventory</h2><p className="text-slate-500 dark:text-slate-400 font-medium">Manage and monitor stock levels</p></div>
      <button onClick={onAdd} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"><Plus size={20} /><span>Add Product</span></button>
    </div>
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b dark:border-slate-800"><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Product Info</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Stock</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Price</th><th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {inventory.length > 0 ? inventory.map(item => (
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
                <td className="px-6 py-4">{item.quantity <= 0 ? <span className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase"><AlertCircle size={12}/>Out of Stock</span> : item.quantity <= item.minStock ? <span className="flex items-center gap-1.5 text-amber-500 text-[10px] font-black uppercase"><AlertTriangle size={12}/>Low Stock</span> : <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase"><CheckCircle2 size={12}/>Optimal</span>}</td>
                <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-slate-100">{item.quantity}</td>
                <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-slate-100">{settings.currency}{item.price.toFixed(2)}</td>
                <td className="px-6 py-4"><div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => onResearch(item, 'price')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all" title="Market Price Analysis"><TrendingUp size={18}/></button><button onClick={() => onResearch(item, 'maps')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all" title="Find Suppliers"><MapPin size={18}/></button><button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-all" title="Edit"><Edit3 size={18}/></button><button onClick={() => onDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all" title="Delete"><Trash2 size={18}/></button></div></td>
              </tr>
            )) : <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No products found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const AiResearchView: React.FC<{ analysis: any, isLoading: boolean, onNavigate: (s: Section) => void }> = ({ analysis, isLoading, onNavigate }) => (
  <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
    <div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20"><BrainCircuit className="text-white" size={24} /></div><div><h2 className="text-2xl font-black">AI Research Center</h2><p className="text-slate-500 dark:text-slate-400 font-medium">Market intelligence powered by Gemini</p></div></div><button onClick={() => onNavigate('inventory')} className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold flex items-center gap-2"><ChevronLeft size={20} />Back</button></div>
    {isLoading ? <div className="bg-white dark:bg-slate-900 p-20 rounded-[2rem] border dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4"><Loader2 className="animate-spin text-purple-600" size={48} /><p className="font-black uppercase tracking-widest text-sm text-slate-400">Analyzing Market Data...</p></div> : analysis ? (
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400"><Sparkles size={20} /><h3 className="font-black uppercase tracking-widest text-xs">Analysis Result</h3></div>
          <div className="prose dark:prose-invert max-w-none"><p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">{analysis.text}</p></div>
          {analysis.sources && analysis.sources.length > 0 && (
            <div className="pt-8 border-t dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Grounding Sources</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.sources.map((source: any, idx: number) => {
                  const url = source.web?.uri || source.maps?.uri;
                  const title = source.web?.title || source.maps?.title || "View Source";
                  if (!url) return null;
                  return (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl group hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border dark:border-slate-700">
                      <span className="text-xs font-bold pr-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 truncate">{title}</span>
                      <Maximize size={14} className="text-slate-300 group-hover:text-blue-600 flex-shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    ) : <div className="bg-white dark:bg-slate-900 p-20 rounded-[2rem] border dark:border-slate-800 text-center"><p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Select a product for AI research</p></div>}
  </div>
);

const CategoriesView: React.FC<{ categories: Category[], inventory: Product[], onAdd: () => void, onEdit: (c: Category) => void, onDelete: (id: string) => void }> = ({ categories, inventory, onAdd, onEdit, onDelete }) => (
  <div className="space-y-6 animate-in slide-in-from-bottom-4">
    <div className="flex items-center justify-between"><div><h2 className="text-3xl font-black">Categories</h2><p className="text-slate-500 dark:text-slate-400 font-medium">Organize your inventory</p></div><button onClick={onAdd} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"><Plus size={20} /><span>New Category</span></button></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map(cat => {
        const itemCount = inventory.filter(p => p.category === cat.name).length;
        return (
          <div key={cat.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border dark:border-slate-800 group hover:shadow-2xl transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center"><Tags size={24}/></div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => onEdit(cat)} className="p-2 text-slate-400 hover:text-amber-600"><Edit3 size={16}/></button><button onClick={() => onDelete(cat.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button></div>
            </div>
            <h3 className="text-xl font-black mb-2">{cat.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 line-clamp-2">{cat.description || "No description provided."}</p>
            <div className="flex items-center justify-between pt-6 border-t dark:border-slate-800"><p className="text-xs font-black uppercase tracking-widest text-slate-400">Total Items</p><p className="text-lg font-black text-blue-600">{itemCount}</p></div>
          </div>
        );
      })}
    </div>
  </div>
);

const LocationsView: React.FC<{ locations: string[], inventory: Product[], onAdd: () => void, onDelete: (l: string) => void }> = ({ locations, inventory, onAdd, onDelete }) => (
  <div className="space-y-6 animate-in slide-in-from-bottom-4">
    <div className="flex items-center justify-between"><div><h2 className="text-3xl font-black">Locations</h2><p className="text-slate-500 dark:text-slate-400 font-medium">Manage storage zones</p></div><button onClick={onAdd} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"><Plus size={20} /><span>Add Zone</span></button></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {locations.map((loc, idx) => {
        const itemCount = inventory.filter(p => p.location === loc).length;
        return (
          <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border dark:border-slate-800 group hover:shadow-2xl transition-all">
            <div className="flex items-start justify-between mb-6"><div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center"><MapPin size={24}/></div><button onClick={() => onDelete(loc)} className="p-2 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button></div>
            <h3 className="text-lg font-black mb-1 truncate">{loc}</h3>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Storage Zone</p>
            <div className="flex items-center justify-between pt-6 border-t dark:border-slate-800"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Items</p><p className="text-lg font-black text-emerald-600">{itemCount}</p></div>
          </div>
        );
      })}
    </div>
  </div>
);

const ScannerModal: React.FC<{ onScan: (result: string) => void, onClose: () => void, title?: string }> = ({ onScan, onClose, title = "Scanning..." }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let controls: any;
    async function startScanner() {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        const selectedDevice = videoInputDevices.find(d => d.label.toLowerCase().includes('back')) || videoInputDevices[0];
        controls = await codeReader.decodeFromVideoDevice(selectedDevice.deviceId, videoRef.current!, (result) => { if (result) onScan(result.getText()); });
      } catch (err) { console.error(err); }
    }
    startScanner();
    return () => { if (controls) controls.stop(); };
  }, [onScan]);
  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[110] flex flex-col items-center justify-center p-4 text-white">
      <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-all"><X size={32}/></button>
      <div className="w-full max-w-2xl aspect-video bg-black rounded-3xl border-4 border-white/20 overflow-hidden relative shadow-2xl">
        <video ref={videoRef} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1/2 h-1/2 border-2 border-blue-500 rounded-2xl animate-pulse" />
        </div>
      </div>
      <div className="mt-8 text-center"><p className="font-black uppercase tracking-widest text-xs">{title}</p></div>
    </div>
  );
};

// --- App Component ---

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [inventory, setInventory] = useState<Product[]>(() => JSON.parse(localStorage.getItem('inventory') || '[]'));
  const [categories, setCategories] = useState<Category[]>(() => JSON.parse(localStorage.getItem('categories') || JSON.stringify(INITIAL_CATEGORIES)));
  const [locations, setLocations] = useState<string[]>(() => JSON.parse(localStorage.getItem('locations') || JSON.stringify(INITIAL_LOCATIONS)));
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  const [logs, setLogs] = useState<ActivityLog[]>(() => JSON.parse(localStorage.getItem('activity_logs') || '[]'));

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'search' | 'sku' | 'audit'>('search');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const importFileRef = useRef<HTMLInputElement>(null);
  const importCsvFileRef = useRef<HTMLInputElement>(null);

  // Modal Form State
  const [modalSku, setModalSku] = useState('');
  const [modalName, setModalName] = useState('');
  const [modalCategory, setModalCategory] = useState('');
  const [modalLocation, setModalLocation] = useState('');
  const [modalPrice, setModalPrice] = useState(0);
  const [modalQuantity, setModalQuantity] = useState(0);
  const [modalDescription, setModalDescription] = useState('');
  const [modalMinStock, setModalMinStock] = useState(5);
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('locations', JSON.stringify(locations));
    localStorage.setItem('app_settings', JSON.stringify(settings));
    localStorage.setItem('activity_logs', JSON.stringify(logs));
  }, [inventory, categories, locations, settings, logs]);

  // Toast dismissal effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const stats = useMemo(() => ({
    totalItems: inventory.length,
    totalValue: inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    lowStock: inventory.filter(i => i.quantity > 0 && i.quantity <= i.minStock).length,
    outOfStock: inventory.filter(i => i.quantity === 0).length
  }), [inventory]);

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
      location: modalLocation,
      price: modalPrice,
      quantity: modalQuantity,
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
        setModalQuantity(p.quantity);
        setModalDescription(p.description || '');
        setModalImage(p.image || null);
        setIsModalOpen(true);
      } else {
        setToast({ message: 'SKU not found in inventory', type: 'error' });
      }
    }
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json(ws);
        
        const importedProducts: Product[] = json.map((item: any) => ({
          id: item.id?.toString() || (Date.now() + Math.random()).toString(),
          sku: item.SKU?.toString() || item.sku?.toString() || '',
          name: item.Name?.toString() || item.name?.toString() || 'Imported Product',
          category: item.Category?.toString() || item.category?.toString() || 'Uncategorized',
          location: item.Location?.toString() || item.location?.toString() || '',
          quantity: Number(item.Quantity || item.quantity || 0),
          price: Number(item.Price || item.price || 0),
          minStock: Number(item.MinStock || item.minStock || 5),
          description: item.Description?.toString() || item.description?.toString() || '',
          lastUpdated: new Date().toISOString()
        }));

        setInventory(prev => [...prev, ...importedProducts]);
        addLog(`Imported ${importedProducts.length} products via CSV`, 'add');
        setToast({ message: `Imported ${importedProducts.length} products`, type: 'success' });
      } catch (err) {
        setToast({ message: 'Error parsing CSV', type: 'error' });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
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
      <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = JSON.parse(event.target?.result as string);
            if (Array.isArray(json)) { setInventory(json); setToast({ message: 'Imported successfully', type: 'success' }); }
          } catch { setToast({ message: 'Invalid file', type: 'error' }); }
        };
        reader.readAsText(file);
      }} />
      <input type="file" ref={importCsvFileRef} className="hidden" accept=".csv,.xlsx" onChange={handleImportCSV} />

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
                placeholder="Search..." 
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
            {activeSection === 'inventory' && <InventoryView inventory={filteredInventory} settings={settings} onAdd={() => {setEditingProduct(null); setModalSku(''); setModalName(''); setModalImage(null); setModalDescription(''); setIsModalOpen(true);}} onEdit={p => {setEditingProduct(p); setModalSku(p.sku); setModalName(p.name); setModalCategory(p.category); setModalPrice(p.price); setModalQuantity(p.quantity); setModalDescription(p.description || ''); setModalImage(p.image || null); setIsModalOpen(true);}} onDelete={id => setInventory(prev => prev.filter(i => i.id !== id))} onResearch={async (p, t) => { setIsLoading(true); setActiveSection('ai-research'); try { setAiAnalysis(t === 'price' ? await geminiService.getMarketPrice(p.name) : await geminiService.findSuppliers(p.name, { lat: 37, lng: -122 })); } finally { setIsLoading(false); } }} />}
            {activeSection === 'ai-research' && <AiResearchView analysis={aiAnalysis} isLoading={isLoading} onNavigate={setActiveSection} />}
            {activeSection === 'categories' && <CategoriesView categories={categories} inventory={inventory} onAdd={() => setIsCategoryModalOpen(true)} onEdit={c => {setEditingCategory(c); setIsCategoryModalOpen(true);}} onDelete={id => setCategories(prev => prev.filter(c => c.id !== id))} />}
            {activeSection === 'locations' && <LocationsView locations={locations} inventory={inventory} onAdd={() => setIsLocationModalOpen(true)} onDelete={l => setLocations(prev => prev.filter(loc => loc !== l))} />}
            {activeSection === 'settings' && <div className="space-y-8 animate-in slide-in-from-bottom-4 max-w-4xl">
              <div><h2 className="text-3xl font-black">Settings</h2><p className="text-slate-500 dark:text-slate-400 font-medium">Data & Tools</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border dark:border-slate-800 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">System Tools</h3>
                  <button onClick={() => { setScannerTarget('audit'); setIsScannerOpen(true); }} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 transition-colors text-left">
                    <div className="flex items-center gap-3"><Scan size={20} className="text-emerald-500"/><span className="font-bold">Stock Audit Mode</span></div>
                    <ChevronRight size={16}/>
                  </button>
                  <button onClick={() => importFileRef.current?.click()} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 transition-colors text-left">
                    <div className="flex items-center gap-3"><Upload size={20} className="text-blue-500"/><span className="font-bold">Import Data (JSON)</span></div>
                    <ChevronRight size={16}/>
                  </button>
                  <button onClick={() => importCsvFileRef.current?.click()} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 transition-colors text-left">
                    <div className="flex items-center gap-3"><FileUp size={20} className="text-emerald-500"/><span className="font-bold">Import CSV / Excel</span></div>
                    <ChevronRight size={16}/>
                  </button>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2rem] text-white space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Export Center</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { 
                      const doc = new jsPDF(); 
                      doc.text("Inventory", 10, 10); 
                      const tableData = inventory.map(p => [p.sku, p.name, p.category, p.quantity, p.price]);
                      (doc as any).autoTable({
                        head: [['SKU', 'Name', 'Category', 'Qty', 'Price']],
                        body: tableData
                      });
                      doc.save("inventory.pdf"); 
                    }} className="p-4 bg-slate-800 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-700 transition-colors"><FileText size={20} className="text-red-400"/><span className="text-[10px] font-black uppercase text-center">Export PDF</span></button>
                    <button onClick={() => { const ws = XLSX.utils.json_to_sheet(inventory); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Inventory"); XLSX.writeFile(wb, "inventory_export.csv"); }} className="p-4 bg-slate-800 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-700 transition-colors"><FileSpreadsheet size={20} className="text-emerald-400"/><span className="text-[10px] font-black uppercase text-center">Export CSV</span></button>
                    <button onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inventory, null, 2));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute("download", "inventory.json");
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }} className="p-4 bg-slate-800 rounded-2xl flex flex-col items-center gap-2 hover:bg-slate-700 transition-colors"><Database size={20} className="text-blue-400"/><span className="text-[10px] font-black uppercase text-center">Export JSON</span></button>
                    <button onClick={() => setIsClearAllModalOpen(true)} className="p-4 bg-red-950/40 border border-red-900/30 rounded-2xl flex flex-col items-center gap-2 hover:bg-red-900/40 transition-colors"><Trash2 size={20} className="text-red-400"/><span className="text-[10px] font-black uppercase text-red-400 text-center">Clear All</span></button>
                  </div>
                </div>
              </div>
            </div>}
            {activeSection === 'print' && <div className="space-y-6">
              <h2 className="text-3xl font-black">Print Center</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {inventory.map(item => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 flex items-center justify-between group">
                    <div className="truncate pr-4"><p className="font-bold truncate">{item.name}</p><p className="text-[10px] font-black text-slate-400 uppercase">{item.sku}</p></div>
                    <button onClick={() => window.print()} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Printer size={20}/></button>
                  </div>
                ))}
              </div>
            </div>}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 lg:p-8 border dark:border-slate-800 overflow-y-auto max-h-[90vh] relative">
            {isLoading && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingProduct ? 'Edit' : 'Add'} Product</h3>
              <div className="flex items-center gap-2">
                {!editingProduct && (
                   <button onClick={handleMagicEntry} className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl flex items-center gap-1.5 transition-colors" title="Analyze with AI">
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
                <div className="flex-1 space-y-2">
                   <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">SKU</label>
                      <input required className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 outline-none font-bold uppercase" value={modalSku} onChange={e => setModalSku(e.target.value.toUpperCase())} />
                    </div>
                    <button type="button" onClick={() => { setScannerTarget('sku'); setIsScannerOpen(true); }} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-blue-600 hover:text-white transition-colors"><Scan size={18}/></button>
                  </div>
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
                  <label className="text-[10px] font-black uppercase text-slate-400">Location</label>
                   <select className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 outline-none font-bold" value={modalLocation} onChange={e => setModalLocation(e.target.value)}>
                    <option value="">Select Location</option>
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Price ({settings.currency})</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 outline-none font-bold" value={modalPrice} onChange={e => setModalPrice(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Stock Quantity</label>
                  <input type="number" className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 outline-none font-bold" value={modalQuantity} onChange={e => setModalQuantity(parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-slate-400">Description</label>
                  <button type="button" onClick={generateAIDescription} className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 flex items-center gap-1"><Wand2 size={12}/>AI Generate</button>
                </div>
                <textarea className="w-full px-4 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-700 outline-none min-h-[80px]" value={modalDescription} onChange={e => setModalDescription(e.target.value)} />
              </div>
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 border dark:border-slate-800 text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto">
              <AlertOctagon size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black">Erase Everything?</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">This action is permanent. All products, categories, and logs will be deleted forever.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={clearAllData} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 shadow-xl shadow-red-500/20 transition-all">Yes, Delete All Data</button>
              <button onClick={() => setIsClearAllModalOpen(false)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Cancel</button>
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

      {isScannerOpen && <ScannerModal onScan={handleScanResult} onClose={() => setIsScannerOpen(false)} title={scannerTarget === 'audit' ? 'Stock Auditing: Scan Item SKU' : 'Scanning...'} />}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-bottom-4 font-bold z-[200]">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default App;
