
import { Cliente } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Mail, Phone } from "lucide-react";
import { formatarData, formatarDocumento, formatarTelefone } from "@/lib/formatters";

type ClienteActionsProps = {
  cliente: Cliente;
  onView: (cliente: Cliente) => void;
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
};

export function ClienteActions({ cliente, onView, onEdit, onDelete }: ClienteActionsProps) {
  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onView(cliente);
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(cliente);
        }}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="text-red-500 hover:text-red-600"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(cliente);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export const getClienteColumns = (
  onView: (cliente: Cliente) => void,
  onEdit: (cliente: Cliente) => void,
  onDelete: (cliente: Cliente) => void
) => [
  {
    key: "nome",
    header: "Nome",
    cell: (cliente: Cliente) => (
      <div className="font-medium">{cliente.nome}</div>
    ),
  },
  {
    key: "email",
    header: "Email",
    cell: (cliente: Cliente) => (
      <div className="flex items-center">
        <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
        {cliente.email}
      </div>
    ),
  },
  {
    key: "telefone",
    header: "Telefone",
    cell: (cliente: Cliente) => (
      <div className="flex items-center">
        <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
        {formatarTelefone(cliente.telefone)}
      </div>
    ),
  },
  {
    key: "documento",
    header: "Documento",
    cell: (cliente: Cliente) => formatarDocumento(cliente.documento),
  },
  {
    key: "dataCriacao",
    header: "Data de Cadastro",
    cell: (cliente: Cliente) => formatarData(cliente.dataCriacao),
  },
  {
    key: "ativo",
    header: "Status",
    cell: (cliente: Cliente) => (
      <Badge
        variant="outline"
        className={
          cliente.ativo
            ? "bg-green-100 text-green-800 border-green-200"
            : "bg-gray-100 text-gray-800 border-gray-200"
        }
      >
        {cliente.ativo ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
  {
    key: "actions",
    header: "Ações",
    cell: (cliente: Cliente) => (
      <ClienteActions 
        cliente={cliente} 
        onView={onView} 
        onEdit={onEdit} 
        onDelete={onDelete} 
      />
    ),
  },
];
