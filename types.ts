export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarColor: string;
}

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
  enableNotifications: boolean;
  theme: 'light' | 'dark';
}

export interface ActivityLog {
  id: string;
  text: string;
  timestamp: number;
  type: 'add' | 'update' | 'delete';
}

export type Section = 'dashboard' | 'inventory' | 'categories' | 'locations' | 'reports' | 'settings' | 'print';

export interface GroundingSource {
  title: string;
  uri: string;
}