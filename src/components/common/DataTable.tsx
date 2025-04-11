import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Printer
} from "lucide-react";
import { useState } from "react";
import { EmptyState } from "./EmptyState";

interface Column {
  key: string;
  header: string;
  cell?: (item: any) => React.ReactNode;
  width?: string;
}

interface DataTableProps {
  title: string;
  description?: string;
  columns: Column[];
  data: any[];
  actions?: React.ReactNode;
  onRowClick?: (item: any) => void;
}

export const DataTable = ({
  title,
  description,
  columns,
  data,
  actions,
  onRowClick,
}: DataTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const itemsPerPage = 10;
  
  const filteredData = search.trim()
    ? data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;
  
  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return sortDirection === "asc"
          ? aValue - bValue
          : bValue - aValue;
      })
    : filteredData;
  
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);
  
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1); // Reset para primeira página ao pesquisar
                }}
                className="pl-9"
              />
            </div>
            {actions}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {paginatedData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className="cursor-pointer hover:text-erio-600"
                      style={{ width: column.width }}
                      onClick={() => handleSort(column.key)}
                    >
                      <div className="flex items-center">
                        {column.header}
                        {sortColumn === column.key && (
                          <span className="ml-1">
                            {sortDirection === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item, index) => (
                  <TableRow
                    key={item.id || index}
                    className={onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" : ""}
                    onClick={() => onRowClick && onRowClick(item)}
                  >
                    {columns.map((column) => (
                      <TableCell key={`${item.id || index}-${column.key}`}>
                        {column.cell
                          ? column.cell(item)
                          : item[column.key] || "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Nenhum registro encontrado"
            description={
              search.trim()
                ? "Tente usar termos diferentes na sua pesquisa."
                : "Nenhum dado disponível para exibição."
            }
          />
        )}
      </CardContent>
      <CardFooter className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t">
        <div className="text-sm text-gray-500 mb-4 md:mb-0">
          Mostrando {Math.min(startIndex + 1, sortedData.length)} a{" "}
          {Math.min(startIndex + itemsPerPage, sortedData.length)} de{" "}
          {sortedData.length} registros
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center mr-4">
            <Button
              variant="outline"
              size="icon"
              title="Exportar Excel"
              className="text-gray-500 hover:text-erio-600"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Exportar PDF"
              className="text-gray-500 hover:text-erio-600 ml-1"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Imprimir"
              className="text-gray-500 hover:text-erio-600 ml-1"
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm mx-2">
            Página {currentPage} de {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
