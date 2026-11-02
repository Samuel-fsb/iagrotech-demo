# Documento arquivado — plano original de publicação full stack

> Este documento registra o plano de publicação da versão full stack original (API + PostgreSQL). Ele foi preservado como referência histórica e **não se aplica a esta versão demonstrativa**, que funciona somente com frontend e dados locais.


> **Instrução principal para o Google Antigravity:** trabalhe diretamente no repositório do IAgroTech aberto neste workspace. Inspecione o código antes de modificar qualquer arquivo, implemente as mudanças necessárias, execute os testes possíveis e corrija os erros encontrados. **Não entregue apenas recomendações ou exemplos de código**: faça as alterações no projeto. Não declare uma etapa concluída sem evidências verificáveis. Quando depender de uma ação que só o proprietário pode fazer (por exemplo, entrar na Neon ou configurar uma variável secreta na Vercel/Render), prepare o restante, explique o bloqueio com passos exatos e retome a validação quando houver acesso.

## 1. Contexto e objetivo

O IAgroTech é um projeto full stack de hackathon para gestão de propriedades rurais. A aplicação usa React, TypeScript, Vite, React Router, Node.js, Express e PostgreSQL. O objetivo é colocá-la on-line e deixá-la funcional o suficiente para ser apresentada no portfólio e no currículo de um desenvolvedor full stack júnior.

### Problemas relatados

1. O endereço publicado na Vercel retorna uma página `404 NOT_FOUND` ao abrir diretamente `https://iagrotech.vercel.app/login`.
2. No ambiente local, o formulário de cadastro mostra uma mensagem genérica e o console apresenta `POST http://localhost:3000/api/auth/register 500 (Internal Server Error)`.
3. O frontend contém um endereço padrão de API apontando para `http://localhost:3000/api`, que não é acessível aos visitantes do site publicado.
4. A API usa tokens mantidos em um `Map` na memória do processo. Isso pode invalidar sessões quando a instância do servidor reinicia ou muda.
5. O projeto tem arquivos e configurações misturando vestígios de Create React App e Vite; inspecione e normalize a configuração real antes de publicar.
6. A conta da Neon já foi criada, mas, conforme a captura de tela, **a organização ainda não tem nenhum projeto PostgreSQL criado**. Portanto, ainda não existe uma connection string da Neon disponível.

### Resultado desejado

- Frontend acessível por URL pública e por rotas internas abertas diretamente, sem 404 indevido.
- API pública separada do frontend, conectada ao PostgreSQL gerenciado na Neon.
- Cadastro, login, logout e restauração de sessão funcionando de ponta a ponta.
- Páginas protegidas e dados operacionais usando a API e o banco, sem depender de dados simulados ocultos para fingir persistência.
- Instruções de publicação repetíveis e uma lista clara de testes executados e pendentes.
- Nenhum segredo, credencial ou acesso administrativo inseguro exposto no Git ou no frontend.

## 2. Arquitetura-alvo

Adote esta arquitetura, salvo se a inspeção do repositório demonstrar uma incompatibilidade técnica concreta. Se mudar a arquitetura, explique no relatório final o motivo e os impactos.

- **Frontend:** Vite + React + TypeScript publicado na Vercel, com saída de build estática.
- **API:** Node.js + Express publicado como Web Service separado, preferencialmente no Render, pois o backend atual é um servidor Express tradicional com vários endpoints.
- **Banco:** PostgreSQL gerenciado na Neon.
- **Fluxo:** navegador → frontend da Vercel → API HTTPS → PostgreSQL da Neon.

Não presuma que publicar o frontend na Vercel também publicará o servidor Express. Não migre tudo para funções serverless nem troque a stack só por conveniência; primeiro corrija a arquitetura existente com o menor conjunto de mudanças seguro.

## 3. Regras de execução obrigatórias

1. Primeiro, faça um inventário dos arquivos de configuração, scripts npm, entrada do frontend, rotas, serviços de API, autenticação, SQL e dependências. Confirme o estado real no workspace; não confie cegamente em documentação anterior.
2. Preserve o design, a linguagem visual e os fluxos já existentes. Não refaça a interface sem necessidade para corrigir os erros.
3. Não remova funcionalidades existentes para fazer o build passar. Corrija a causa e mantenha compatibilidade com os componentes e tipos atuais.
4. Não substitua erros reais da API por mocks, dados fixos ou sucesso simulado para fazer uma tela parecer funcional.
5. Não invente connection strings, nomes de projetos, tokens, domínios ou credenciais. Não peça que o usuário cole segredos no chat ou os grave em arquivos rastreados pelo Git.
6. Não imprima valores de segredo nos logs nem em screenshots. Use `.env` apenas localmente e variáveis de ambiente no painel dos provedores.
7. Antes de executar SQL em um banco remoto, inspecione o script, explique o efeito e garanta que o alvo é o banco de demonstração correto. Não apague dados existentes automaticamente.
8. Não execute `database/actions.sql` na Neon: esse arquivo é legado e contém sintaxe MySQL. A aplicação atual usa PostgreSQL.
9. Faça primeiro as correções e os testes locais que não exigem credenciais. Se a criação de projeto/segredos exigir intervenção humana, deixe a tarefa preparada e dê passos exatos para continuar; não diga que o deploy foi concluído sem verificar a URL real.
10. Mantenha as alterações focadas. Registre o que mudou, o que foi testado e o que depende de ações do proprietário.

## 4. Fase A — Diagnóstico e estabilização do build

### A1. Inspecionar configuração

Inspecione, pelo menos: `package.json`, os arquivos de configuração do Vite e TypeScript (crie os que estiverem ausentes), `src/main.tsx`, `src/App.tsx`, `src/routes/AppRoutes.tsx`, `src/services/api.ts`, `src/services/auth.service.ts`, `src/contexts/AuthContext.tsx`, `server/index.js`, `server/db.js`, `server/dev.js`, `database/setup.js`, `database/schema.sql`, `database/seed.sql` e `.gitignore`.

A cópia recebida pode não conter o `index.html` de entrada na raiz e/ou os arquivos de configuração necessários ao Vite/TypeScript. Verifique antes de agir. Não confunda `public/index.html` de Create React App com o `index.html` de entrada esperado pelo Vite.

### A2. Build do frontend

- Garanta que exista um `index.html` válido na raiz, apontando para a entrada correta da aplicação existente (`src/main.tsx`, caso permaneça como entrada).
- Garanta que `vite.config.ts` use o plugin React apropriado e que os arquivos `tsconfig` correspondam à stack instalada.
- Corrija os scripts `package.json` para que `npm run build` produza a aplicação em `dist/` de forma reproduzível.
- Revise o uso misto de `src/main.jsx`, `src/main.tsx`, `src/App.js` e `src/App.tsx`; identifique a entrada efetivamente usada e evite manter configurações contraditórias. Não apague arquivos só por parecerem antigos: confirme as referências antes.
- Gere ou atualize o lockfile correspondente ao gerenciador usado pelo projeto. Não misture npm, pnpm e yarn.
- Instale as dependências e execute o build. Corrija erros reais de TypeScript, imports, Sass ou bundling; não desative globalmente a checagem de tipos para esconder erros.

### A3. Corrigir acesso direto às rotas

- Configure a Vercel para servir a SPA pelas rotas do React Router, por meio de `vercel.json`/rewrite compatível com a configuração final.
- Confirme que `/`, `/login`, `/registrar`, `/sobre`, `/recuperar-senha` e rotas protegidas carregam a aplicação quando acessadas diretamente ou após atualizar a página. Rotas protegidas podem redirecionar para login; não devem retornar a página 404 da Vercel.
- Garanta que arquivos estáticos existentes continuem sendo servidos normalmente e que a regra SPA não cause loops nem capture indevidamente assets ou chamadas de API.

**Aceite da Fase A:** `npm run build` termina com código zero; existe saída `dist/`; as rotas da aplicação funcionam no preview local; nenhum segredo foi adicionado ao repositório.

## 5. Fase B — Configuração segura do PostgreSQL na Neon

### B1. Preparar a aplicação para a Neon

- Atualize o acesso ao banco para aceitar `DATABASE_URL` como opção principal em ambientes hospedados, mantendo as variáveis `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` apenas se ainda forem úteis ao desenvolvimento local.
- Configure o driver `pg` para usar a connection string da Neon com TLS/SSL de forma compatível com o ambiente e com a versão instalada. Não desative a verificação TLS como solução rápida.
- Torne a configuração de conexão explícita e segura. Se houver pool, mantenha limites razoáveis para um plano de demonstração e trate erro de conexão/encerramento corretamente.
- Garanta que a API encerre conexões de forma adequada no processo de shutdown, quando aplicável.
- Atualize `.env.example` com nomes de variáveis e valores de exemplo não secretos; nunca inclua senhas reais.

### B2. Ajustar o script de inicialização do banco

O script atual pode tentar conectar ao banco administrativo `postgres` e criar uma base com `CREATE DATABASE`. Esse fluxo não deve ser presumido compatível com a connection string de um banco já criado na Neon.

- Modifique `database/setup.js` para, quando `DATABASE_URL` existir, conectar diretamente à base indicada pela Neon e aplicar os arquivos PostgreSQL necessários sem tentar criar outro banco.
- Torne a inicialização segura e idempotente quando possível, sem apagar tabelas nem truncar dados.
- Separe a criação do schema dos dados iniciais, de modo que seja possível inicializar o banco e também rodar o frontend sem introduzir contas administrativas públicas.
- Inspecione as dependências do cadastro: os planos `Free` e `Premium` e quaisquer dados de referência necessários devem existir para que `POST /api/auth/register` não falhe.
- Revise `database/seed.sql`: ele contém contas de demonstração com papel administrativo e senha legada previsível. **Não carregue essas credenciais administrativas conhecidas no banco público.** Se forem necessários dados de exemplo para o dashboard, preserve apenas dados sintéticos não sensíveis e sem credenciais privilegiadas; separe os dados de referência essenciais (por exemplo, planos) dos usuários privilegiados e dados demonstrativos.
- Não execute `database/actions.sql`, pois é legado MySQL.
- Documente o comando exato de inicialização e deixe claro quando deve ser executado uma única vez. Não execute seed automaticamente a cada inicialização da API.

### B3. Passo manual da Neon

A conta Neon já existe, mas o screenshot mostra que ainda não há projetos. Quando o código estiver pronto:

1. Oriente o proprietário a clicar em **Create project** no painel da Neon.
2. Use PostgreSQL e escolha uma região próxima da região do serviço backend, quando disponível, para reduzir latência.
3. Crie o projeto e obtenha a connection string recomendada pela Neon para Node.js/`pg`; prefira a opção pooled quando for apropriada para o serviço de aplicação.
4. Cadastre a connection string no `.env` local e nos secrets do serviço backend. Nunca a exponha no frontend, em `VITE_*`, em logs, no README ou no Git.
5. Antes de rodar o setup, mostre ao proprietário qual schema e quais dados de referência serão aplicados. Execute-os apenas na base correta, se houver acesso/autorização.

**Aceite da Fase B:** a aplicação usa `DATABASE_URL`; o schema é aplicável em um banco novo da Neon; o cadastro encontra os planos necessários; não existem contas administrativas com senha pública previsível na base de demonstração; a configuração TLS não é enfraquecida.

## 6. Fase C — API em produção

### C1. API, porta e CORS

- Faça a API ouvir em `process.env.PORT` quando fornecida pelo provedor, com fallback local para a porta já usada pelo projeto. Garanta que o script de inicialização seja compatível com o provedor escolhido.
- Configure CORS para aceitar apenas os domínios reais configurados do frontend em produção e as origens locais necessárias ao desenvolvimento. Não permita todas as origens indiscriminadamente.
- Documente `CLIENT_URL` e, se necessário, uma lista de origens adicionais; valide o formato e não inclua barras ou espaços que quebrem a comparação de origem.
- Preserve os endpoints existentes. Verifique os handlers assíncronos e o middleware de erro, incluindo o endpoint de health check, para que erros de banco retornem respostas JSON apropriadas em vez de causar rejeições não tratadas.
- Crie/mantenha um endpoint `GET /api/health` que verifique a conectividade real com o PostgreSQL e retorne status HTTP coerente. Não responda `database: connected` se o banco não foi consultado com sucesso. Não exponha segredos, SQL nem detalhes internos no corpo público; registre detalhes técnicos apenas nos logs do servidor.

### C2. Cadastro e login

Investigue o `500` observado em `POST /api/auth/register`; não presuma que a causa seja apenas a ausência de banco remoto.

- Siga o fluxo completo do formulário até a API e depois até o PostgreSQL.
- Valide os campos obrigatórios no backend e normalize e-mail (por exemplo, remover espaços e comparar sem distinção entre maiúsculas/minúsculas, compatível com a estrutura atual) de forma consistente.
- Garanta que planos ativos necessários existam e que os nomes/valores enviados pelo frontend correspondam ao esperado pela API.
- Preserve as transações de cadastro: usuário, propriedade, assinatura, consentimento e demais registros relacionados devem ser criados atomicamente; em caso de erro, efetue rollback.
- Trate e-mail duplicado como `409 Conflict`, validações como `400` e falhas inesperadas como `500`, com mensagens seguras e úteis para o usuário. Não mostre stack trace, senhas, SQL ou connection string no navegador.
- Verifique se os erros retornados pela API são exibidos no formulário de forma compreensível; elimine a mensagem genérica quando houver uma mensagem segura específica.
- Teste plano Free primeiro. Não trate o cadastro Premium como pagamento real: o projeto não tem gateway de pagamento confirmado, então a cobrança precisa continuar explicitamente simulada/pendente, e a interface/documentação não pode prometer pagamento funcional.

### C3. Persistência de sessão

A implementação atual mantém os tokens em um `Map` de memória, apesar de existir a tabela `user_sessions` no schema. Corrija isso sem quebrar o contrato da API usado pelo frontend.

- Persista somente o hash do access token no PostgreSQL, nunca o token em texto puro.
- Use `user_sessions` para associar sessão e usuário, com data de expiração e revogação. Verifique colunas e índices do schema existente antes de alterar SQL.
- Ao cadastrar/logar, gere o token com entropia criptográfica, grave o hash e retorne o token bruto apenas ao cliente autenticado.
- Na autenticação, valide o hash contra a sessão ativa não expirada e confirme que o usuário ainda existe/está ativo.
- No logout e exclusão da conta, revogue/apague corretamente a sessão no banco. Preserve respostas e contratos esperados pelo frontend.
- Adicione testes para sessão válida, token inválido, sessão expirada e logout. Não dependa de uma instância única do backend.

### C4. Hardening mínimo

- Garanta que senhas novas sejam armazenadas usando o mecanismo de hash forte já adotado; não registre senhas ou tokens em logs.
- Revise validação de entrada, erros assíncronos e endpoints administrativos. Contas de papel `ADMIN` nunca podem ser criadas pelo cadastro público.
- Não habilite acesso administrativo por credenciais conhecidas em produção. Se houver dados antigos, não mude ou apague usuários reais sem autorização.
- Confirme que não há segredos ou arquivos `.env` rastreados pelo Git. Adicione ao `.gitignore` o que for necessário (`.env`, variantes locais, logs, build e dependências), mantendo `.env.example` versionável.

**Aceite da Fase C:** `/api/health` comprova o banco; cadastro Free, login, logout e autenticação sobrevivem a reinício/redeploy do backend; respostas de erro são adequadas; CORS permite o frontend publicado e bloqueia origens não autorizadas; nenhum token bruto é armazenado no banco.

## 7. Fase D — Frontend conectado à API publicada

- Remova o fallback de produção para `http://localhost:3000/api`. Em desenvolvimento, permita o proxy local; em produção, use `VITE_API_URL` definida no build ou um caminho relativo se a arquitetura final realmente o suportar.
- O valor `VITE_API_URL` é público e só deve conter o endereço HTTP(S) da API e seu prefixo público (`/api`); nunca coloque `DATABASE_URL`, senhas ou tokens permanentes em variáveis `VITE_*`.
- Configure o Vite para encaminhar `/api` ao servidor local no modo de desenvolvimento, caso esse seja o modo escolhido, sem interferir no deploy.
- Revise o tratamento de rede: API indisponível precisa mostrar uma mensagem amigável, sem exibir stack trace nem entrar em loops de redirecionamento.
- Verifique se o estado de autenticação é restaurado por meio de uma chamada real de perfil/sessão e se um token inválido expira a sessão corretamente.
- Confirme que o dashboard e módulos principais não anunciam persistência quando os dados vêm apenas de mocks. Para cada módulo (financeiro, plantações, criações, estoque, calendário, alertas, perfil e configurações), verifique se as operações usadas na interface chegam a endpoints reais e salvam no banco. Se algum fluxo for deliberadamente demonstrativo/incompleto, identifique-o claramente no relatório e na interface quando necessário; não crie falsas confirmações de salvamento.

### Configuração da Vercel

- Configure o projeto com o root directory correto, usando a pasta que contém `package.json` e o `index.html` de entrada.
- Use o framework/build compatível com Vite, `npm run build` como build command e `dist` como output directory, ajustando ao que for de fato validado.
- Configure `VITE_API_URL` com o endereço público real da API e faça redeploy após alterar essa variável.
- Configure o fallback SPA para as rotas do React Router sem interferir nos assets.

**Aceite da Fase D:** o frontend público não tenta chamar `localhost`; cadastro/login e páginas carregam no domínio final; nenhum caminho protegido depende de mocks como substituto silencioso para a API.

## 8. Fase E — Publicação dos serviços

### Backend (por exemplo, Render)

- Conecte o repositório ao serviço Node.js.
- Configure build/start commands com base nos scripts existentes e validados. Para um backend Node simples, use instalação de dependências no build e o script específico da API no start; não use o comando que inicia o Vite como servidor do backend.
- Configure nos secrets do backend `DATABASE_URL`, `NODE_ENV=production`, a URL do frontend (`CLIENT_URL`) e outras variáveis realmente necessárias. Não invente valores de domínio; use o domínio que o provedor atribuir.
- Garanta que a API respeite a porta fornecida pelo provedor e que o health check esteja configurado, se o provedor oferecer esse recurso.

### Frontend (Vercel)

- Importe o repositório certo e confirme que a raiz do projeto está correta.
- Configure build e output directory.
- Cadastre `VITE_API_URL` com a URL real do backend, sem aspas e terminando em `/api` se o código espera esse prefixo.
- Faça deploy e abra cada rota em uma aba nova para testar os rewrites.

### Ordem obrigatória

1. Corrigir e validar build local.
2. Criar projeto/banco Neon e inicializar o schema/dados seguros.
3. Publicar API e verificar `GET /api/health`.
4. Publicar frontend com a URL verdadeira da API.
5. Atualizar CORS no backend com o domínio definitivo da Vercel e reiniciar/republicar o backend se necessário.
6. Executar a suíte ponta a ponta no domínio público.

Não publique o frontend antes de saber o endereço real da API, a menos que use temporariamente uma configuração local de build sem apresentá-la como concluída.

## 9. Fase F — Testes e evidências

Crie ou atualize testes automatizados para as regras críticas, usando as ferramentas já instaladas quando possível. Não adicione uma grande estrutura de testes se uma abordagem menor e compatível cumprir o objetivo.

### Testes mínimos

1. `npm install` termina sem erro e o lockfile fica consistente.
2. `npm run build` termina com código zero.
3. `npm run lint`, se configurado, é executado e os erros relevantes são corrigidos ou documentados.
4. `GET /api/health` retorna sucesso somente quando o banco responde; teste também o cenário de banco desconectado.
5. `GET /api/plans` retorna os planos esperados.
6. Cadastro Free com e-mail novo retorna `201`, cria usuário, propriedade, assinatura e consentimento e entrega um token válido.
7. Cadastro com e-mail duplicado retorna `409`, sem criar registros parciais.
8. Dados inválidos retornam `400` e são explicados no formulário.
9. Login correto funciona; senha incorreta retorna `401`.
10. Perfil e endpoint protegido só funcionam com sessão válida.
11. Atualizar o navegador, abrir `/dashboard` diretamente e reiniciar/redeployar o backend não deve destruir uma sessão ainda válida.
12. Logout invalida a sessão e a próxima chamada protegida retorna `401`.
13. Abertura direta e refresh de `/login`, `/registrar`, `/sobre`, `/dashboard` e outras rotas não retornam 404 da Vercel; rotas protegidas redirecionam de acordo com a autenticação.
14. O frontend publicado chama a API pública correta, e não `localhost`.
15. Verifique no Network do navegador que não há erros CORS, chamadas a endpoints errados ou respostas `500` não tratadas.
16. Faça um ciclo de teste nos fluxos principais do dashboard. Para módulos que dependam de mocks ou integrações inexistentes, documente a limitação e não afirme que estão ponta a ponta.

### Relatório de conclusão

Ao final, produza/atualize `DEPLOY_VERCEL.md` e um relatório de execução contendo:

- arquivos alterados e motivo de cada mudança;
- comandos executados e seus resultados reais;
- testes que passaram e falharam;
- URLs exatas verificadas (somente se realmente acessíveis);
- variáveis exigidas por serviço, sem valores secretos;
- passos manuais ainda pendentes no painel Neon, Render ou Vercel;
- limitações que restam e recomendações antes de divulgar no currículo.

Não declare “deploy concluído” se não acessou a URL pública e não verificou o fluxo real. Se faltarem as credenciais/serviços, declare o código preparado e especifique exatamente o que continua bloqueado.

## 10. Critérios de aceite finais

O trabalho só pode ser considerado concluído quando todos os itens abaixo estiverem verificados ou explicitamente marcados como bloqueados por ação externa:

- [ ] Projeto compila em modo de produção.
- [ ] Rotas SPA não retornam 404 indevido.
- [ ] Banco PostgreSQL da Neon está conectado com TLS e secrets protegidos.
- [ ] Schema e dados de referência necessários estão inicializados sem contas administrativas padrão inseguras.
- [ ] API pública está ativa e health check valida o banco real.
- [ ] Cadastro Free salva dados reais e login/logout funcionam.
- [ ] Sessões persistem no PostgreSQL e respeitam expiração/revogação.
- [ ] Frontend usa a API pública, sem endpoint local embutido no build publicado.
- [ ] CORS e variáveis de ambiente estão corretos.
- [ ] Páginas principais foram testadas e funcionalidades simuladas foram identificadas honestamente.
- [ ] README/guia de deploy explica como reproduzir a configuração.
- [ ] Nenhuma senha de demonstração administrativa, connection string ou segredo foi exposto.

## 11. Fora de escopo e decisões explícitas

- Não implementar cobranças reais sem escolher e configurar um gateway de pagamento. Premium deve ser descrito como pendente/simulado até isso existir.
- Não redesenhar a aplicação inteira; a prioridade é confiabilidade, deploy, autenticação e persistência.
- Não migrar para Supabase por padrão. A Neon já foi escolhida pelo proprietário; use PostgreSQL da Neon a menos que uma incompatibilidade demonstrada impeça o uso.
- Não inventar usuários, credenciais ou resultado de testes.
- Não realizar exclusão destrutiva de dados sem autorização explícita.

**Prioridade máxima:** tornar confiáveis os caminhos `frontend → API → PostgreSQL`, começando por build e rotas, depois conexão Neon, cadastro/login/sessão e, por último, validação pública. A aplicação só estará pronta para o portfólio quando a demonstração refletir o comportamento real do sistema.
