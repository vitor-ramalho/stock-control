'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CategoryForm } from './category-form';
import { useCreateCategory } from '@/hooks/use-categories';
import { CategoryFormData } from '@/types';

export function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateCategory();

  const handleSubmit = async (data: CategoryFormData) => {
    await createMutation.mutateAsync(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        <CategoryForm
          onSubmit={handleSubmit}
          submitLabel="Create Category"
          isSubmitting={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
