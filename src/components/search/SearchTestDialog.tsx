import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TestDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchTestDialog({ isOpen, onOpenChange }: TestDialogProps) {
  const [counter, setCounter] = useState(0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Diálogo de Teste</DialogTitle>
        </DialogHeader>
        <div className="p-4 flex flex-col items-center space-y-4">
          <div className="text-center">
            <p className="text-xl font-medium">Contador: {counter}</p>
            <p className="text-gray-500 text-sm">Este é um diálogo simples para testar se o problema está na implementação.</p>
          </div>
          <Button 
            onClick={() => setCounter(c => c + 1)} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Incrementar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TestDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchTestDialog({ isOpen, onOpenChange }: TestDialogProps) {
  const [counter, setCounter] = useState(0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Diálogo de Teste</DialogTitle>
        </DialogHeader>
        <div className="p-4 flex flex-col items-center space-y-4">
          <div className="text-center">
            <p className="text-xl font-medium">Contador: {counter}</p>
            <p className="text-gray-500 text-sm">Este é um diálogo simples para testar se o problema está na implementação.</p>
          </div>
          <Button 
            onClick={() => setCounter(c => c + 1)} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Incrementar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 