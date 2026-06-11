# Radar DF — Inteligência Territorial de Demandas Públicas

O **Radar DF** é uma plataforma corporativa de inteligência territorial desenvolvida para monitorar, organizar e analisar demandas das cidades/Regiões Administrativas (RAs) do Distrito Federal. O sistema centraliza relatos do cidadão, pautas de reuniões, atendimentos locais e encaminhamentos pendentes, oferecendo diagnósticos estratégicos e relatórios executivos para embasar decisões.

---

## 🛠️ Tecnologias Utilizadas

### Backend
*   **Python 3.11** com **FastAPI**
*   **SQLAlchemy 2.0** (ORM)
*   **Pydantic** (validação de payloads)
*   **JWT & Passlib (Bcrypt)** (autenticação segura e senhas criptografadas)
*   **Pandas & OpenPyXL** (engine de importação/validação de planilhas)
*   **ReportLab** (geração automática de dossiês em PDF)

### Frontend
*   **Next.js 14 (App Router)** com **React & TypeScript**
*   **Tailwind CSS** (design premium, responsivo e moderno)
*   **Recharts** (gráficos interativos e dashboards de KPI)
*   **Lucide React** (biblioteca de ícones consistentes)

### Infraestrutura
*   **PostgreSQL 15**
*   **Docker & Docker Compose**

---

## 🚀 Como Rodar Localmente (Desenvolvimento)

### Pré-requisitos
*   **Node.js v20+**
*   **Python 3.11**
*   **Docker** (caso queira rodar o banco no Docker)

---

### Passo 1: Configuração do Backend

1.  Navegue até a pasta do backend:
    ```bash
    cd backend
    ```
2.  Crie um ambiente virtual:
    ```bash
    python -m venv venv
    ```
3.  Ative o ambiente virtual:
    *   **Windows (PowerShell):** `.\venv\Scripts\Activate.ps1`
    *   **Mac/Linux:** `source venv/bin/activate`
4.  Instale as dependências:
    ```bash
    pip install -r requirements.txt
    ```
5.  Inicie o servidor de desenvolvimento local:
    ```bash
    python -m uvicorn app.main:app --reload
    ```
    *O backend estará rodando em [http://localhost:8000](http://localhost:8000). As tabelas SQLite (`radardf.db`) e os seeds iniciais de cidades/temas serão criados automaticamente na inicialização.*

---

### Passo 2: Configuração do Frontend

1.  Navegue até a pasta do frontend (em outro terminal):
    ```bash
    cd frontend
    ```
2.  Instale os pacotes npm:
    ```bash
    npm install
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
    *O frontend estará disponível em [http://localhost:3000](http://localhost:3000).*

---

## 🐳 Como Executar com Docker Compose (Homologação / Produção)

O Docker Compose orquestra o banco de dados PostgreSQL, a API FastAPI e a interface Next.js de forma integrada.

1.  Copie o arquivo de variáveis de ambiente para a raiz do projeto:
    ```bash
    cp .env.example .env
    ```
2.  Suba os contêineres:
    ```bash
    docker compose up --build -d
    ```
3.  O sistema estará disponível nos seguintes endereços:
    *   **Frontend (Next.js):** [http://localhost:3000](http://localhost:3000)
    *   **Backend API (FastAPI):** [http://localhost:8000](http://localhost:8000)
    *   **Documentação Interativa (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 👤 Credenciais de Acesso Inicial

O banco de dados é populado automaticamente na primeira execução com dados do usuário administrador:

*   **E-mail:** `admin@radardf.local`
*   **Senha:** `Admin@123456`

### 🔒 Regra de Segurança (Troca de Senha Obrigatória)
No primeiro login do administrador, a plataforma detecta o status `pending_password_change` e exibe uma tela obrigatória de **Troca de Senha**. O painel geral só será liberado após o preenchimento de uma nova senha pessoal segura (mínimo de 6 caracteres).

---

## 📊 Estrutura de Importação de Planilhas (CSV / Excel)

Para importar demandas em massa, acesse o módulo **Importação** no menu lateral. A planilha (.csv ou .xlsx) deve conter as seguintes colunas em letras minúsculas:

1.  `data` (opcional: DD/MM/AAAA)
2.  `cidade` (obrigatório: deve corresponder a uma RA cadastrada, ex: *Ceilândia*, *Taguatinga*)
3.  `bairro` (opcional)
4.  `tema` (obrigatório: deve corresponder a um tema cadastrado, ex: *Saúde*, *Infraestrutura*)
5.  `subtema` (opcional)
6.  `titulo` (obrigatório)
7.  `descricao` (obrigatório)
8.  `origem` (opcional)
9.  `prioridade` (opcional: *Baixa*, *Média*, *Alta*, *Urgente*, *Crítica*)
10. `status` (opcional: *Nova*, *Em análise*, *Encaminhada*, *Em andamento*, *Aguardando retorno*, *Respondida*, *Concluída*)
11. `responsavel` (opcional)
12. `observacao` (opcional)
13. `nome_solicitante` (opcional)
14. `contato` (opcional)

### Lógica de Pré-Validação
Ao arrastar a planilha, o sistema executa uma **Validação Linha a Linha** (sem gravar no banco):
*   Se a **cidade** ou **tema** não existir, a linha será marcada como inválida e o erro será apontado (ex: *Cidade "Taguaputinga" não cadastrada*).
*   Você poderá visualizar quais linhas estão corretas e quais contêm inconsistências.
*   Ao confirmar, apenas as **linhas válidas** são importadas. O histórico registra o upload e disponibiliza um **Relatório de Erros** para download (formato CSV) para que você possa corrigir as linhas problemáticas e reimportá-las.
