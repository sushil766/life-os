"use client";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Hydrated } from "@/components/Hydrated";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/Progress";
import { useSpendingStore } from "@/store/spendingStore";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { currency, currencyPrecise, todayKey } from "@/lib/utils";
import { lastNDays } from "@/lib/scoring";
import { Plus, Trash2, Wallet, Sparkles } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { callAI } from "@/lib/aiClient";
import type { ExpenseCategory } from "@/lib/types";
import { startOfMonth, parseISO, isAfter } from "date-fns";

export default function SpendingPage() {
  return (
    <Hydrated>
      <PageHeader title="Spending" subtitle="Where the money's going · what to cut next month." />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4"><MonthlyBudget /></div>
        <div className="col-span-12 lg:col-span-4"><CategoryDonut /></div>
        <div className="col-span-12 lg:col-span-4"><AISpending /></div>

        <div className="col-span-12 lg:col-span-7"><SpendingTrend /></div>
        <div className="col-span-12 lg:col-span-5"><AddExpense /></div>

        <div className="col-span-12"><ExpenseList /></div>
      </div>
    </Hydrated>
  );
}

function thisMonthExpenses(expenses: ReturnType<typeof useSpendingStore.getState>["expenses"]) {
  const start = startOfMonth(new Date());
  return expenses.filter((e) => isAfter(parseISO(e.date), start) || parseISO(e.date).getTime() === start.getTime());
}

function MonthlyBudget() {
  const expenses = useSpendingStore((s) => s.expenses);
  const budget = useSpendingStore((s) => s.budget);
  const setBudget = useSpendingStore((s) => s.setBudget);
  const month = thisMonthExpenses(expenses);
  const spent = month.reduce((a, x) => a + x.amount, 0);
  const pct = budget.monthly ? Math.min(100, (spent / budget.monthly) * 100) : 0;
  const tone = pct < 60 ? "emerald" : pct < 90 ? "amber" : "rose";

  return (
    <Card>
      <CardHeader title="Monthly budget" subtitle="Cap your overall spend" icon={<Wallet size={16} className="text-rose-300" />} />
      <div className="mb-1 flex items-end justify-between">
        <span className="text-3xl font-semibold text-white">{currency(spent)}</span>
        <Badge tone={tone as any}>{Math.round(pct)}%</Badge>
      </div>
      <div className="text-[11px] text-white/40">of {currency(budget.monthly)} cap</div>
      <div className="mt-2"><ProgressBar value={pct} color={tone === "emerald" ? "emerald" : tone === "amber" ? "amber" : "rose"} /></div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className="text-white/40">Adjust:</span>
        <Input type="number" value={budget.monthly} onChange={(e) => setBudget(parseInt(e.target.value || "0", 10))} className="h-8 w-28 text-xs" />
      </div>
    </Card>
  );
}

function CategoryDonut() {
  const expenses = useSpendingStore((s) => s.expenses);
  const month = thisMonthExpenses(expenses);
  const byCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of month) map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    return EXPENSE_CATEGORIES
      .map((c) => ({ name: c.label, id: c.id, value: map.get(c.id) ?? 0, color: c.color }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [month]);

  return (
    <Card>
      <CardHeader title="By category" subtitle="This month" />
      <div className="h-44 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={byCat} dataKey="value" innerRadius={42} outerRadius={70} paddingAngle={2}>
              {byCat.map((c) => <Cell key={c.id} fill={c.color} stroke="rgba(0,0,0,0.4)" />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#15151f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} formatter={(v: any) => currencyPrecise(v)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1">
        {byCat.slice(0, 4).map((c) => (
          <div key={c.id} className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2 text-white/70">
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
              {c.name}
            </span>
            <span className="text-white/80">{currency(c.value)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SpendingTrend() {
  const expenses = useSpendingStore((s) => s.expenses);
  const days = lastNDays(30);
  const data = days.map((k) => {
    const total = expenses.filter((e) => e.date === k).reduce((acc, e) => acc + e.amount, 0);
    return { label: k.slice(5), amount: +total.toFixed(2) };
  });
  return (
    <Card>
      <CardHeader title="Daily spend" subtitle="Last 30 days" />
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={{ background: "#15151f", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} formatter={(v: any) => currencyPrecise(v)} />
            <Line type="monotone" dataKey="amount" stroke="#fb7185" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function AddExpense() {
  const add = useSpendingStore((s) => s.addExpense);
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayKey());
  return (
    <Card>
      <CardHeader title="Log expense" subtitle="Track it before you forget" icon={<Plus size={16} className="text-rose-300" />} />
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!amount) return;
          add({ amount, category, description, date });
          setAmount(0); setDescription("");
        }}
      >
        <Input type="number" placeholder="Amount" value={amount || ""} onChange={(e) => setAmount(parseFloat(e.target.value || "0"))} step="0.01" />
        <Select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
          {EXPENSE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
        <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button type="submit" variant="primary" icon={<Plus size={14} />}>Add</Button>
      </form>
    </Card>
  );
}

function AISpending() {
  const expenses = useSpendingStore((s) => s.expenses);
  const budget = useSpendingStore((s) => s.budget);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const month = thisMonthExpenses(expenses);
      const total = month.reduce((a, e) => a + e.amount, 0);
      const byCat = new Map<string, number>();
      for (const e of month) byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
      const topCategories = Array.from(byCat.entries()).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
      const r = await callAI("spending_summary", { monthTotal: total, cap: budget.monthly, topCategories });
      setText(r.text);
    } finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader title="AI spending summary" icon={<Sparkles size={16} className="text-violet-300" />} right={<Button size="sm" variant="primary" onClick={run} disabled={loading}>{loading ? "Thinking…" : "Summarize"}</Button>} />
      {text ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-white/85">{text}</p>
      ) : (
        <p className="text-sm text-white/40">Click summarize to get a breakdown + one concrete lever to cut.</p>
      )}
    </Card>
  );
}

function ExpenseList() {
  const expenses = useSpendingStore((s) => s.expenses);
  const remove = useSpendingStore((s) => s.removeExpense);
  const list = [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40);
  return (
    <Card>
      <CardHeader title="Recent expenses" subtitle="Most recent 40" />
      <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
        {list.map((e) => {
          const c = EXPENSE_CATEGORIES.find((x) => x.id === e.category);
          return (
            <div key={e.id} className="group flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2 text-sm">
              <span className="h-6 w-1 rounded-full" style={{ background: c?.color }} />
              <span className="font-medium text-white">{currencyPrecise(e.amount)}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/70">{c?.label}</span>
              {e.description && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="text-white/60">{e.description}</span>
                </>
              )}
              <span className="ml-auto text-[11px] text-white/40">{e.date}</span>
              <button onClick={() => remove(e.id)} className="opacity-0 transition group-hover:opacity-100 text-white/30 hover:text-rose-300">
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
