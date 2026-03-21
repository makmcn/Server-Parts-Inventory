import { useState } from "react";
import { useListWarehouses, useCreateWarehouse, getListWarehousesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus } from "lucide-react";

export default function Warehouses() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: warehouses, isLoading } = useListWarehouses();
  const createMutation = useCreateWarehouse();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      location: formData.get("location") as string || null,
      description: formData.get("description") as string || null,
    };

    createMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Успешно", description: "Склад добавлен" });
        queryClient.invalidateQueries({ queryKey: getListWarehousesQueryKey() });
        setIsDialogOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Склады</h1>
          <p className="text-sm text-slate-500">Места хранения комплектующих</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200">
            <Plus className="w-4 h-4 mr-2" /> Добавить склад
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый склад</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название <span className="text-red-500">*</span></Label>
                <Input id="name" name="name" required placeholder="Основной склад" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Расположение</Label>
                <Input id="location" name="location" placeholder="Серверная 1, Стойка A" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Input id="description" name="description" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Отмена</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>Название</TableHead>
                <TableHead>Расположение</TableHead>
                <TableHead>Описание</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-500">Загрузка...</TableCell></TableRow>
              ) : warehouses?.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-500">Склады не найдены</TableCell></TableRow>
              ) : warehouses?.map((warehouse) => (
                <TableRow key={warehouse.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    {warehouse.name}
                  </TableCell>
                  <TableCell className="text-slate-600">{warehouse.location || "—"}</TableCell>
                  <TableCell className="text-slate-500">{warehouse.description || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
