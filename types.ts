
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  location?: string;
  quantity: number;
  price: number;
  minStock: number;
  lastUpdated: string;
  description?: string;
  // AI suggested SKU during product analysis
  suggestedSku?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface ActivityLog {
  id: string;
  text: string;
  timestamp: number;
  type: 'add' | 'update' | 'delete' | 'ai';
}

// Added 'settings' to fix errors in App.tsx where 'settings' was used as a Section but not defined in the type
export type Section = 'dashboard' | 'inventory' | 'categories' | 'reports' | 'ai-research' | 'settings';

export interface GroundingSource {
  title: string;
  uri: string;
}
