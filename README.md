# Web Video Downloader

![Next.js](https://img.shields.io/badge/Next.js-15.2.3-black)
![React](https://img.shields.io/badge/React-19.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-cyan)

Uma aplicação web moderna para download de vídeos da internet, com interface de usuário elegante e feedback visual em tempo real. O projeto permite aos usuários baixar vídeos em diferentes formatos a partir de URLs, com progresso de download, sem redirecionar o usuário ou abrir novas janelas.

![Preview da aplicação](./preview.png)

## 🚀 Funcionalidades

- ✅ Interface de usuário moderna e responsiva
- ✅ Detecção automática de formatos de vídeo disponíveis
- ✅ Exibição de metadados (tamanho, formato, resolução)
- ✅ Barra de progresso de download em tempo real
- ✅ Download direto sem redirecionamento
- ✅ Design minimalista com animações sutis
- ✅ Suporta múltiplos sites de vídeo

## 🛠️ Tecnologias

- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **UI Components**: Shadcn UI
- **Animações**: Framer Motion
- **Ícones**: Lucide React
- **Build Tools**: Turbopack

## 📋 Pré-requisitos

- Node.js 18+ (recomendado 20+)
- pnpm (recomendado) ou npm

## 🔧 Instalação

1. Clone o repositório:

   ```bash
   via http
   git clone https://github.com/KaueASB/web-yt-download.git

   via ssh
   git clone git@github.com:KaueASB/web-yt-download.git

   cd web-video-download
   ```

2. Instale as dependências:

   ```bash
   pnpm install
   ```

3. Configure as variáveis de ambiente:

   ```bash
   cp env-example .env.local
   ```

   Edite o arquivo `.env.local` e defina:

   ```env
   NEXT_PUBLIC_API_URL="http://sua-api-url.com"
   ```

4. Inicie o servidor de desenvolvimento:

   ```bash
   pnpm dev
   ```

5. Acesse `http://localhost:3000` no seu navegador

## 🏗️ Estrutura do Projeto

Organização de arquivos e diretórios:

```plaintext
web-video-download/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes
│   │   │   ├── download/ # Iniciar download
│   │   │   ├── file/     # Servidor de arquivos
│   │   │   ├── formats/  # Formatos disponíveis
│   │   │   └── progress/ # Monitoramento de progresso
│   │   └── page.tsx      # Página principal
│   ├── components/       # Componentes reutilizáveis
│   ├── lib/              # Utilitários e configurações
│   └── services/         # Serviços de comunicação com API
├── .env.local            # Variáveis de ambiente locais
├── env-example           # Exemplo de variáveis de ambiente
└── package.json          # Dependências e scripts
```

## 🔄 Fluxo de Trabalho

1. O usuário insere a URL do vídeo na interface
2. A aplicação consulta a API para obter formatos disponíveis
3. O usuário seleciona o formato desejado e clica em "Download"
4. A aplicação inicia o processamento e exibe o progresso em tempo real
5. Quando concluído, o download do arquivo começa automaticamente

## 📝 API Endpoints

- `GET /api/formats?url=...` - Obtém formatos disponíveis para uma URL
- `GET /api/download?url=...&code=...` - Inicia o processo de download
- `GET /api/progress?url=...` - Monitora o progresso do download usando SSE
- `GET /api/file?url=...` - Baixa o arquivo final

## 🚀 Produção

Para construir o projeto para produção:

```bash
pnpm build
pnpm start
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, sinta-se à vontade para submeter um Pull Request.

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📧 Contato

Para qualquer dúvida ou sugestão, entre em contato através de [kaue_alves00@outlook.com](mailto:kaue_alves00@outlook.com).
