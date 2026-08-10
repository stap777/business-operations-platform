export interface BusinessSettingsResponse {
  id: number;
  businessName: string;
  phone: string;
  address: string;
  invoicePrefix: string;
  currency: string;
  logoUrl?: string;
  defaultPaymentTerms?: string;
  invoiceFooter?: string;
  updatedAt: string;
}

export interface BusinessSettingsRequest {
  businessName: string;
  phone: string;
  address: string;
  invoicePrefix: string;
  currency: string;
  logoUrl?: string;
  defaultPaymentTerms?: string;
  invoiceFooter?: string;
}
