import { useState } from "react";
import { useListSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, getListSuppliersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Mail, Phone, MapPin } from "lucide-react";
import type { Supplier } from "@workspace/api-client-react";

export default function Suppliers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const { data: suppliers, isLoading } = useListSuppliers();
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleOpenNew = () => {
    setEditingSupplier(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Удалить поставщика?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Успешно", description: "Поставщик удален" });
        queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      contactPerson: formData.get("contactPerson") as string || null,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      address: formData.get("address") as string || null,
      notes: formData.get("notes") as string || null,
    };

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data }, {
        onSuccess: () => {
          toast({ title: "Успешно", description: "Данные обновлены" });
          queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
          setIsDialogOpen(false);
        }
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Успешно", description: "Поставщик добавлен" });
          queryClient.invalidateQueries({ queryKey: getListSuppliersQueryKey() });
          setIsDialogOpen(false);
        }
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Поставщики</h1>
          <p className="text-sm text-slate-500">База контрагентов</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={handleOpenNew} className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200">
            <Plus className="w-4 h-4 mr-2" /> Добавить поставщика
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSupplier ? "Редактировать поставщика" : "Новый поставщик"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название компании <span className="text-red-500">*</span></Label>
                <Input id="name" name="name" required defaultValue={editingSupplier?.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Контактное лицо</Label>
                <Input id="contactPerson" name="contactPerson" defaultValue={editingSupplier?.contactPerson || ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingSupplier?.email || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input id="phone" name="phone" defaultValue={editingSupplier?.phone || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Адрес</Label>
                <Input id="address" name="address" defaultValue={editingSupplier?.address || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Заметки</Label>
                <Input id="notes" name="notes" defaultValue={editingSupplier?.notes || ""} />
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-slate-500">Загрузка...</div>
        ) : suppliers?.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-500 bg-white rounded-xl border border-slate-200">Поставщики не найдены</div>
        ) : suppliers?.map((supplier) => (
          <Card key={supplier.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-slate-900">{supplier.name}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleOpenEdit(supplier)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleDelete(supplier.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-slate-600">
                {supplier.contactPerson && (
                  <div className="font-medium text-slate-800">{supplier.contactPerson}</div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" /> {supplier.phone}
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" /> {supplier.email}
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" /> <span className="truncate">{supplier.address}</span>
                  </div>
                )}
                {!supplier.phone && !supplier.email && !supplier.address && !supplier.contactPerson && (
                  <div className="text-slate-400 italic">Нет контактных данных</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
