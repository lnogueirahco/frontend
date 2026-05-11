import ReactMarkdown from 'react-markdown';
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

export function ModalResumoChamado({ response, chamado, onClose }) {
  return (
    <Dialog className="h-[600px]" open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[900px] bg-white dark:bg-zinc-950 border dark:border-zinc-800 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Análise Inteligente: #{chamado?.protocol ?? "Sem Protocolo"}
          </DialogTitle>
          <DialogDescription>
            Relatório detalhado para {chamado?.organizationName ?? "Cliente Externo"}
          </DialogDescription>
        </DialogHeader>

        {/* A classe 'prose' (se instalada) estiliza automaticamente tags MD. 
            Se não tiver, as classes abaixo cuidam do básico.
        */}
        <div className="no-scrollbar max-h-[60vh] overflow-y-auto py-4 px-2">
          <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <ReactMarkdown 
              components={{
                h2: ({node, ...props}) => <h2 className="text-lg font-semibold mt-4 mb-2 text-primary border-b pb-1 border-slate-200 dark:border-slate-800" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc ml-4 space-y-1 mb-4" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                p: ({node, ...props}) => <p className="mb-3" {...props} />,
              }}
            >
              {response}
            </ReactMarkdown>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 dark:border-zinc-800">
          <DialogClose asChild>
            <Button variant="default" onClick={onClose} className="w-full sm:w-auto">
              Entendido
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}