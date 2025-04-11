import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { testSupabaseConnection, checkSupabaseSchema } from '@/services/testSupabaseConnection';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  RefreshCw, 
  Server, 
  X, 
  Key, 
  HardDrive,
  Gauge,
  CloudCog,
  Clock,
  ShieldCheck,
  Table,
  Lock,
  FileJson
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define os tipos para os resultados dos testes
interface ConnectionResult {
  connected: boolean;
  status?: number;
  error?: string;
  details?: any;
  message: string;
  projectId?: string;
  projectUrl?: string;
  count?: any;
  config?: {
    supabaseUrl: string;
    supabaseKey: string;
    projectId: string;
    apiVersion: string;
    clientVersion: string;
  };
  limits?: {
    rowLimit: string;
    storageLimit: string;
    bandwidthLimit: string;
    plan: string;
  };
  performance?: {
    ping: number;
    status: string;
  };
}

interface SchemaResult {
  schema?: {
    tables: Array<{
      name: string;
      count: number;
      accessible: boolean;
    }>;
    permissions: string;
    authentication: {
      user: any;
      status: string;
    };
    storage?: {
      available: boolean;
      buckets: number;
    };
    database?: {
      version: string;
      extensions: string[];
    };
  };
  error?: string;
}

// Interface para unir os resultados
interface TestResults {
  connection: ConnectionResult | null;
  schema: SchemaResult | null;
  lastTested: Date | null;
}

const SupabaseTest = () => {
  const [results, setResults] = useState<TestResults>({
    connection: null,
    schema: null,
    lastTested: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("connection");

  const runTests = async () => {
    setLoading(true);
    try {
      // Testa a conexão com o Supabase
      const connectionResult = await testSupabaseConnection();
      
      // Se a conexão foi bem sucedida, verifica o schema
      let schemaResult = null;
      if (connectionResult.connected) {
        schemaResult = await checkSupabaseSchema();
      }
      
      // Atualiza os resultados
      setResults({
        connection: connectionResult,
        schema: schemaResult,
        lastTested: new Date(),
      });
    } catch (error) {
      console.error("Erro ao executar testes do Supabase:", error);
    } finally {
      setLoading(false);
    }
  };

  // Executa o teste ao carregar a página
  useEffect(() => {
    runTests();
  }, []);

  return (
    <PageLayout title="Teste de Conexão com Supabase">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-2xl font-bold">Status da Conexão</CardTitle>
              <CardDescription>
                Teste de conectividade com o banco de dados Supabase
              </CardDescription>
            </div>
            <Button 
              onClick={runTests} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {loading ? "Executando..." : "Testar Novamente"}
            </Button>
          </CardHeader>
          <CardContent>
            {!results.connection ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status principal */}
                <div className="flex items-center gap-4">
                  <div className={`rounded-full p-3 ${results.connection.connected ? 'bg-green-100' : 'bg-red-100'}`}>
                    {results.connection.connected ? (
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">
                      {results.connection.connected ? 'Conectado' : 'Falha na conexão'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {results.connection.message}
                    </p>
                    {results.lastTested && (
                      <p className="text-xs text-gray-400 mt-1">
                        Última verificação: {results.lastTested.toLocaleString()}
                      </p>
                    )}
                    {results.connection.performance && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={
                          results.connection.performance.status === 'Ótimo' ? 'default' :
                          results.connection.performance.status === 'Bom' ? 'secondary' :
                          'outline'
                        }>
                          <Clock className="mr-1 h-3 w-3" />
                          {results.connection.performance.ping}ms
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {results.connection.performance.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                {/* Tabs para detalhes */}
                <Tabs defaultValue="connection" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="connection">
                      <Server className="h-4 w-4 mr-2" />
                      Conexão
                    </TabsTrigger>
                    <TabsTrigger value="config">
                      <CloudCog className="h-4 w-4 mr-2" />
                      Configuração
                    </TabsTrigger>
                    <TabsTrigger value="schema" disabled={!results.schema}>
                      <Database className="h-4 w-4 mr-2" />
                      Banco de Dados
                    </TabsTrigger>
                    <TabsTrigger value="limits" disabled={!results.connection.limits}>
                      <Gauge className="h-4 w-4 mr-2" />
                      Recursos
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab Conexão */}
                  <TabsContent value="connection" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Status HTTP:</span>
                          <Badge variant={results.connection.status === 200 ? "default" : "destructive"}>
                            {results.connection.status || 'N/A'}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Projeto:</span>
                          <span className="text-sm font-medium">{results.connection.config?.projectId || 'N/A'}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">URL:</span>
                          <span className="text-sm font-medium">{results.connection.config?.supabaseUrl || 'N/A'}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Ping:</span>
                          <span className="text-sm font-medium">
                            {results.connection.performance?.ping || 0}ms ({results.connection.performance?.status || 'N/A'})
                          </span>
                        </div>
                      </div>
                      
                      {results.connection.error && (
                        <div className="bg-red-50 p-3 rounded border border-red-200">
                          <div className="flex items-start">
                            <X className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                            <div>
                              <h4 className="text-sm font-medium text-red-800">Erro de conexão:</h4>
                              <p className="text-xs text-red-700 mt-1 break-words">
                                {results.connection.error}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab Configuração */}
                  <TabsContent value="config" className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                      <h3 className="text-sm font-medium mb-3 flex items-center">
                        <Key className="h-4 w-4 mr-2" />
                        Credenciais e Configuração
                      </h3>
                      
                      <UITable>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">URL do Projeto</TableCell>
                            <TableCell>{results.connection.config?.supabaseUrl}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Chave de API</TableCell>
                            <TableCell className="font-mono">{results.connection.config?.supabaseKey}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">ID do Projeto</TableCell>
                            <TableCell>{results.connection.config?.projectId}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Versão da API</TableCell>
                            <TableCell>v{results.connection.config?.apiVersion}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Versão do Cliente</TableCell>
                            <TableCell>@supabase/supabase-js v{results.connection.config?.clientVersion}</TableCell>
                          </TableRow>
                        </TableBody>
                      </UITable>
                    </div>
                    
                    <div className="p-3 rounded-md bg-amber-50 text-amber-800 text-sm border border-amber-200">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span>As credenciais são protegidas e não devem ser compartilhadas.</span>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab Banco de Dados */}
                  <TabsContent value="schema" className="space-y-4">
                    {results.schema && results.schema.schema && (
                      <div className="space-y-4">
                        {/* Informações do banco de dados */}
                        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                          <h3 className="text-sm font-medium mb-3 flex items-center">
                            <Database className="h-4 w-4 mr-2" />
                            Informações do Banco de Dados
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm mb-2"><strong>Versão:</strong> {results.schema.schema.database?.version || 'N/A'}</p>
                              <p className="text-sm mb-2"><strong>Permissões:</strong> {results.schema.schema.permissions}</p>
                              <p className="text-sm"><strong>Status Auth:</strong> {results.schema.schema.authentication.status}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm mb-2">
                                <strong>Storage:</strong> {results.schema.schema.storage?.available ? 'Disponível' : 'Não disponível'}
                                {results.schema.schema.storage?.available && ` (${results.schema.schema.storage.buckets} buckets)`}
                              </p>
                              <div className="text-sm">
                                <strong>Extensões:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {results.schema.schema.database?.extensions.map((ext, index) => (
                                    <Badge key={index} variant="outline">{ext}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Tabelas */}
                        <div>
                          <h3 className="text-sm font-medium mb-3 flex items-center">
                            <Table className="h-4 w-4 mr-2" />
                            Tabelas Acessíveis ({results.schema.schema.tables.length})
                          </h3>
                          
                          <div className="overflow-x-auto rounded-md border border-gray-200">
                            <UITable>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nome da Tabela</TableHead>
                                  <TableHead className="text-right">Registros</TableHead>
                                  <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {results.schema.schema.tables.map((table) => (
                                  <TableRow key={table.name}>
                                    <TableCell className="font-medium">{table.name}</TableCell>
                                    <TableCell className="text-right">{table.count || 0}</TableCell>
                                    <TableCell className="text-right">
                                      <Badge variant={table.accessible ? "default" : "destructive"} className="ml-auto">
                                        {table.accessible ? 'Acessível' : 'Inacessível'}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                                
                                {results.schema.schema.tables.length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-center text-sm text-gray-500 h-24">
                                      Nenhuma tabela acessível encontrada.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </UITable>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab Recursos */}
                  <TabsContent value="limits" className="space-y-4">
                    {results.connection.limits && (
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                          <h3 className="text-sm font-medium mb-3 flex items-center">
                            <Gauge className="h-4 w-4 mr-2" />
                            Limites do Plano
                          </h3>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <FileJson className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="text-sm">Limite de Linhas:</span>
                              </div>
                              <Badge variant="outline">{results.connection.limits.rowLimit}</Badge>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <HardDrive className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="text-sm">Armazenamento:</span>
                              </div>
                              <Badge variant="outline">{results.connection.limits.storageLimit}</Badge>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <RefreshCw className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="text-sm">Limite de Banda:</span>
                              </div>
                              <Badge variant="outline">{results.connection.limits.bandwidthLimit}</Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-md border border-blue-200">
                          <div className="flex items-center">
                            <Lock className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">Plano Atual:</span>
                          </div>
                          <Badge>{results.connection.limits.plan}</Badge>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default SupabaseTest; 