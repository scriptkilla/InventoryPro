
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
  MapPinned
} from 'lucide-react';
import { Product, Category, Section } from './types';
import { geminiService } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BrowserMultiFormatReader } from '@zxing/browser';

const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', description: 'Gadgets and computing devices' },
  { id: '2', name: 'Furniture', description: 'Office and home furniture' },
  { id: '3', name: 'Office Supplies', description: 'Stationery and daily tools' },
];

const INITIAL_LOCATIONS: string[] = [
  'Warehouse A',
  'Warehouse B',
  'Main Storefront',
  'Showroom',
  'Cold Storage'
];

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  
  // Persistence for Inventory
  const [inventory, setInventory] = useState<Product[]>(() => {
    const saved = localStorage.getItem('inventory');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence for Categories
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('categories');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : INITIAL_CATEGORIES;
      } catch (e) {
        console.error("Error parsing categories from storage", e);
        return INITIAL_CATEGORIES;
      }
    }
    return INITIAL_CATEGORIES;
  });

  // Persistence for Locations
  const [locations, setLocations] = useState<string[]>(() => {
    const saved = localStorage.getItem('locations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : INITIAL_LOCATIONS;
      } catch (e) {
        return INITIAL_LOCATIONS;
      }
    }
    return INITIAL_LOCATIONS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'search' | 'sku'>('search');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{text: string, sources: any[]} | null>(null);
  
  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  // Controlled form state for modal
  const [modalSku, setModalSku] = useState('');
  const [modalName, setModalName] = useState('');
  const [modalCategory, setModalCategory] = useState('');
  const [modalLocation, setModalLocation] = useState('');
  const [modalDescription, setModalDescription] = useState('');

  // Save to Local Storage
  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('locations', JSON.stringify(locations));
  }, [locations]);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Derived Stats
  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const lowStock = inventory.filter(i => i.quantity > 0 && i.quantity <= i.minStock).length;
    const outOfStock = inventory.filter(i => i.quantity === 0).length;
    return { totalItems, totalValue, lowStock, outOfStock };
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventory;
    const q = searchQuery.toLowerCase();
    return inventory.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q)
    );
  }, [inventory, searchQuery]);

  // Handle Modal Open with initial values
  useEffect(() => {
    if (isModalOpen) {
      setModalSku(editingProduct?.sku || '');
      setModalName(editingProduct?.name || '');
      setModalCategory(editingProduct?.category || '');
      setModalLocation(editingProduct?.location || '');
      setModalDescription(editingProduct?.description || '');
    }
  }, [isModalOpen, editingProduct]);

  // Product Actions
  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData: Product = {
      id: editingProduct?.id || Date.now().toString(),
      sku: modalSku,
      name: modalName,
      category: modalCategory,
      location: modalLocation,
      quantity: Number(formData.get('quantity')),
      price: Number(formData.get('price')),
      minStock: Number(formData.get('minStock')),
      lastUpdated: new Date().toISOString(),
      description: modalDescription,
    };

    if (editingProduct) {
      setInventory(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
      showToast('Product updated successfully');
    } else {
      setInventory(prev => [...prev, productData]);
      showToast('Product added to inventory');
    }
    setIsModalOpen(false);
    setEditingProduct(null);
    setModalSku('');
    setModalName('');
    setModalCategory('');
    setModalLocation('');
    setModalDescription('');
  };

  const handleDeleteProduct = (id: string) => {
    if (!id) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      type: 'danger',
      onConfirm: () => {
        setInventory(prev => prev.filter(p => String(p.id) !== String(id)));
        showToast('Product permanently deleted', 'info');
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Category Actions
  const handleSaveCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string).trim();
    if (!name) return;

    const categoryData: Category = {
      id: editingCategory?.id || Date.now().toString(),
      name,
      description: (formData.get('description') as string).trim(),
    };

    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? categoryData : c));
      showToast('Category updated');
    } else {
      setCategories(prev => [...prev, categoryData]);
      showToast('New category created');
    }
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    const categoryToDelete = categories.find(c => String(c.id) === String(id));
    if (!categoryToDelete) return;

    const productsInCategory = inventory.filter(p => p.category === categoryToDelete.name);
    const productCount = productsInCategory.length;

    const onConfirmDelete = () => {
      setCategories(prev => prev.filter(c => String(c.id) !== String(id)));
      if (productCount > 0) {
        setInventory(prev => prev.map(p => 
          p.category === categoryToDelete.name ? { ...p, category: "" } : p
        ));
      }
      showToast('Category deleted successfully');
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    if (productCount > 0) {
      setConfirmModal({
        isOpen: true,
        title: 'Delete Category',
        message: `Warning: There are ${productCount} products in "${categoryToDelete.name}". If you delete this category, these products will be set to "Unassigned". Proceed?`,
        type: 'warning',
        onConfirm: onConfirmDelete
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Delete Category',
        message: `Are you sure you want to delete the "${categoryToDelete.name}" category?`,
        type: 'danger',
        onConfirm: onConfirmDelete
      });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleAiResearch = async (product: Product, type: 'price' | 'maps') => {
    setIsLoading(true);
    setActiveSection('ai-research');
    let result;
    try {
      if (type === 'price') {
        result = await geminiService.getMarketPrice(product.name);
      } else {
        result = await geminiService.findSuppliers(product.name, { lat: 37.7749, lng: -122.4194 });
      }
      setAiAnalysis(result);
      showToast('AI Research complete');
    } catch (err) {
      showToast('AI Analysis failed. Check API key.', 'error');
    }
    setIsLoading(false);
    setIsSidebarOpen(false);
  };

  const handleGenerateDescription = async () => {
    if (!modalName) {
      showToast('Enter a product name first', 'info');
      return;
    }
    setIsGeneratingDescription(true);
    try {
      const desc = await geminiService.generateProductDescription(modalName, modalCategory);
      setModalDescription(desc);
      showToast('Description generated');
    } catch (err) {
      showToast('Failed to generate description', 'error');
    }
    setIsGeneratingDescription(false);
  };

  const handleLocationChange = (val: string) => {
    if (val === 'ADD_NEW') {
      handleAddManualLocation();
    } else {
      setModalLocation(val);
    }
  };

  const handleAddManualLocation = () => {
    const newLoc = prompt("Enter new storage location name:");
    if (newLoc && newLoc.trim()) {
      const trimmed = newLoc.trim();
      if (!locations.includes(trimmed)) {
        setLocations(prev => [...prev, trimmed]);
        setModalLocation(trimmed);
        showToast('New location added and selected');
      } else {
        setModalLocation(trimmed);
        showToast('Location already exists and is now selected', 'info');
      }
    }
  };

  const navigateTo = (section: Section) => {
    setActiveSection(section);
    setIsSidebarOpen(false);
  };

  const handleOpenScanner = (target: 'search' | 'sku') => {
    setScannerTarget(target);
    setIsScannerOpen(true);
  };

  const handleScanResult = (result: string) => {
    if (scannerTarget === 'search') {
      setSearchQuery(result);
      showToast(`SKU Search: ${result}`);
    } else {
      setModalSku(result);
      showToast('SKU Captured');
    }
    setIsScannerOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-white flex-shrink-0 flex-col shadow-2xl">
        <SidebarContent activeSection={activeSection} navigateTo={navigateTo} />
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        <aside className={`absolute left-0 top-0 bottom-0 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-out flex flex-col shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex justify-end p-4">
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-white">
              <ChevronLeft size={24} />
            </button>
          </div>
          <SidebarContent activeSection={activeSection} navigateTo={navigateTo} />
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8 flex-shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-3 lg:hidden">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Package className="text-white" size={18} />
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-4 lg:mx-0 flex items-center gap-3">
            <div className="flex-1 relative flex items-center group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search SKU or name..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button 
              onClick={() => handleOpenScanner('search')}
              className="p-2 bg-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-all shadow-sm flex items-center justify-center flex-shrink-0"
              title="Global Barcode Search"
            >
              <Scan size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 lg:gap-6">
            <button className="relative text-slate-500 hover:text-slate-900 transition-colors p-2 lg:p-0">
              <Bell size={20} />
              {stats.lowStock > 0 && <span className="absolute top-1 right-1 lg:-top-1 lg:-right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">{stats.lowStock}</span>}
            </button>
            <div className="hidden sm:flex items-center gap-3 pl-4 lg:pl-6 border-l">
              <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold flex-shrink-0 shadow-sm border border-blue-200">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Section View Container */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 overflow-x-hidden custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            {activeSection === 'dashboard' && <DashboardView stats={stats} inventory={inventory} />}
            {activeSection === 'inventory' && (
              <InventoryView 
                inventory={filteredInventory} 
                onAdd={() => { setEditingProduct(null); setIsModalOpen(true); }}
                onEdit={(p) => { setEditingProduct(p); setIsModalOpen(true); }}
                onDelete={handleDeleteProduct}
                onResearch={handleAiResearch}
              />
            )}
            {activeSection === 'ai-research' && <AiResearchView analysis={aiAnalysis} isLoading={isLoading} onNavigate={navigateTo} />}
            {activeSection === 'categories' && (
              <CategoriesView 
                categories={categories} 
                inventory={inventory} 
                onAdd={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }} 
                onDelete={handleDeleteCategory}
                onEdit={handleEditCategory}
              />
            )}
            {activeSection === 'settings' && <SettingsView />}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                confirmModal.type === 'danger' ? 'bg-red-100 text-red-600' : 
                confirmModal.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {confirmModal.type === 'danger' ? <Trash2 size={32} /> : 
                 confirmModal.type === 'warning' ? <AlertTriangle size={32} /> : <Info size={32} />}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{confirmModal.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">{confirmModal.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 px-4 py-3 text-white font-bold rounded-2xl transition-all shadow-lg ${
                    confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 
                    confirmModal.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-2 fade-in">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm ${
            toast.type === 'success' ? 'bg-slate-900 text-white' : 
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-100'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertCircle size={18} />}
            {toast.message}
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50 flex-shrink-0">
              <h3 className="text-lg font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">SKU</label>
                  <div className="flex gap-2">
                    <input 
                      name="sku" 
                      value={modalSku} 
                      onChange={(e) => setModalSku(e.target.value)}
                      required 
                      className="flex-1 px-4 py-2 bg-slate-100 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="e.g., LAP-001" 
                    />
                    <button 
                      type="button"
                      onClick={() => handleOpenScanner('sku')}
                      className="px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center"
                    >
                      <Scan size={18} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Name</label>
                  <input 
                    name="name" 
                    value={modalName} 
                    onChange={(e) => setModalName(e.target.value)}
                    required 
                    className="w-full px-4 py-2 bg-slate-100 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Product name" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Category</label>
                  <select 
                    name="category" 
                    value={modalCategory} 
                    onChange={(e) => setModalCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-100 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  >
                    <option value="">Unassigned</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Storage Location</label>
                  <div className="flex gap-2">
                    <select 
                      name="location" 
                      value={modalLocation} 
                      onChange={(e) => handleLocationChange(e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-100 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium"
                    >
                      <option value="">No Location</option>
                      {locations.map((loc, idx) => <option key={idx} value={loc}>{loc}</option>)}
                      <option value="ADD_NEW" className="text-blue-600 font-bold">+ Add New Location...</option>
                    </select>
                    <button 
                      type="button"
                      onClick={handleAddManualLocation}
                      className="px-3 py-2 bg-slate-100 text-slate-600 border rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
                      title="Add manual location"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Quantity</label>
                  <input type="number" name="quantity" defaultValue={editingProduct?.quantity || 0} required className="w-full px-4 py-2 bg-slate-100 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Price ($)</label>
                  <input type="number" step="0.01" name="price" defaultValue={editingProduct?.price || 0} required className="w-full px-4 py-2 bg-slate-100 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Min Stock</label>
                  <input type="number" name="minStock" defaultValue={editingProduct?.minStock || 5} required className="w-full px-4 py-2 bg-slate-100 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="space-y-1 relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Description</label>
                  {!modalDescription && modalName && (
                    <button 
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={isGeneratingDescription}
                      className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-[10px] font-bold border border-blue-100 disabled:opacity-50"
                    >
                      {isGeneratingDescription ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      AI MAGIC
                    </button>
                  )}
                </div>
                <textarea 
                  name="description" 
                  value={modalDescription} 
                  onChange={(e) => setModalDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-100 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none font-medium" 
                  placeholder="Brief details about the product..." 
                />
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 order-2 sm:order-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 order-1 sm:order-2 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Edit Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Category Name</label>
                <input name="name" defaultValue={editingCategory?.name} required className="w-full px-4 py-2 bg-slate-100 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Perishables" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Description</label>
                <textarea name="description" defaultValue={editingCategory?.description} className="w-full px-4 py-2 bg-slate-100 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none" placeholder="Purpose of this category..." />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">{editingCategory ? 'Update' : 'Create'} Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {isScannerOpen && (
        <ScannerModal 
          onScan={handleScanResult} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}
    </div>
  );
};

// --- Sidebar Content Helper ---

const SidebarContent: React.FC<{ activeSection: Section, navigateTo: (s: Section) => void }> = ({ activeSection, navigateTo }) => (
  <div className="flex flex-col h-full">
    <div className="p-6 border-b border-slate-800 hidden lg:flex items-center gap-3">
      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
        <Package className="text-white" size={24} />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-white">InventoryPro</h1>
    </div>
    <div className="flex-1 p-4 space-y-2 overflow-y-auto">
      <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active={activeSection === 'dashboard'} onClick={() => navigateTo('dashboard')} />
      <NavItem icon={<Package size={20}/>} label="Inventory" active={activeSection === 'inventory'} onClick={() => navigateTo('inventory')} />
      <NavItem icon={<Tags size={20}/>} label="Categories" active={activeSection === 'categories'} onClick={() => navigateTo('categories')} />
      <NavItem icon={<BrainCircuit size={20}/>} label="AI Research" active={activeSection === 'ai-research'} onClick={() => navigateTo('ai-research')} />
      <div className="pt-4 mt-4 border-t border-slate-800">
        <NavItem icon={<Settings size={20}/>} label="Settings" active={activeSection === 'settings'} onClick={() => navigateTo('settings')} />
      </div>
    </div>
    <div className="p-4 border-t border-slate-800 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold uppercase tracking-tighter text-slate-300">
        v1.2
      </div>
      <span className="text-xs text-slate-500 font-medium">Enterprise Edition</span>
    </div>
  </div>
);

// --- Barcode Scanner Modal Component ---

const ScannerModal: React.FC<{ onScan: (result: string) => void, onClose: () => void }> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let controls: any;

    async function startScanner() {
      try {
        if (!videoRef.current) return;
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        const selectedDevice = videoInputDevices.find(d => d.label.toLowerCase().includes('back')) || videoInputDevices[0];
        
        if (!selectedDevice) {
          throw new Error("No camera found");
        }

        controls = await codeReader.decodeFromVideoDevice(
          selectedDevice.deviceId, 
          videoRef.current, 
          (result) => {
            if (result) {
              onScan(result.getText());
            }
          }
        );
      } catch (err: any) {
        setError(err.message || "Failed to access camera");
      }
    }

    startScanner();

    return () => {
      if (controls) controls.stop();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[110] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl relative">
        <div className="absolute -top-16 left-0 right-0 flex justify-between items-center text-white p-2">
          <div className="flex items-center gap-2">
            <Scan className="text-blue-500" size={24} />
            <h4 className="font-bold text-lg">Visual SKU Scanner</h4>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="aspect-video sm:aspect-square lg:aspect-video bg-black rounded-3xl border-4 border-white/20 overflow-hidden relative shadow-2xl">
          <video ref={videoRef} className="w-full h-full object-cover" />
          
          {!error && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 h-1/2 sm:w-1/2 sm:h-1/3 lg:w-2/3 lg:h-1/2 border-2 border-blue-500 rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan"></div>
                  <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-white"></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-red-900/50 p-6 text-center">
              <Maximize size={48} className="mb-4 opacity-50" />
              <p className="font-bold mb-2 text-xl">Camera Error</p>
              <p className="text-sm text-red-100 max-w-xs">{error}</p>
              <button onClick={onClose} className="mt-8 px-8 py-3 bg-white text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all shadow-xl">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const DashboardView: React.FC<{ stats: any, inventory: Product[] }> = ({ stats, inventory }) => {
  const chartData = useMemo(() => {
    const counts = inventory.reduce((acc: any, curr) => {
      const key = curr.category || 'Unassigned';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500 text-sm lg:text-base">Real-time metrics & stock analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard label="Total Items" value={stats.totalItems} icon={<Package size={24}/>} color="bg-blue-500" />
        <StatCard label="Total Value" value={`$${stats.totalValue.toLocaleString()}`} icon={<TrendingUp size={24}/>} color="bg-emerald-500" />
        <StatCard label="Low Stock" value={stats.lowStock} icon={<Bell size={24}/>} color="bg-amber-500" warning />
        <StatCard label="Out of Stock" value={stats.outOfStock} icon={<Trash2 size={24}/>} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border overflow-hidden min-w-0">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="text-blue-500" size={20} />
            Categories Breakdown
          </h3>
          <div className="h-[250px] lg:h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border flex flex-col max-h-[400px]">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Bell className="text-amber-500" size={20} />
            Urgent Stock Alerts
          </h3>
          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {inventory.filter(i => i.quantity <= i.minStock).length > 0 ? (
              inventory.filter(i => i.quantity <= i.minStock).map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 lg:p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.quantity === 0 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                    <div className="min-w-0">
                      <p className="font-bold text-xs lg:text-sm truncate max-w-[120px] sm:max-w-none text-slate-900">{item.name}</p>
                      <p className="text-[10px] lg:text-xs text-slate-500 font-medium">{item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs lg:text-sm font-bold ${item.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>{item.quantity} units</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
                <BrainCircuit size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-medium">All inventory is optimally stocked.</p>
              </div>
            )}
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
  onResearch: (p: Product, type: 'price' | 'maps') => void
}> = ({ inventory, onAdd, onEdit, onDelete, onResearch }) => (
  <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 text-slate-900">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">Inventory</h2>
        <p className="text-slate-500 text-sm lg:text-base">Track and manage stock levels</p>
      </div>
      <button onClick={onAdd} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30">
        <Plus size={18}/>
        <span>Add Item</span>
      </button>
    </div>

    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Tools</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventory.length > 0 ? (
              inventory.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        <Package size={20}/>
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded tracking-wider">
                      {item.category || "Unassigned"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.location ? (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPinned size={14} />
                        <span className="text-xs font-medium">{item.location}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">Not set</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${item.quantity <= item.minStock ? 'text-amber-600' : 'text-slate-700'}`}>
                      {item.quantity} units
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-900 text-sm">${item.price.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onResearch(item, 'price')} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><TrendingUp size={16}/></button>
                      <button onClick={() => onResearch(item, 'maps')} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><MapPin size={16}/></button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"><Edit3 size={18}/></button>
                      <button onClick={() => onDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-400 text-sm font-medium">Inventory is empty.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden divide-y divide-slate-100">
        {inventory.map(item => (
          <div key={item.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                <p className="text-[10px] text-slate-500 font-bold tracking-tight uppercase">{item.sku}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit(item)} className="p-2 text-slate-400"><Edit3 size={18}/></button>
                <button onClick={() => onDelete(item.id)} className="p-2 text-slate-400"><Trash2 size={18}/></button>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div>
                <span className={`font-bold ${item.quantity <= item.minStock ? 'text-amber-600' : 'text-slate-600'}`}>Stock: {item.quantity}</span>
                {item.location && <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><MapPinned size={10}/> {item.location}</p>}
              </div>
              <span className="font-black text-slate-900">${item.price.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AiResearchView: React.FC<{ analysis: any, isLoading: boolean, onNavigate: (s: Section) => void }> = ({ analysis, isLoading, onNavigate }) => (
  <div className="space-y-6 animate-in zoom-in duration-300 text-slate-900">
    <div>
      <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">Market Intelligence</h2>
      <p className="text-slate-500 text-sm lg:text-base">Real-time analysis powered by Gemini AI</p>
    </div>

    {isLoading ? (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={36} />
        <p className="font-bold text-slate-600">Gemini is searching the web...</p>
      </div>
    ) : analysis ? (
      <div className="bg-white rounded-3xl shadow-sm border p-6 lg:p-8 space-y-6">
        <div className="flex items-center gap-3 text-blue-600"><BrainCircuit size={28} /><h3 className="text-xl font-black">AI Report</h3></div>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm lg:text-base">{analysis.text}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t">
          {analysis.sources?.map((s: any, i: number) => (
            <a key={i} href={s.web?.uri || s.maps?.uri} target="_blank" rel="noreferrer" className="p-3 bg-slate-50 border rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-between group">
              <span className="text-xs font-bold text-slate-600 truncate">{s.web?.title || s.maps?.title || "View Source"}</span>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-500" />
            </a>
          ))}
        </div>
      </div>
    ) : (
      <div className="py-20 text-center bg-white rounded-3xl border border-dashed text-slate-400">
        <BrainCircuit size={48} className="mx-auto mb-4 opacity-10" />
        <p className="font-medium">Start a search from the Inventory section.</p>
      </div>
    )}
  </div>
);

const CategoriesView: React.FC<{ 
  categories: Category[], 
  inventory: Product[], 
  onAdd: () => void, 
  onDelete: (id: string) => void,
  onEdit: (cat: Category) => void 
}> = ({ categories, inventory, onAdd, onDelete, onEdit }) => (
  <div className="space-y-6 animate-in slide-in-from-left-4 duration-500 text-slate-900">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">Categories</h2>
        <p className="text-slate-500 text-sm lg:text-base">Segment your product lines</p>
      </div>
      <button onClick={onAdd} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-all">
        <Plus size={18}/><span>Add Category</span>
      </button>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {categories.map((cat, index) => {
        const itemCount = inventory.filter(i => i.category === cat.name).length;
        return (
          <div key={cat.id} className="bg-white rounded-3xl shadow-sm border p-6 flex flex-col h-full group hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Tags size={24} />
              </div>
              <span className="text-2xl font-black text-slate-100">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">{cat.name}</h3>
            <p className="text-xs text-slate-500 mb-6 flex-1">{cat.description}</p>
            <div className="pt-4 border-t flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{itemCount} items</span>
              <div className="flex gap-2">
                <button onClick={() => onEdit(cat)} className="p-2 text-slate-400 hover:text-blue-600"><Edit3 size={16} /></button>
                <button onClick={() => onDelete(cat.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const SettingsView: React.FC = () => (
  <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-900">
    <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">Settings</h2>
    <div className="bg-white rounded-3xl shadow-sm border divide-y overflow-hidden">
      <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-500"><Bell size={20}/></div>
          <div><p className="font-bold text-slate-900 text-sm">Notifications</p><p className="text-[10px] text-slate-500 font-medium">Stock alerts & AI summaries</p></div>
        </div>
        <div className="w-10 h-5 bg-blue-600 rounded-full flex items-center justify-end px-1 shadow-inner"><div className="w-3.5 h-3.5 bg-white rounded-full shadow" /></div>
      </div>
      <div className="p-6 flex items-center justify-between opacity-50 cursor-not-allowed">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-500"><Settings size={20}/></div>
          <div><p className="font-bold text-slate-900 text-sm">API Integration</p><p className="text-[10px] text-slate-500 font-medium">Gemini API Key configuration</p></div>
        </div>
        <ChevronRight size={20} className="text-slate-300" />
      </div>
    </div>
  </div>
);

const StatCard: React.FC<{ label: string, value: string | number, icon: React.ReactNode, color: string, warning?: boolean }> = ({ label, value, icon, color, warning }) => (
  <div className={`bg-white p-6 rounded-3xl shadow-sm border transition-all hover:shadow-lg ${warning && value !== 0 ? 'border-amber-200' : ''}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className={`text-2xl font-black ${warning && value !== 0 ? 'text-amber-600' : 'text-slate-900'}`}>{value}</h3>
      </div>
      <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
        {icon}
      </div>
    </div>
  </div>
);

export default App;
