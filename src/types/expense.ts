export interface Expense {
  id: number;
  expenseNumber: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string; // YYYY-MM-DD
  addedBy?: string;
  isRecurring: boolean;
  recurringFrequency?: string;
  recurringDayOfMonth?: number | null;
  paymentMethod?: string;
  paidTo?: string | null;
  receiptUrl?: string | null;
  receiptPublicId?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseCreateRequest {
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  recurringDayOfMonth?: number | null;
  paymentMethod?: string;
  paidTo?: string | null;
  receiptUrl?: string | null;
  receiptPublicId?: string | null;
  notes?: string | null;
}

export interface ExpenseUpdateRequest {
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  recurringDayOfMonth?: number | null;
  paymentMethod?: string;
  paidTo?: string | null;
  receiptUrl?: string | null;
  receiptPublicId?: string | null;
  notes?: string | null;
}

export interface ExpenseCategorySummary {
  category: string;
  categoryLabel: string;
  totalAmount: number;
  count: number;
  percentageOfTotal: number;
}

export interface ExpenseSummaryResponse {
  totalAmount: number;
  recurringAmount: number;
  oneTimeAmount: number;
  count: number;
  dailyAverage: number;
  categoryBreakdowns: ExpenseCategorySummary[];
  expenses: Expense[];
}

export interface RecurringExpenseItem {
  id: number;
  expenseNumber: string;
  category: string;
  categoryLabel: string;
  description: string;
  amount: number;
  recurringFrequency: string;
  recurringDayOfMonth?: number | null;
  paymentMethod: string;
  paidTo?: string | null;
  loggedForCurrentMonth: boolean;
  lastLoggedDate?: string | null;
  lastLoggedAmount?: number | null;
}

export interface RecurringExpenseScheduleResponse {
  totalMonthlyBudget: number;
  loggedAmountThisMonth: number;
  pendingAmountThisMonth: number;
  totalRecurringCount: number;
  loggedCountThisMonth: number;
  pendingCountThisMonth: number;
  items: RecurringExpenseItem[];
}

export interface ExpenseFilterParams {
  startDate?: string;
  endDate?: string;
  category?: string;
  recurring?: boolean;
}

export const EXPENSE_CATEGORIES = [
  { value: 'SHOP_RENT', label: 'Shop Rent', labelHindi: 'दुकान का किराया', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
  { value: 'ELECTRICITY_BILL', label: 'Electricity Bill', labelHindi: 'बिजली का बिल', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  { value: 'SEWING_SUPPLIES', label: 'Sewing Supplies', labelHindi: 'धागा, सुई, बटन, बकरम', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  { value: 'MACHINE_MAINTENANCE', label: 'Machine Maintenance', labelHindi: 'सिलाई मशीन सर्विसिंग व तेल', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  { value: 'TEA_REFRESHMENTS', label: 'Tea & Refreshments', labelHindi: 'चाय, नाश्ता व पानी', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
  { value: 'SALARY_ADVANCE', label: 'Salary & Worker Advance', labelHindi: 'कारीगर एडवांस / वेतन', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  { value: 'CLEANING_MAINTENANCE', label: 'Cleaning & Upkeep', labelHindi: 'दुकान साफ-सफाई', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800' },
  { value: 'INTERNET_PHONE', label: 'WiFi & Phone', labelHindi: 'WiFi व मोबाइल बिल', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800' },
  { value: 'MARKETING_PACKAGING', label: 'Packaging & Bags', labelHindi: 'पैकिंग बैग व प्रचार', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800' },
  { value: 'TRANSPORT_COURIER', label: 'Transport & Courier', labelHindi: 'ट्रांसपोर्ट व कूरियर', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
  { value: 'MISCELLANEOUS', label: 'Miscellaneous', labelHindi: 'अन्य फुटकर खर्चे', color: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800' },
] as const;

export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash (नकद)' },
  { value: 'UPI', label: 'UPI / GPay / PhonePe / Paytm' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT / IMPS' },
  { value: 'CARD', label: 'Debit / Credit Card' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OTHER', label: 'Other' },
] as const;
