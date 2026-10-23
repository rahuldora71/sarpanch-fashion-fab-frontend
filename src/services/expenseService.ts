import ApiClient from "@/config/ApiClient";
import type {
  Expense,
  ExpenseCreateRequest,
  ExpenseUpdateRequest,
  ExpenseSummaryResponse,
  RecurringExpenseScheduleResponse,
  ExpenseFilterParams,
} from "@/types/expense";

const BASE = "/expenses";

export async function getExpenses(params?: ExpenseFilterParams): Promise<ExpenseSummaryResponse> {
  const { data } = await ApiClient.get<ExpenseSummaryResponse>(BASE, {
    params: {
      startDate: params?.startDate || undefined,
      endDate: params?.endDate || undefined,
      category: params?.category || undefined,
      recurring: params?.recurring !== undefined ? params.recurring : undefined,
    },
  });
  return data;
}

export async function getExpenseById(id: number): Promise<Expense> {
  const { data } = await ApiClient.get<Expense>(`${BASE}/${id}`);
  return data;
}

export async function createExpense(payload: ExpenseCreateRequest): Promise<Expense> {
  const { data } = await ApiClient.post<Expense>(BASE, payload);
  return data;
}

export async function updateExpense(id: number, payload: ExpenseUpdateRequest): Promise<Expense> {
  const { data } = await ApiClient.put<Expense>(`${BASE}/${id}`, payload);
  return data;
}

export async function deleteExpense(id: number): Promise<void> {
  await ApiClient.delete(`${BASE}/${id}`);
}

export async function getRecurringExpensesSchedule(): Promise<RecurringExpenseScheduleResponse> {
  const { data } = await ApiClient.get<RecurringExpenseScheduleResponse>(`${BASE}/recurring`);
  return data;
}

export async function logRecurringExpenseInstance(
  id: number,
  params?: {
    targetDate?: string;
    customAmount?: number;
    paymentMethod?: string;
    notes?: string;
  }
): Promise<Expense> {
  const { data } = await ApiClient.post<Expense>(`${BASE}/recurring/${id}/log`, null, {
    params: {
      targetDate: params?.targetDate || undefined,
      customAmount: params?.customAmount !== undefined ? params.customAmount : undefined,
      paymentMethod: params?.paymentMethod || undefined,
      notes: params?.notes || undefined,
    },
  });
  return data;
}
