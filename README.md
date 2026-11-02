# IAgroTech — demonstração

Versão demonstrativa do IAgroTech, plataforma concebida para apoiar pequenos agricultores e produtores rurais na gestão da propriedade, produção, finanças, estoque e calendário agrícola.

O projeto original foi desenvolvido de forma colaborativa durante um hackathon. Este repositório independente prepara uma versão pública de portfólio, com acesso automático e dados fictícios, para que visitantes possam explorar os principais fluxos sem criar uma conta.

> **Ambiente demonstrativo:** os registros exibidos são fictícios. As alterações feitas pelo visitante ficam salvas somente no `localStorage` do navegador utilizado. Não há autenticação real, sincronização entre visitantes, pagamentos, banco de dados ou integração com uma IA nesta versão.

## Demonstração

A aplicação abre diretamente no dashboard. Não é necessário criar conta nem informar credenciais.

## Funcionalidades demonstráveis

- Dashboard com indicadores financeiros, produção, estoque, alertas e próximas atividades.
- Gestão local de receitas e despesas.
- Cadastro, edição e remoção de plantações e criações.
- Controle local de estoque com cálculo de status a partir do estoque mínimo.
- Calendário com criação, edição e remoção de atividades.
- Central de informações com artigos fictícios de exemplo.
- Alertas e configurações salvos no navegador.
- Assistente com recomendações pré-definidas, sem chamada a um modelo de IA.
- Exportação dos dados demonstrativos do perfil.
- Restauração dos dados iniciais a qualquer momento.

## Tecnologias

- React 19
- TypeScript
- Vite
- React Router
- Recharts
- Sass Modules

O código do backend Node.js/Express e os scripts SQL originais permanecem no repositório como referência da arquitetura planejada para o projeto do hackathon. Eles não são iniciados, não fazem parte das dependências desta build de frontend e não são necessários para executar a versão demonstrativa.

## Executar localmente

Requisitos: Node.js 20.19+ ou 22.12+ e npm (Vite 8).

```bash
npm install
npm run dev
```

Para gerar o build de produção:

```bash
npm run build
npm run preview
```

## Publicar na Vercel

1. Importe este repositório independente na Vercel.
2. Selecione o preset **Vite**.
3. Configure o Root Directory como `.` (raiz do repositório).
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Não é necessária variável de ambiente para API nesta versão.

O arquivo `vercel.json` contém o rewrite para que rotas internas do React Router também funcionem quando abertas diretamente.

Consulte [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) para os detalhes e [docs/DEMO-MODE.md](./docs/DEMO-MODE.md) para a arquitetura e as limitações do modo demonstrativo. O plano antigo de implantação full stack foi preservado em `docs/PRD-ORIGINAL-FULLSTACK-ARCHIVED.md` apenas como referência histórica.

## Dados e privacidade

Os dados iniciais são exemplos fictícios versionados no frontend. Modificações persistem apenas no armazenamento local do navegador. Limpar os dados do site ou utilizar outro navegador/dispositivo restaura uma demonstração independente. Não insira dados pessoais, senhas ou informações reais.

O cliente HTTP possui uma proteção adicional que bloqueia chamadas de rede no modo demonstrativo. A aplicação não deve depender de API externa para as funcionalidades cobertas por esta versão.

## Contexto e créditos

Esta versão deriva do projeto colaborativo IAgroTech desenvolvido durante um hackathon. O objetivo deste repositório é apresentar uma demonstração navegável, e não reivindicar autoria individual sobre o trabalho coletivo.

- Repositório de referência do projeto original: [dav1tsu/iagrotech](https://github.com/dav1tsu/iagrotech)
- Equipe, evento e contribuições: consulte [CREDITOS.md](./CREDITOS.md) e preencha os dados confirmados com os participantes.

**Licença e autorização:** o ZIP recebido não continha um arquivo `LICENSE`, embora o `package.json` de origem declarasse `ISC`. Esse campo isolado não substitui a confirmação dos direitos de redistribuição. Antes de tornar esta cópia pública, confirme com a equipe/organização do hackathon que a redistribuição do código e dos materiais está permitida e registre a licença acordada. Nenhuma licença nova foi presumida ou adicionada.
