export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  location?: string; // Primary location for reference
  locationStocks: Record<string, number>; // Tracks quantity at each location
  price: number;
  minStock: number;
  lastUpdated: string;
  description?: string;
  image?: string; // Base64 or URL
  tags?: string[];
  suggestedSku?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface AppSettings {
  storeName: string;
  currency: string;
  defaultLowStockThreshold: number;
  enableAiFeatures: boolean;
  enableNotifications: boolean;
  theme: 'light' | 'dark';
}

export interface ActivityLog {
  id: string;
  text: string;
  timestamp: number;
  type: 'add' | 'update' | 'delete' | 'ai';
}

export type Section = 'dashboard' | 'inventory' | 'categories' | 'locations' | 'reports' | 'ai-research' | 'settings' | 'print';

export interface GroundingSource {
  title: string;
  uri: string;
}