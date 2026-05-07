'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/use-categories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoading } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/states';
import { CategoriesTable } from '@/components/categories/categories-table';
import { CreateCategoryDialog } from '@/components/categories/create-category-dialog';
import { EditCategoryDialog } from '@/components/categories/edit-category-dialog';
import { DeleteCategoryDialog } from '@/components/categories/delete-category-dialog';
import { Category } from '@/types';
import { FolderTree } from 'lucide-react';
import { withAuth } from '@/components/auth/with-auth';

function CategoriesPage() {
  const { data: categories, isLoading, error } = useCategories();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorState message="Falha ao carregar categorias. Por favor, tente novamente." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderTree className="h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          </div>
          <p className="text-muted-foreground">
            Organize seus produtos em categorias para melhor gerenciamento
          </p>
        </div>
        <CreateCategoryDialog />
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Categorias</CardDescription>
            <CardTitle className="text-3xl">{categories?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Categorias Ativas</CardDescription>
            <CardTitle className="text-3xl">
              {categories?.filter((c) => c.isActive).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Categorias Inativas</CardDescription>
            <CardTitle className="text-3xl">
              {categories?.filter((c) => !c.isActive).length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Categorias</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as categorias de produtos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoriesTable
            categories={categories || []}
            onEdit={setEditingCategory}
            onDelete={setDeletingCategory}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditCategoryDialog
        category={editingCategory}
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      />
      <DeleteCategoryDialog
        category={deletingCategory}
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      />
    </div>
  );
}

export default withAuth(CategoriesPage, ['admin', 'manager']);
