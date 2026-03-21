import { useState } from "react";
import { 
  useListTransactions, useCreateTransaction, useListParts,
  getListTransactionsQueryKey, getListPartsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency, translateTransactionType, getTransactionColor } from "@/lib/format";
import { History as HistoryIcon, Plus } from "lucide-react";
import { CreateTransactionInputType, ListTransactionsType } from "@workspace/api-client-react";

export default function Transactions() {
  const [typeFilter, setTypeFilter] = useState<ListTransactionsType | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: transactions, isLoading } = useListTransactions({ type: typeFilter });
  const { data: parts } = useListParts();
  
  const createMutation = useCreateTransaction();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      partId: Number(formData.get("partId")),
      type: formData.get("type") as CreateTransactionInputType,
      quantity: Number(formData.get("quantity")),
      unitPrice: formData.get("unitPrice") ? Number(formData.get("unitPrice")) : null,
      reference: formData.get("reference") as string || null,
      notes: formData.get("notes") as string || null,
    };

    createMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Успешно", description: "Операция проведена" });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPartsQueryKey() });
        setIsDialogOpen(false);
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Ошибка", description: err.message || "Сбой проведения" })
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Журнал операций</h1>
          <p className="text-sm text-slate-500">История движения товаров на складах</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200">
            <Plus className="w-4 h-4 mr-2" /> Провести операцию
          </Button>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Новая операция</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="partId">Запчасть <span className="text-red-500">*</span></Label>
                <select id="partId" name="partId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none">
                  <option value="">Выберите деталь</option>
                  {parts?.map(p => <option key={p.id} value={p.id}>{p.partNumber} — {p.name} (Ост: {p.quantity})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Тип операции <span className="text-red-500">*</span></Label>
                  <select id="type" name="type" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none">
                    <option value="receipt">Приход</option>
                    <option value="issue">Расход</option>
                    <option value="adjustment">Корректировка</option>
                    <option value="transfer">Перемещение</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Количество <span className="text-red-500">*</span></Label>
                  <Input id="quantity" name="quantity" type="number" required min="1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Цена за единицу (необязательно)</Label>
                <Input id="unitPrice" name="unitPrice" type="number" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Документ-основание</Label>
                <Input id="reference" name="reference" placeholder="Счет-фактура №..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Комментарий</Label>
                <Input id="notes" name="notes" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Отмена</Button>
                <Button type="submit" className="bg-blue-600" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Обработка..." : "Провести"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-2 rounded-t-xl overflow-x-auto">
            <Button 
              variant={!typeFilter ? "default" : "outline"} 
              className={!typeFilter ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white"}
              onClick={() => setTypeFilter(undefined)}
            >
              Все операции
            </Button>
            <Button 
              variant={typeFilter === 'receipt' ? "default" : "outline"}
              className={typeFilter === 'receipt' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-white"}
              onClick={() => setTypeFilter(ListTransactionsType.receipt)}
            >
              Приходы
            </Button>
            <Button 
              variant={typeFilter === 'issue' ? "default" : "outline"}
              className={typeFilter === 'issue' ? "bg-blue-600 hover:bg-blue-700" : "bg-white"}
              onClick={() => setTypeFilter(ListTransactionsType.issue)}
            >
              Расходы
            </Button>
            <Button 
              variant={typeFilter === 'adjustment' ? "default" : "outline"}
              className={typeFilter === 'adjustment' ? "bg-amber-600 hover:bg-amber-700" : "bg-white"}
              onClick={() => setTypeFilter(ListTransactionsType.adjustment)}
            >
              Корректировки
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Дата и время</TableHead>
                <TableHead>Деталь</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead className="text-right">Кол-во</TableHead>
                <TableHead className="text-right">Остаток после</TableHead>
                <TableHead>Документ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Загрузка...</TableCell></TableRow>
              ) : transactions?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Операции не найдены</TableCell></TableRow>
              ) : transactions?.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                    {formatDate(tx.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{tx.partName || "Удаленная деталь"}</div>
                    {tx.partNumber && <div className="text-xs text-slate-500 font-mono">{tx.partNumber}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-normal ${getTransactionColor(tx.type)}`}>
                      {translateTransactionType(tx.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={tx.type === 'receipt' ? 'text-emerald-600' : tx.type === 'issue' ? 'text-blue-600' : ''}>
                      {tx.type === 'issue' ? '-' : tx.type === 'receipt' ? '+' : ''}{tx.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {tx.newQuantity}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {tx.reference || "—"}
                    {tx.notes && <div className="text-xs text-slate-400 mt-0.5">{tx.notes}</div>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
