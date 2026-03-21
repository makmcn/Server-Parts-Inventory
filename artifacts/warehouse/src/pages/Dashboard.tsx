import { useGetDashboardStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, PackageX, AlertTriangle, Wallet, ArrowUpRight, History as HistoryIcon } from "lucide-react";
import { formatCurrency, formatDate, translateTransactionType, getTransactionColor } from "@/lib/format";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading, error } = useGetDashboardStats();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Загрузка данных...</div>;
  }

  if (error || !stats) {
    return <div className="flex items-center justify-center h-64 text-red-500">Ошибка загрузки данных дашборда.</div>;
  }

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Обзор склада</h1>
        <p className="text-sm text-slate-500">Статистика и последние операции за всё время</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Уникальных позиций</CardTitle>
            <Server className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalParts}</div>
            <p className="text-xs text-slate-500 mt-1">Деталей в каталоге</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Всего единиц на складе</CardTitle>
            <Layers className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.totalItems.toLocaleString("ru-RU")}</div>
            <p className="text-xs text-slate-500 mt-1">Физических предметов</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Общая стоимость</CardTitle>
            <Wallet className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-slate-500 mt-1">Оценочная стоимость склада</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Проблемные позиции</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              <span className="text-amber-600">{stats.lowStockCount}</span>
              <span className="text-slate-300 mx-2">/</span>
              <span className="text-red-600">{stats.outOfStockCount}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Мало остатков / Нет в наличии</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Последние операции</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentTransactions.length > 0 ? stats.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
                      <HistoryIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        <span>{tx.partName}</span>
                        <span className="text-xs text-slate-400 font-mono">{tx.partNumber}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatDate(tx.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={`font-normal ${getTransactionColor(tx.type)}`}>
                      {translateTransactionType(tx.type)}
                    </Badge>
                    <div className="text-right w-24">
                      <div className={`font-semibold ${tx.type === 'receipt' ? 'text-emerald-600' : tx.type === 'issue' ? 'text-blue-600' : 'text-slate-700'}`}>
                        {tx.type === 'issue' ? '-' : tx.type === 'receipt' ? '+' : ''}{tx.quantity} шт
                      </div>
                      <div className="text-xs text-slate-400">
                        {tx.previousQuantity} → {tx.newQuantity}
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-500">Нет недавних транзакций</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Топ категорий</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.topCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {stats.topCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => [`${value} шт.`, 'Количество']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Layers(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
}
