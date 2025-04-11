# Guia de Deployment - Erio Gestão Financeira

Este documento contém instruções para hospedar a aplicação em diferentes ambientes.

## Pré-requisitos

- Node.js 18+ instalado
- NPM 9+ instalado
- Git instalado
- Acesso às credenciais do Supabase

## Build do Projeto

Para criar uma versão de produção da aplicação:

```bash
# Instalar dependências
npm install

# Fazer o build
npm run build:prod
```

Os arquivos gerados estarão na pasta `dist/`.

## Opções de Hospedagem

### 1. Vercel (Recomendado)

1. Crie uma conta na [Vercel](https://vercel.com)
2. Instale a CLI da Vercel: `npm i -g vercel`
3. Execute na raiz do projeto: `vercel`
4. Siga as instruções para conectar ao GitHub ou faça o deploy diretamente

A Vercel reconhecerá automaticamente a configuração do projeto através do arquivo `vercel.json`.

### 2. Netlify

1. Crie uma conta na [Netlify](https://netlify.com)
2. Arraste e solte a pasta `dist` para a interface de deploy do Netlify, ou
3. Conecte o repositório GitHub e configure:
   - Branch de build: `main`
   - Diretório de publicação: `dist`
   - Comando de build: `npm run build`

O arquivo `netlify.toml` já configura os redirecionamentos necessários.

### 3. Render

1. Crie uma conta no [Render](https://render.com)
2. Crie um novo Web Service
3. Conecte seu repositório GitHub
4. Configure:
   - Tipo: Static Site
   - Nome: erio-gestao-financeira
   - Branch: main
   - Comando de build: `npm run build`
   - Diretório de publicação: `dist`

O arquivo `render.yaml` contém as configurações para o Render.

### 4. Docker (Hospedagem Própria)

Para hospedar em um servidor próprio usando Docker:

```bash
# Construir a imagem
docker build -t erio-financas:latest .

# Executar o contêiner
docker run -d -p 80:80 --name erio-financas erio-financas:latest
```

Ou usando Docker Compose:

```bash
docker-compose up -d
```

### 5. Servidor Web Tradicional (Nginx, Apache)

1. Faça o build do projeto com `npm run build`
2. Copie o conteúdo da pasta `dist` para o diretório web do servidor
3. Configure o servidor para redirecionar todas as requisições para `index.html`

Exemplo de configuração para Nginx:
- Disponível no arquivo `nginx.conf` deste projeto

## Variáveis de Ambiente

Para cada plataforma, configure as seguintes variáveis de ambiente:

- `VITE_SUPABASE_URL`: URL do projeto Supabase
- `VITE_SUPABASE_KEY`: Chave anônima (pública) do Supabase

## Após o Deployment

1. Verifique se o site está acessível
2. Teste o login e funcionalidades principais
3. Verifique a conexão com o Supabase

## Solução de Problemas

Se encontrar erros 404 após navegar pelo site, verifique se os redirecionamentos estão configurados corretamente na plataforma de hospedagem. 