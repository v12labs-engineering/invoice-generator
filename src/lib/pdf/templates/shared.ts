export type InvoicePdfData = {
  number: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  terms?: string | null;
  business: {
    name: string;
    addressLines: string[];
    email: string;
    phone?: string | null;
    taxId?: string | null;
    bankDetails?: string | null;
    logoUrl?: string | null;
  };
  client: {
    name: string;
    email?: string | null;
    addressLines: string[];
    taxId?: string | null;
  };
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
};
