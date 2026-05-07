// ============================================
// Type Definitions for Multi-Tenant ERP
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'USER';
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price: string | number;
  cost: string | number;
  quantity: number;
  isActive: boolean;
  categoryId?: string;
  category?: Category;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  type: 'in' | 'out';
  quantity: number;
  origin: string;
  reason?: string;
  productId: string;
  product?: Product;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashRegister {
  id: string;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
  initialBalance: string | number;
  finalBalance?: string | number;
  expectedBalance?: string | number;
  difference?: string | number;
  userId: string;
  user?: User;
  tenantId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinancialEntry {
  id: string;
  type: 'in' | 'out';
  category: 'sale' | 'purchase' | 'expense' | 'other';
  value: string | number;
  description?: string;
  paymentMethod?: 'cash' | 'card' | 'pix';
  cashRegisterId?: string;
  cashRegister?: CashRegister;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  status: 'pending' | 'completed' | 'closed' | 'cancelled';
  paymentMethod?: 'cash' | 'card' | 'pix';
  customerName?: string;
  subtotal: string | number;
  discount: string | number;
  tax?: string | number;
  total: string | number;
  notes?: string;
  cashRegisterId?: string;
  cashRegister?: CashRegister;
  userId: string;
  user?: User;
  customerId?: string;
  customer?: Customer;
  items?: SaleItem[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: string | number;
  subtotal: string | number;
  saleId: string;
  sale?: Sale;
  productId: string;
  product?: Product;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  todaySales: {
    count: number;
    total: number;
  };
  openCashRegister?: {
    id: string;
    balance: number;
    openedAt: string;
  };
  lowStockProducts: Product[];
  recentSales: Sale[];
}

export interface SalesReport {
  period: {
    start: string | null;
    end: string | null;
  };
  summary: {
    totalSales: number;
    totalRevenue: number;
    averageTicket: number;
    totalItems: number;
  };
  byPaymentMethod: Record<string, number>;
  data: Sale[];
}

export interface StockReport {
  period: {
    start: string | null;
    end: string | null;
  };
  productId?: string;
  summary: {
    totalMovements: number;
    totalIn: number;
    totalOut: number;
    netMovement: number;
    currentProductQuantity: number | null;
  };
  data: StockMovement[];
}

export interface CashReport {
  date: string;
  registers: CashRegister[];
  entries: FinancialEntry[];
  summary: {
    totalRegisters: number;
    totalInitialBalance: number;
    totalFinalBalance: number;
    totalIn: number;
    totalOut: number;
    netBalance: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface ProductFormData {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price: number;
  cost: number;
  quantity: number;
  categoryId?: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface StockInFormData {
  productId: string;
  quantity: number;
  origin: string;
  reason?: string;
}

export interface StockOutFormData {
  productId: string;
  quantity: number;
  origin: string;
  reason?: string;
}

export interface OpenCashRegisterFormData {
  initialBalance: number;
}

export interface CloseCashRegisterFormData {
  finalBalance: number;
}

export interface FinancialEntryFormData {
  type: 'in' | 'out';
  category: 'sale' | 'purchase' | 'expense' | 'other';
  value: number;
  description?: string;
  paymentMethod?: 'cash' | 'card' | 'pix';
}

export interface CheckoutFormData {
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'pix';
  customerId?: string;
  discount?: number;
}

export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

// Cart item for POS
export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
