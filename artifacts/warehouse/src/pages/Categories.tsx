import { useState } from "react";
import { useListCategories, useCreateCategory, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Layers, Plus } from "lucide-react";

export default function Categories() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: categories, isLoading } = useListCategories();
  const createMutation = useCreateCategory();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
    };

    createMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Успешно", description: "Категория добавлена" });
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        setIsDialogOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Категории</h1>
          <p className="text-sm text-slate-500">Группировка номенклатуры</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200">
            <Plus className="w-4 h-4 mr-2" /> Добавить категорию
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая категория</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название <span className="text-red-500">*</span></Label>
                <Input id="name" name="name" required placeholder="Жесткие диски, Память..." />
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
                <TableHead>Описание</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={2} className="text-center py-8 text-slate-500">Загрузка...</TableCell></TableRow>
              ) : categories?.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center py-8 text-slate-500">Категории не найдены</TableCell></TableRow>
              ) : categories?.map((category) => (
                <TableRow key={category.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-medium text-slate-900 flex items-center gap-2">
                    <div className="bg-slate-100 p-1.5 rounded-md"><Layers className="w-4 h-4 text-slate-500" /></div>
                    {category.name}
                  </TableCell>
                  <TableCell className="text-slate-500">{category.description || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
