export interface DispatchSheetProductDto {
  productId?: number;
  name: string;
  quantity: number;
  unit?: string;
}

export interface DispatchSheetOrderDto {
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  orderStatus: string;
  deliveryStatus: string;
  paymentMethod: string;
  totalAmount?: number;
  amountReceived?: number;
  balanceDue?: number;
  notes?: string;
  products: DispatchSheetProductDto[];
}

export interface DispatchSheetResponse {
  businessName: string;
  logoUrl?: string;
  date: string;
  printedAt: string;
  printedByName: string;
  totalOrders: number;
  orders: DispatchSheetOrderDto[];
}
