import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ConfirmationDialog = ({ open, onOpenChange, onConfirm, title, description }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white backdrop-blur-lg border-gray-200/50 shadow-xl rounded-2xl">
        <AlertDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <AlertDialogTitle className="text-center text-lg font-semibold text-gray-900 mt-4">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm text-gray-500 mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 sm:flex-col-reverse gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline">
                Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              onClick={onConfirm} 
              className="bg-red-600 text-white hover:bg-red-700 shadow-sm gap-2 sm:flex-col-reverse"
            >
              Confirm
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationDialog;

