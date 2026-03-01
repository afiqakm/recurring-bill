export type Item = {
  id: string;
  name: string;
  category: string;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type ListItemsParams = {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type ListItemsResult = {
  items: Item[];
  categories: string[];
  total: number;
  limit: number;
  offset: number;
};

export type UpsertRow = {
  name: string;
  category?: string;
  source?: string;
};

export type ImportSummary = {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export type Transaction = {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  month: string;
  amount: number;
  dueDay: number | null;
  paid: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type ListTransactionsParams = {
  category?: string;
  search?: string;
  month?: string;
  limit?: number;
  offset?: number;
};

export type ListTransactionsResult = {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
};
