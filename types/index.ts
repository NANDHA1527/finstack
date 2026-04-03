export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color?: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string; // ID of the Category
  type: TransactionType;
  provider?: string; // New field for advanced tracking
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: "monthly";
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
}
