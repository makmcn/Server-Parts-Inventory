import { format } from "date-fns";
import { ru } from "date-fns/locale";

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return "—";
  try {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: ru });
  } catch (e) {
    return dateString;
  }
}

export function translateTransactionType(type: string): string {
  const map: Record<string, string> = {
    receipt: "Приход",
    issue: "Расход",
    adjustment: "Корректировка",
    transfer: "Перемещение"
  };
  return map[type] || type;
}

export function getTransactionColor(type: string): string {
  const map: Record<string, string> = {
    receipt: "bg-emerald-100 text-emerald-800 border-emerald-200",
    issue: "bg-blue-100 text-blue-800 border-blue-200",
    adjustment: "bg-amber-100 text-amber-800 border-amber-200",
    transfer: "bg-purple-100 text-purple-800 border-purple-200"
  };
  return map[type] || "bg-slate-100 text-slate-800 border-slate-200";
}
