'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategoryForm } from './category-form';
import { useUpdateCategory } from '@/hooks/use-categories';
import { Category, CategoryFormData } from '@/types';

interface EditCategoryDialogProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCategoryDialog({ category, open, onOpenChange }: EditCategoryDialogProps) {
  const updateMutation = useUpdateCategory();

  const handleSubmit = async (data: CategoryFormData) => {
    if (!category) return;
    await updateMutation.mutateAsync({ id: category.id, data });
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      // Reset mutation state when dialog closes
      updateMutation.reset();
    }
  }, [open, updateMutation]);

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <CategoryForm
          defaultValues={{
            name: category.name,
            description: category.description || '',
          }}
          onSubmit={handleSubmit}
          submitLabel="Update Category"
          isSubmitting={updateMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
