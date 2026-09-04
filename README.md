# Cine.Pass

Plataforma web para criação de sessões de cinema, gerenciamento de assentos e compra/validação de ingressos. O projeto foi desenvolvido como um MVP full stack, com áreas diferentes para clientes e organizadores.

## Índice

- [Visão geral](#visão-geral)
- [Demo](#demo)
- [Stack](#stack)
- [Funcionalidades implementadas](#funcionalidades-implementadas)
- [Pré-requisitos](#pré-requisitos)
- [Configuração](#configuração)
- [Executando com Docker Compose](#executando-com-docker-compose)
- [Usuários de demonstração](#usuários-de-demonstração)
- [Executando localmente](#executando-localmente)
- [Scripts do frontend](#scripts-do-frontend)
- [Rotas principais da API](#rotas-principais-da-api)
- [Fluxo de compra](#fluxo-de-compra)
- [Organização do projeto](#organização-do-projeto)
- [Boas práticas demonstradas](#boas-práticas-demonstradas)
- [Estado do MVP](#estado-do-mvp)
- [O que pretendo adicionar no futuro](#o-que-pretendo-adicionar-no-futuro)
- [Licença](#licença)

## Visão geral

O Cine.Pass permite que:

- clientes consultem sessões disponíveis;
- clientes escolham um ou mais assentos e confirmem a compra;
- clientes visualizem seus ingressos e QR Codes;
- organizadores consultem filmes em cartaz do TMDB;
- organizadores criem, editem e removam sessões;
- organizadores acompanhem seus eventos;
- organizadores validem ingressos por código manual;
- o sistema controle assentos disponíveis, reservados temporariamente e vendidos.

A compra não possui integração de pagamento neste MVP. Ao confirmar, o sistema reserva os assentos, cria os ingressos e informa o sucesso da operação.

## Demo

Ainda não há uma demo hospedada. O projeto pode ser executado localmente com Docker Compose seguindo as instruções abaixo.

## Stack

### Backend

- Python 3.12+
- FastAPI
- Uvicorn
- Pydantic
- MySQL 8
- aiomysql
- JWT com PyJWT
- bcrypt e Passlib para autenticação
- Integração com a API do TMDB

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Material UI
- CSS responsivo
- Oxlint

### Infraestrutura

- Docker
- Docker Compose
- Volumes persistentes para o MySQL
- Healthchecks para banco e API

## Funcionalidades implementadas

### Autenticação e autorização

- Cadastro de usuários como cliente ou organizador.
- Login com token JWT.
- Persistência do token no navegador.
- Verificação do usuário autenticado em `/auth/me`.
- Proteção de rotas privadas.
- Diferenciação de telas conforme o papel do usuário.
- Proteção de operações administrativas no backend.

### Cliente

- Catálogo de sessões publicadas.
- Busca por filme ou local.
- Banner com sessão em destaque.
- Visualização do grid de assentos.
- Seleção de múltiplos assentos.
- Reserva temporária dos assentos.
- Confirmação de compra sem pagamento simulado.
- Consulta dos próprios ingressos.
- QR Code individual para cada ingresso.
- Cópia do código do ingresso.

### Organizador

- Catálogo de filmes em cartaz e busca via TMDB.
- Criação de sessões a partir de filmes.
- Geração automática dos assentos conforme a capacidade.
- Listagem das sessões próprias.
- Busca de sessões.
- Edição de dados da sessão.
- Exclusão de sessões.
- Validação manual de ingressos.
- Interface preparada para futura leitura por câmera, atualmente desativada.

## Pré-requisitos

Para executar com Docker:

- Docker Desktop instalado e em execução;
- portas `3306`, `8000` e `5173` disponíveis.

Para executar sem Docker:

- Python 3.12 ou superior;
- Node.js 22 ou superior;
- MySQL 8;
- npm.

## Configuração

Copie o arquivo de exemplo para criar sua configuração local:

```powershell
Copy-Item .env.example .env
```

Edite o `.env` e configure, principalmente:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=devuser
DB_PASSWORD=devpassword
DB_NAME=cinema_db
TMDB_API_KEY=sua-chave-do-tmdb
JWT_SECRET_KEY=uma-chave-secreta-longa
VITE_API_URL=http://localhost:8000
```

Não versionar o arquivo `.env`. As chaves e senhas devem permanecer apenas no ambiente local ou no gerenciador de secrets da infraestrutura.

## Executando com Docker Compose

Na raiz do projeto, execute:

```powershell
docker compose up --build
```

Aguarde os healthchecks do MySQL e da API. Depois acesse:

- Frontend: <http://localhost:5173>
- API: <http://localhost:8000>
- Documentação Swagger: <http://localhost:8000/docs>
- Healthcheck da API: <http://localhost:8000/health>

Para executar em segundo plano:

```powershell
docker compose up --build -d
```

Para acompanhar os logs:

```powershell
docker compose logs -f
```

Para encerrar os containers:

```powershell
docker compose down
```

Para encerrar e apagar também os dados persistidos do banco:

```powershell
docker compose down -v
```

O último comando remove o volume do MySQL e deve ser usado apenas quando for desejado reiniciar o banco do zero.

## Usuários de demonstração

Depois de iniciar os serviços, crie usuários prontos para teste com:

```powershell
docker compose run --rm seed
```

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Cliente | `cliente.demo@cinepass.local` | `Cliente@123` |
| Organizador | `organizador.demo@cinepass.local` | `Organizador@123` |

O comando é idempotente: se os usuários já existirem, eles não serão duplicados.

## Executando localmente

### Banco de dados

Suba somente o MySQL pelo Compose:

```powershell
docker compose up -d mysql
```

### Backend

Crie e ative um ambiente virtual, se necessário:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Com o MySQL disponível e o `.env` configurado:

```powershell
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

Em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

Acesse <http://localhost:5173>.

## Scripts do frontend

Execute os comandos dentro de `frontend`:

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

- `dev`: inicia o servidor de desenvolvimento;
- `build`: executa o TypeScript e gera a versão de produção;
- `lint`: verifica padrões e possíveis problemas no código;
- `preview`: serve o build localmente.

## Rotas principais da API

### Autenticação

| Método | Rota | Finalidade |
| --- | --- | --- |
| POST | `/auth/register` | Cria uma conta |
| POST | `/auth/login` | Autentica o usuário |
| GET | `/auth/me` | Retorna o usuário autenticado |

### Eventos

| Método | Rota | Finalidade |
| --- | --- | --- |
| GET | `/events` | Lista eventos publicados |
| GET | `/events/organizer/{organizer_id}` | Lista eventos do organizador |
| GET | `/events/{event_id}` | Consulta um evento |
| POST | `/events` | Cria um evento |
| PUT | `/events/{event_id}` | Edita um evento |
| DELETE | `/events/{event_id}` | Remove um evento |

### Assentos e ingressos

| Método | Rota | Finalidade |
| --- | --- | --- |
| GET | `/events/{event_id}/seats` | Lista os assentos do evento |
| POST | `/seats/hold` | Reserva temporariamente um assento |
| POST | `/seats/release` | Libera uma reserva |
| POST | `/tickets/checkout` | Confirma a compra de um assento |
| GET | `/tickets/me` | Lista os ingressos do usuário |
| GET | `/tickets/{ticket_id}` | Consulta um ingresso |
| GET | `/tickets/share/{ticket_code}` | Consulta dados compartilháveis |
| POST | `/tickets/validate` | Valida um ingresso |

### TMDB

| Método | Rota | Finalidade |
| --- | --- | --- |
| GET | `/tmdb/now-playing` | Lista filmes em cartaz |
| GET | `/tmdb/search` | Pesquisa filmes |

A documentação interativa completa fica disponível em `/docs` quando a API estiver rodando.

## Fluxo de compra

1. O cliente abre uma sessão no catálogo.
2. O frontend consulta `/events/{event_id}/seats`.
3. O cliente seleciona um ou mais assentos disponíveis.
4. Cada assento é reservado via `/seats/hold`.
5. Cada reserva é confirmada via `/tickets/checkout`.
6. O assento muda para `SOLD` e um ingresso com QR Code é criado.
7. Em caso de falha, as reservas temporárias ainda não finalizadas são liberadas.

Os estados de assento são `AVAILABLE`, `HELD` e `SOLD`. Reservas temporárias expiram após o período configurado no backend.

## Organização do projeto

```text
.
├── backend/
│   ├── auth/                 # autenticação, autorização e repositório de usuários
│   ├── scr/
│   │   ├── routes/           # endpoints da API
│   │   ├── schemas/          # contratos de entrada e saída
│   │   ├── services/         # regras de negócio
│   │   ├── repository/       # acesso ao banco
│   │   └── models/           # modelos de domínio
│   ├── db.py
│   ├── main.py
│   ├── seed.py
│   ├── schemas.sql
│   └── Dockerfile
├── frontend/
│   ├── app/                  # roteamento
│   ├── contexts/             # estado de autenticação
│   ├── layouts/              # estrutura compartilhada da aplicação
│   ├── pages/                # telas de cliente, organizador e autenticação
│   ├── src/                  # entrada do React e estilos globais
│   └── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.example
├── LICENSE
├── requirements.txt
└── README.md
```

## Boas práticas demonstradas

Este MVP foi estruturado com práticas valorizadas em portfólios profissionais, especialmente para quem está começando na área:

- separação de responsabilidades entre rotas, serviços, repositórios e schemas;
- contratos tipados no frontend com TypeScript;
- validação de dados no backend com Pydantic;
- autenticação baseada em JWT;
- autorização por função, distinguindo cliente e organizador;
- proteção de operações sensíveis no servidor, sem confiar apenas no frontend;
- tratamento de estados de carregamento, erro e sucesso na interface;
- controle de concorrência básico para reserva de assentos com atualização condicional;
- persistência relacional com chaves estrangeiras e restrições de unicidade;
- integração com serviço externo usando uma camada de serviço própria;
- configuração por variáveis de ambiente;
- CORS configurado para os ambientes locais;
- interface responsiva e componentes reutilizáveis do Material UI;
- documentação automática da API com OpenAPI/Swagger;
- build e lint automatizados no frontend;
- ambiente reproduzível com Docker Compose;
- commits e alterações mantidos em escopo funcional, evitando misturar responsabilidades.

## Estado do MVP

O projeto está em fase de MVP funcional. O fluxo principal de autenticação, criação de sessões, assentos, compra e validação de ingressos está implementado.

## O que pretendo adicionar no futuro


## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).
