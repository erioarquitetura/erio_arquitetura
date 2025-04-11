import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  listarNotificacoes, 
  contarNotificacoesNaoLidas, 
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas
} from "@/services/notificacaoService";
import { Notificacao } from "@/types";
import { formatarData } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";

export function NotificacaoBadge() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Carregar notificações ao inicializar ou abrir o popover
  useEffect(() => {
    function carregarNotificacoes() {
      const todasNotificacoes = listarNotificacoes();
      setNotificacoes(todasNotificacoes);
      setNaoLidas(contarNotificacoesNaoLidas());
    }

    carregarNotificacoes();
    
    // Atualizar a cada 30 segundos para novos dados
    const interval = setInterval(carregarNotificacoes, 30000);
    
    return () => clearInterval(interval);
  }, [open]);

  // Abrir a proposta ao clicar na notificação
  const handleNotificacaoClick = (notificacao: Notificacao) => {
    // Marcar como lida
    marcarNotificacaoComoLida(notificacao.id);
    
    // Atualizar a lista
    setNotificacoes(prev => 
      prev.map(n => 
        n.id === notificacao.id ? {...n, lida: true} : n
      )
    );
    
    // Atualizar contador
    setNaoLidas(prev => Math.max(0, prev - 1));
    
    // Fechar popover
    setOpen(false);
    
    // Navegar para a página da proposta
    navigate(`/propostas?id=${notificacao.proposta_id}`);
  };

  // Marcar todas como lidas
  const handleLerTodas = () => {
    marcarTodasNotificacoesComoLidas();
    setNotificacoes(prev => prev.map(n => ({...n, lida: true})));
    setNaoLidas(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="text-lg font-semibold">Notificações</h3>
          {naoLidas > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs"
              onClick={handleLerTodas}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[350px]">
          {notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notificacoes.map((notificacao) => (
                <div 
                  key={notificacao.id}
                  className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
                    !notificacao.lida ? 'bg-blue-50 dark:bg-blue-950' : ''
                  }`}
                  onClick={() => handleNotificacaoClick(notificacao)}
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium text-sm">{notificacao.titulo}</h4>
                    <span className="text-xs text-muted-foreground">
                      {formatarData(notificacao.data_criacao, true)}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{notificacao.mensagem}</p>
                  {notificacao.comentario && (
                    <div className="mt-2 bg-muted p-2 rounded-md text-xs">
                      <p className="font-medium mb-1">Comentário do cliente:</p>
                      <p>{notificacao.comentario}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
} 