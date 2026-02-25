
export enum OrderStatus {
  AWAITING = 'AWAITING',
  ART_DESIGN = 'ART_DESIGN',
  PRODUCTION = 'PRODUCTION',
  FINISHED = 'FINISHED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED'
}

export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  CASH = 'CASH',
  CREDIT_LIMIT = 'CREDIT_LIMIT'
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'BASIC' | 'PRO' | 'PREMIUM';
  cnpj?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
}

export interface ServiceOrder {
  id: string;
  type: 'GRAPHIC' | 'APPAREL';
  status: OrderStatus;
  total: number;
  deadline: string;
  specifications: string; // JSON stringified
  customerId: string;
}

export interface Sale {
  id: string;
  total: number;
  paymentMethod: PaymentMethod;
  isFiscal: boolean;
  createdAt: string;
}
