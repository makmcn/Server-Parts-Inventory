import { useState } from "react";
import { 
  useListParts, useCreatePart, useUpdatePart, useDeletePart, 
  useListCategories, useListSuppliers, useListWarehouses,
  getListPartsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { Search, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import type { Part } from "@workspace/api-client-react";

export default function Parts() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [lowStock, setLowStock] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  const { data: parts, isLoading } = useListParts({ search, categoryId, lowStock });
  const { data: categories } = useListCategories();
  const { data: suppliers } = useListSuppliers();
  const { data: warehouses } = useListWarehouses();
  
  const createMutation = useCreatePart();
  const updateMutation = useUpdatePart();
  const deleteMutation = useDeletePart();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleOpenNew = () => {
    setEditingPart(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (part: Part) => {
    setEditingPart(part);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Удалить эту запчасть? Это действие нельзя отменить.")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Успешно", description: "Запчасть удалена" });
        queryClient.invalidateQueries({ queryKey: getListPartsQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: "Ошибка", description: "Не удалось удалить запчасть" })
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      partNumber: formData.get("partNumber") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      categoryId: formData.get("categoryId") ? Number(formData.get("categoryId")) : null,
      supplierId: formData.get("supplierId") ? Number(formData.get("supplierId")) : null,
      warehouseId: formData.get("warehouseId") ? Number(formData.get("warehouseId")) : null,
      quantity: Number(formData.get("quantity")),
      minQuantity: Number(formData.get("minQuantity")),
      unitPrice: formData.get("unitPrice") ? Number(formData.get("unitPrice")) : null,
      unit: formData.get("unit") as string || "шт",
      compatibleModels: formData.get("compatibleModels") as string || null,
    };

    if (editingPart) {
      updateMutation.mutate({ id: editingPart.id, data }, {
        onSuccess: () => {
          toast({ title: "Успешно", description: "Данные обновлены" });
          queryClient.invalidateQueries({ queryKey: getListPartsQueryKey() });
          setIsDialogOpen(false);
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Ошибка", description: err.message || "Сбой обновления" })
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Успешно", description: "Запчасть добавлена" });
          queryClient.invalidateQueries({ queryKey: getListPartsQueryKey() });
          setIsDialogOpen(false);
        },
        onError: (err: any) => toast({ variant: "destructive", title: "Ошибка", description: err.message || "Сбой создания" })
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Каталог запчастей</h1>
          <p className="text-sm text-slate-500">Управление номенклатурой и остатками</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={handleOpenNew} className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200">
            <Plus className="w-4 h-4 mr-2" /> Добавить деталь
          </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPart ? "Редактировать запчасть" : "Новая запчасть"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partNumber">Парт-номер <span className="text-red-500">*</span></Label>
                  <Input id="partNumber" name="partNumber" required defaultValue={editingPart?.partNumber} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Наименование <span className="text-red-500">*</span></Label>
                  <Input id="name" name="name" required defaultValue={editingPart?.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Категория</Label>
                  <select id="categoryId" name="categoryId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none" defaultValue={editingPart?.categoryId || ""}>
                    <option value="">Без категории</option>
                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Поставщик</Label>
                  <select id="supplierId" name="supplierId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none" defaultValue={editingPart?.supplierId || ""}>
                    <option value="">Не выбран</option>
                    {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouseId">Склад</Label>
                  <select id="warehouseId" name="warehouseId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none" defaultValue={editingPart?.warehouseId || ""}>
                    <option value="">Не выбран</option>
                    {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Цена (₽)</Label>
                  <Input id="unitPrice" name="unitPrice" type="number" step="0.01" defaultValue={editingPart?.unitPrice || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Текущий остаток <span className="text-red-500">*</span></Label>
                  <Input id="quantity" name="quantity" type="number" required defaultValue={editingPart?.quantity ?? 0} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minQuantity">Мин. остаток <span className="text-red-500">*</span></Label>
                  <Input id="minQuantity" name="minQuantity" type="number" required defaultValue={editingPart?.minQuantity ?? 5} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Ед. изм. <span className="text-red-500">*</span></Label>
                  <Input id="unit" name="unit" required defaultValue={editingPart?.unit || "шт"} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="compatibleModels">Совместимые модели</Label>
                <Input id="compatibleModels" name="compatibleModels" placeholder="Напр: Dell R740, R750" defaultValue={editingPart?.compatibleModels || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Input id="description" name="description" defaultValue={editingPart?.description || ""} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Отмена</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center rounded-t-xl">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Поиск по P/N или названию..." 
                className="pl-9 bg-white"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={categoryId || ""}
              onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Все категории</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" checked={lowStock} onChange={e => setLowStock(e.target.checked)} />
              Только дефицит
            </label>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="w-[120px]">Парт-номер</TableHead>
                  <TableHead>Наименование</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Склад</TableHead>
                  <TableHead className="text-right">Остаток</TableHead>
                  <TableHead className="text-right">Цена</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Загрузка...</TableCell></TableRow>
                ) : parts?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Запчасти не найдены</TableCell></TableRow>
                ) : parts?.map((part) => {
                  const isLow = part.quantity <= part.minQuantity;
                  return (
                    <TableRow key={part.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="font-mono text-xs font-medium text-slate-600">{part.partNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{part.name}</div>
                        {part.compatibleModels && <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{part.compatibleModels}</div>}
                      </TableCell>
                      <TableCell>
                        {part.categoryName ? <Badge variant="outline" className="bg-slate-100 font-normal">{part.categoryName}</Badge> : <span className="text-slate-400">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {part.warehouseName || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`inline-flex items-center justify-end gap-1.5 font-semibold ${isLow ? "text-red-600" : "text-emerald-600"}`}>
                          {isLow && <AlertCircle className="w-3.5 h-3.5" />}
                          {part.quantity} {part.unit}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-slate-700">{formatCurrency(part.unitPrice)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleOpenEdit(part)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(part.id)} disabled={deleteMutation.isPending}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
