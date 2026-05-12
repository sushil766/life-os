"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Expense, BudgetMap, ExpenseCategory } from "@/lib/types";
import { buildSeed } from "@/lib/seed";
import { uid } from "@/lib/utils";

interface SpendingState {
  expenses: Expense[];
  budget: BudgetMap;
  addExpense: (e: Omit<Expense, "id">) => void;
  removeExpense: (id: string) => void;
  setBudget: (cap: number) => void;
  setCategoryCap: (c: ExpenseCategory, cap: number) => void;
}

const seed = buildSeed();

export const useSpendingStore = create<SpendingState>()(
  persist(
    (set) => ({
      expenses: seed.expenses,
      budget: {
        monthly: 2400,
        perCategory: {
          food: 320,
          groceries: 350,
          transport: 120,
          subscriptions: 80,
          entertainment: 120,
          shopping: 200,
        },
      },
      addExpense: (e) => set((s) => ({ expenses: [...s.expenses, { ...e, id: uid("ex") }] })),
      removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) })),
      setBudget: (cap) => set((s) => ({ budget: { ...s.budget, monthly: cap } })),
      setCategoryCap: (c, cap) =>
        set((s) => ({
          budget: { ...s.budget, perCategory: { ...s.budget.perCategory, [c]: cap } },
        })),
    }),
    { name: "lifeos:spending:v2", storage: createJSONStorage(() => localStorage) },
  ),
);
