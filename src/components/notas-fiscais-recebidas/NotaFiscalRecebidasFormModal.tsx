import { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { FileUp, Save, FileX, AlertCircle, Upload, Check, ExternalLink, Loader2 } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

// Interfaces para armazenar dados do XML
interface ProdutoNF {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  ncm: string;
  cfop: string;
}

interface NotaFiscalRecebida {
  id: string;
  numero_nota: string;
  data_emissao: string;
  cnpj_emitente: string;
  nome_emitente: string;
  valor_total: string | number;
  produtos: ProdutoNF[];
  data_lancamento: string;
  observacoes?: string;
  xml_base64?: string;
}

// Interface para os valores do formulário
interface FormValues {
  numero_nota: string;
  data_emissao: string;
  cnpj_emitente: string;
  nome_emitente: string;
  valor_total: string | number;
  observacoes?: string;
}

// Schema de validação
const formSchema = z.object({
  numero_nota: z.string().min(1, "Número da nota é obrigatório"),
  data_emissao: z.string().min(1, "Data de emissão é obrigatória"),
  cnpj_emitente: z.string().min(1, "CNPJ do emitente é obrigatório"),
  nome_emitente: z.string().min(1, "Nome do emitente é obrigatório"),
  valor_total: z.union([
    z.string(),
    z.number().min(0, "O valor total não pode ser negativo")
  ]),
  observacoes: z.string().optional(),
  // Produtos são validados separadamente
});

interface NotaFiscalRecebidasFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  notaFiscalParaEditar: NotaFiscalRecebida | null;
  onNotaFiscalSalva: () => void;
}

export function NotaFiscalRecebidasFormModal({ 
  isOpen, 
  onClose, 
  notaFiscalParaEditar, 
  onNotaFiscalSalva 
}: NotaFiscalRecebidasFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [xmlParseError, setXmlParseError] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<ProdutoNF[]>([]);
  const [xmlBase64, setXmlBase64] = useState<string | null>(null);
  const [numeroNotaDuplicado, setNumeroNotaDuplicado] = useState(false);
  const [verificandoNumero, setVerificandoNumero] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero_nota: '',
      data_emissao: new Date().toISOString().split('T')[0],
      cnpj_emitente: '',
      nome_emitente: '',
      valor_total: 0,
      observacoes: '',
    },
  });

  // Observar mudanças no número da nota para verificar duplicatas
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "numero_nota" && value.numero_nota) {
        verificarNotaDuplicada(value.numero_nota);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Verificar se a nota já existe no banco de dados
  const verificarNotaDuplicada = async (numeroNota: string) => {
    if (!numeroNota || numeroNota.trim() === "") return;
    
    // Evitar verificação se estamos editando a mesma nota
    if (notaFiscalParaEditar && notaFiscalParaEditar.numero_nota === numeroNota) {
      setNumeroNotaDuplicado(false);
      return;
    }
    
    setVerificandoNumero(true);
    try {
      const { data, error } = await supabase
        .from('notas_fiscais_recebidas' as any)
        .select('id')
        .eq('numero_nota', numeroNota)
        .maybeSingle();
      
      if (error) throw error;
      
      setNumeroNotaDuplicado(!!data);
    } catch (error) {
      console.error("Erro ao verificar duplicidade:", error);
    } finally {
      setVerificandoNumero(false);
    }
  };

  // Carregar dados para edição
  useEffect(() => {
    if (notaFiscalParaEditar) {
      const formValues: FormValues = {
        numero_nota: notaFiscalParaEditar.numero_nota,
        data_emissao: notaFiscalParaEditar.data_emissao,
        cnpj_emitente: notaFiscalParaEditar.cnpj_emitente,
        nome_emitente: notaFiscalParaEditar.nome_emitente,
        valor_total: notaFiscalParaEditar.valor_total,
        observacoes: notaFiscalParaEditar.observacoes || '',
      };
      form.reset(formValues);
      setProdutos(notaFiscalParaEditar.produtos || []);
      setXmlBase64(notaFiscalParaEditar.xml_base64 || null);
    } else {
      const defaultValues: FormValues = {
        numero_nota: '',
        data_emissao: new Date().toISOString().split('T')[0],
        cnpj_emitente: '',
        nome_emitente: '',
        valor_total: "0",
        observacoes: '',
      };
      form.reset(defaultValues);
      setProdutos([]);
      setXmlBase64(null);
      setXmlFile(null);
    }
  }, [notaFiscalParaEditar, isOpen, form]);

  // Função para lidar com o upload de arquivo XML
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/xml" && !file.name.toLowerCase().endsWith(".xml")) {
      setXmlParseError("O arquivo selecionado não é um XML válido.");
      setXmlFile(null);
      return;
    }

    setXmlFile(file);
    setXmlParseError(null);

    // Ler arquivo como texto
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        try {
          const xmlString = event.target.result as string;
          
          // Converter arquivo para base64 para armazenamento
          const base64Reader = new FileReader();
          base64Reader.onload = (e) => {
            if (e.target?.result) {
              const base64String = e.target.result.toString().split(',')[1];
              setXmlBase64(base64String);
            }
          };
          base64Reader.readAsDataURL(file);
          
          // Parsear XML
          parseXmlNfe(xmlString);
        } catch (error) {
          console.error("Erro ao ler XML:", error);
          setXmlParseError("Não foi possível ler o arquivo XML. Verifique se o formato é válido.");
        }
      }
    };
    reader.readAsText(file);
  };

  // Função para extrair dados do XML da NF-e
  const parseXmlNfe = (xmlString: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
      
      // Verificar se o XML é válido e tem a estrutura esperada de uma NF-e
      const nfeNode = xmlDoc.getElementsByTagName("NFe")[0] || xmlDoc.getElementsByTagName("nfeProc")[0];
      
      if (!nfeNode) {
        setXmlParseError("O arquivo não parece ser uma NF-e válida.");
        return;
      }

      // Extrair informações básicas da nota
      const ide = xmlDoc.getElementsByTagName("ide")[0];
      const emit = xmlDoc.getElementsByTagName("emit")[0];
      const total = xmlDoc.getElementsByTagName("total")[0]?.getElementsByTagName("ICMSTot")[0];
      
      if (ide && emit && total) {
        // Extrair número da nota
        const nNF = ide.getElementsByTagName("nNF")[0]?.textContent || "";
        
        // Extrair data de emissão e formatar
        const dhEmi = ide.getElementsByTagName("dhEmi")[0]?.textContent || 
                    ide.getElementsByTagName("dEmi")[0]?.textContent || "";
        const dataEmissao = dhEmi ? dhEmi.split('T')[0] : "";
        
        // Dados do emitente
        const cnpj = emit.getElementsByTagName("CNPJ")[0]?.textContent || "";
        const xNome = emit.getElementsByTagName("xNome")[0]?.textContent || "";
        
        // Valor total
        const vNF = total.getElementsByTagName("vNF")[0]?.textContent || "0";
        
        // Preencher o formulário com os dados extraídos
        form.setValue("numero_nota", nNF);
        form.setValue("data_emissao", dataEmissao);
        form.setValue("cnpj_emitente", formatCNPJ(cnpj));
        form.setValue("nome_emitente", xNome);
        form.setValue("valor_total", vNF);
        
        // Extrair produtos
        const detNodes = xmlDoc.getElementsByTagName("det");
        const produtosArray: ProdutoNF[] = [];
        
        for (let i = 0; i < detNodes.length; i++) {
          const prod = detNodes[i].getElementsByTagName("prod")[0];
          if (prod) {
            const produto: ProdutoNF = {
              codigo: prod.getElementsByTagName("cProd")[0]?.textContent || "",
              descricao: prod.getElementsByTagName("xProd")[0]?.textContent || "",
              quantidade: parseFloat(prod.getElementsByTagName("qCom")[0]?.textContent || "0"),
              unidade: prod.getElementsByTagName("uCom")[0]?.textContent || "",
              valorUnitario: parseFloat(prod.getElementsByTagName("vUnCom")[0]?.textContent || "0"),
              valorTotal: parseFloat(prod.getElementsByTagName("vProd")[0]?.textContent || "0"),
              ncm: prod.getElementsByTagName("NCM")[0]?.textContent || "",
              cfop: prod.getElementsByTagName("CFOP")[0]?.textContent || "",
            };
            produtosArray.push(produto);
          }
        }
        
        setProdutos(produtosArray);
        toast.success("XML carregado com sucesso!");
      } else {
        setXmlParseError("Não foi possível extrair as informações necessárias do XML.");
      }
    } catch (error) {
      console.error("Erro ao processar XML:", error);
      setXmlParseError("Erro ao processar o arquivo XML.");
    }
  };

  // Formatar CNPJ: 12345678000123 para 12.345.678/0001-23
  const formatCNPJ = (cnpj: string): string => {
    if (!cnpj || cnpj.length !== 14) return cnpj;
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  // Formatar valor monetário
  const formatCurrency = (valor: string | number): string => {
    // Garantir que o valor seja numérico
    const valorNumerico = typeof valor === 'string'
      ? parseFloat(valor.replace(/,/g, '.')) || 0
      : valor || 0;
      
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valorNumerico);
  };

  // Função para salvar a nota fiscal no banco de dados
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (produtos.length === 0) {
      toast.error("Adicione pelo menos um produto à nota fiscal.");
      return;
    }

    if (numeroNotaDuplicado) {
      toast.error("Esta nota fiscal já foi cadastrada. Por favor, verifique o número da nota.");
      return;
    }

    setIsLoading(true);

    try {
      // Preparar dados para salvar
      const notaFiscal = {
        numero_nota: values.numero_nota,
        data_emissao: values.data_emissao,
        cnpj_emitente: values.cnpj_emitente.replace(/\D/g, ''), // Remover formatação
        nome_emitente: values.nome_emitente,
        valor_total: values.valor_total,
        produtos: produtos,
        observacoes: values.observacoes || null,
        xml_base64: xmlBase64 || null,
        data_lancamento: new Date().toISOString(),
      };

      // Verificar duplicidade uma última vez antes de salvar
      if (!notaFiscalParaEditar) {
        const { data, error } = await supabase
          .from('notas_fiscais_recebidas' as any)
          .select('id')
          .eq('numero_nota', values.numero_nota)
          .maybeSingle();
        
        if (data) {
          setNumeroNotaDuplicado(true);
          throw new Error("Esta nota fiscal já foi cadastrada");
        }
      }

      if (notaFiscalParaEditar) {
        // Atualizar nota existente
        const { data, error } = await supabase
          .from('notas_fiscais_recebidas' as any)
          .update(notaFiscal)
          .eq('id', notaFiscalParaEditar.id)
          .select();

        if (error) {
          throw error;
        }

        toast.success("Nota fiscal atualizada com sucesso!");
      } else {
        // Criar nova nota
        const { data, error } = await supabase
          .from('notas_fiscais_recebidas' as any)
          .insert([notaFiscal])
          .select();

        if (error) {
          throw error;
        }

        toast.success("Nota fiscal recebida salva com sucesso!");
      }
      
      // Fechar o modal e recarregar a lista
      onClose();
      onNotaFiscalSalva();
    } catch (error) {
      console.error("Erro ao salvar nota fiscal:", error);
      toast.error("Não foi possível salvar a nota fiscal. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Adicionar produto manualmente
  const adicionarProdutoVazio = () => {
    setProdutos([
      ...produtos,
      {
        codigo: "",
        descricao: "",
        quantidade: 0,
        unidade: "UN",
        valorUnitario: 0,
        valorTotal: 0,
        ncm: "",
        cfop: "",
      }
    ]);
  };

  // Atualizar produto
  const atualizarProduto = (index: number, campo: keyof ProdutoNF, valor: string | number) => {
    const novosProdutos = [...produtos];
    
    // Se o campo for quantidade ou valorUnitario, recalcular o valorTotal
    if (campo === 'quantidade' || campo === 'valorUnitario') {
      novosProdutos[index][campo] = Number(valor);
      
      // Recalcular o valor total
      const quantidade = campo === 'quantidade' ? Number(valor) : novosProdutos[index].quantidade;
      const valorUnitario = campo === 'valorUnitario' ? Number(valor) : novosProdutos[index].valorUnitario;
      novosProdutos[index].valorTotal = quantidade * valorUnitario;
    } else {
      // @ts-ignore - Para outros campos
      novosProdutos[index][campo] = valor;
    }
    
    setProdutos(novosProdutos);
  };

  // Remover produto
  const removerProduto = (index: number) => {
    const novosProdutos = [...produtos];
    novosProdutos.splice(index, 1);
    setProdutos(novosProdutos);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-erio-600 flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            {notaFiscalParaEditar ? 'Editar Nota Fiscal Recebida' : 'Nova Nota Fiscal Recebida'}
          </DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo XML de NF-e ou preencha os dados manualmente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload de XML */}
          {!notaFiscalParaEditar && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-full">
                  <Label htmlFor="xml-upload" className="font-medium text-gray-700 block mb-2">
                    Arquivo XML da NF-e
                  </Label>
                  
                  <div className="flex items-center space-x-4">
                    <Input
                      id="xml-upload"
                      type="file"
                      accept=".xml"
                      onChange={handleFileUpload}
                      className="flex-1 border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                    />
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open('https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=resumo&tipoConteudo=7PhJ+gAVw2g=', '_blank')}
                      className="flex items-center gap-1 text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Consultar na SEFAZ
                    </Button>
                    
                    {xmlFile && (
                      <span className="text-sm text-green-600 flex items-center">
                        <Check className="h-4 w-4 mr-1" />
                        {xmlFile.name}
                      </span>
                    )}
                  </div>
                  
                  {xmlParseError && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-sm font-medium">Erro ao carregar XML</AlertTitle>
                      <AlertDescription className="text-xs">
                        {xmlParseError}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Faça upload do arquivo XML da NF-e para preenchimento automático dos campos ou consulte a nota no portal da SEFAZ.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Formulário para dados da nota fiscal */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados básicos da nota */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="numero_nota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Número da Nota Fiscal <span className="text-red-500">*</span></FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ex: 123456"
                              className={`border-${numeroNotaDuplicado ? 'red-500' : 'gray-300'} focus:border-${numeroNotaDuplicado ? 'red-500' : 'erio-500'} focus:ring-${numeroNotaDuplicado ? 'red-500' : 'erio-500'} pr-10`}
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value === "") {
                                  setNumeroNotaDuplicado(false);
                                }
                              }}
                            />
                          </FormControl>
                          {verificandoNumero && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            </div>
                          )}
                        </div>
                        {numeroNotaDuplicado && (
                          <Alert variant="destructive" className="mt-2 py-2 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Esta nota fiscal já foi cadastrada no sistema
                          </Alert>
                        )}
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_emissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Data de Emissão <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            className="border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valor_total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Valor Total <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            onChange={(e) => {
                              const val = e.target.value;
                              // Enviamos a string diretamente para manter compatibilidade com o banco
                              field.onChange(val);
                            }}
                            placeholder="0,00"
                            className="border-gray-300 focus:border-erio-500 focus:ring-erio-500 text-green-600 font-medium"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cnpj_emitente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">CNPJ do Emitente <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: 12.345.678/0001-90"
                            className="border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nome_emitente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Nome do Emitente <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: Empresa LTDA"
                            className="border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Observações adicionais"
                            className="min-h-[80px] border-gray-300 focus:border-erio-500 focus:ring-erio-500"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Lista de produtos */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-gray-700 font-medium">Produtos da Nota Fiscal</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={adicionarProdutoVazio}
                    className="text-xs"
                  >
                    Adicionar Produto
                  </Button>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Código</TableHead>
                        <TableHead className="min-w-[200px]">Descrição</TableHead>
                        <TableHead className="w-[80px]">Qtd</TableHead>
                        <TableHead className="w-[80px]">Un</TableHead>
                        <TableHead className="w-[100px]">Valor Un.</TableHead>
                        <TableHead className="w-[100px]">Valor Total</TableHead>
                        <TableHead className="w-[80px]">NCM</TableHead>
                        <TableHead className="w-[80px]">CFOP</TableHead>
                        <TableHead className="w-[70px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-6 text-gray-500">
                            Nenhum produto adicionado. Faça upload de um XML ou adicione produtos manualmente.
                          </TableCell>
                        </TableRow>
                      ) : (
                        produtos.map((produto, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                value={produto.codigo}
                                onChange={(e) => atualizarProduto(index, 'codigo', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={produto.descricao}
                                onChange={(e) => atualizarProduto(index, 'descricao', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={produto.quantidade}
                                step="0.01"
                                onChange={(e) => atualizarProduto(index, 'quantidade', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={produto.unidade}
                                onChange={(e) => atualizarProduto(index, 'unidade', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={produto.valorUnitario}
                                step="0.01"
                                onChange={(e) => atualizarProduto(index, 'valorUnitario', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(produto.valorTotal)}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={produto.ncm}
                                onChange={(e) => atualizarProduto(index, 'ncm', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={produto.cfop}
                                onChange={(e) => atualizarProduto(index, 'cfop', e.target.value)}
                                className="h-8 text-xs"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removerProduto(index)}
                                className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                              >
                                <FileX className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="mt-6"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-erio-600 hover:bg-erio-700 text-white mt-6"
                  disabled={isLoading || numeroNotaDuplicado || verificandoNumero}
                >
                  {isLoading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {notaFiscalParaEditar ? 'Atualizar' : 'Salvar'} Nota Fiscal
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}