'use client';

import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorState({ title = 'Error', message, retry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <Alert variant="destructive" className="max-w-md">
        <XCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {message}
          {retry && (
            <button
              onClick={retry}
              className="mt-3 text-sm underline underline-offset-4"
            >
              Try again
            </button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon || <Info className="h-12 w-12 text-muted-foreground mb-4" />}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

interface SuccessStateProps {
  title: string;
  description?: string;
}

export function SuccessState({ title, description }: SuccessStateProps) {
  return (
    <Alert className="border-green-500 bg-green-50">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-900">{title}</AlertTitle>
      {description && (
        <AlertDescription className="text-green-800">{description}</AlertDescription>
      )}
    </Alert>
  );
}
