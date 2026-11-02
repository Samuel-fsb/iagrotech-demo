#  <h1 align="center"> **IAgroTech** </h1>

**Tecnologia para uma gestão rural mais simples e organizada.**

O IAgroTech é uma plataforma pensada para apoiar pequenos agricultores e produtores rurais na administração de suas propriedades. A proposta é reunir, em um só lugar, ferramentas para acompanhar a produção, organizar as finanças, controlar o estoque, planejar atividades e consultar informações úteis para o dia a dia no campo.

O projeto nasceu durante um hackathon, em uma equipe multidisciplinar de cinco participantes, com acompanhamento de um orientador. Esta cópia apresenta uma versão demonstrativa independente, preparada para portfólio: qualquer visitante pode explorar a aplicação sem criar uma conta ou depender de um backend hospedado.

> **Atenção — ambiente demonstrativo:** os dados são fictícios. Cadastros, edições e exclusões são simulados e ficam salvos somente no armazenamento local (`localStorage`) do navegador utilizado. Esta versão não possui autenticação real, banco de dados conectado, sincronização entre visitantes, pagamentos ou integração com um modelo de inteligência artificial. Não insira informações pessoais ou dados reais de uma propriedade.
> 

## Demonstração

- **Aplicação online:** https://iagrotech.vercel.app/dashboard
- **Acesso:** a aplicação abre diretamente no dashboard. Não é necessário realizar cadastro ou login.
- **Repositório de referência do projeto do hackathon:** dav1tsu/iagrotech.

## Funcionalidades

A demonstração permite explorar os principais módulos da proposta do IAgroTech:

- **Dashboard:** visão geral da propriedade, indicadores, alertas e próximas atividades.
- **Financeiro:** registro e gerenciamento demonstrativo de receitas e despesas.
- **Plantações:** visualização, cadastro, edição e remoção de plantações.
- **Criações:** gerenciamento demonstrativo de animais e criações.
- **Estoque:** controle de insumos e quantidades, com atualização dos status a partir dos limites cadastrados.
- **Calendário:** organização de atividades e compromissos da propriedade.
- **Informações:** consulta a conteúdos e artigos de exemplo.
- **Alertas:** visualização e gerenciamento de notificações demonstrativas.
- **Assistente:** respostas e recomendações previamente definidas para ilustrar a experiência; não há conexão com uma IA real.
- **Perfil e configurações:** consulta e edição local das informações fictícias da propriedade.

As alterações feitas nos módulos são refletidas nos dados compartilhados da demonstração quando aplicável. O controle Restaurar demo permite apagar as alterações daquele navegador e recuperar o conjunto inicial de exemplos.

## Tecnologias

### Frontend da demonstração

- React 19
- TypeScript
- Vite
- React Router
- Sass e CSS Modules
- Recharts para visualização de dados
- Axios permanece no projeto como cliente HTTP, mas as chamadas de rede são bloqueadas no modo demonstrativo.

### Arquitetura da versão original

A proposta full stack do hackathon também contempla backend em Node.js/Express e banco de dados PostgreSQL. Esses componentes e os scripts SQL originais foram preservados neste repositório como referência do trabalho inicial, mas **não são iniciados nem necessários para executar ou publicar esta demonstração**.

## Como executar localmente

### Pré-requisitos

- Node.js 20.19+ ou 22.12+;
- npm.

Na raiz do projeto, execute:

```bash
npm install
npm run dev
```

O Vite exibirá no terminal o endereço local para abrir a aplicação no navegador.

Para validar a versão de produção localmente:

```bash
npm run build
npm run preview
```

## Como funciona o modo demonstrativo

Os serviços simulados ficam em `src/services/demo/` e centralizam os dados utilizados pelos módulos. O estado é persistido no `localStorage` do navegador, sob a chave `iagrotech-demo-state-v1`.

Isso significa que:

- Cada navegador mantém sua própria cópia dos dados.
- Alterações não são compartilhadas com outros visitantes ou dispositivos.
- Limpar os dados do site ou usar outro navegador restaura a demonstração inicial.
- Não existe conta real, autenticação, autorização ou persistência em servidor.
- Não é necessário configurar Neon, Render, PostgreSQL ou qualquer outro serviço externo.

A implementação do modo demonstrativo está descrita em `docs/DEMO-MODE.md`.

## Equipe e contribuições

O IAgroTech foi desenvolvido colaborativamente durante um hackathon. A equipe de desenvolvimento teve cinco participantes, com acompanhamento de um orientador.

| Integrante | Responsabilidades e contribuições |
| --- | --- |
| **Samuel** | Desenvolvimento do frontend em parceria com Vinícius; participação no planejamento da arquitetura junto à equipe; implementação de páginas, funcionalidades e melhorias; apoio técnico aos colegas, esclarecimento de dúvidas e suporte a outras frentes conforme as necessidades do time. Também colaborou para manter as entregas dentro dos prazos reduzidos do hackathon. |
| **Vinícius** | Desenvolvimento do frontend em parceria com Samuel, colaborando na implementação das telas e funcionalidades da aplicação. |
| **Lucas** | Desenvolvimento do backend e integração com o frontend por meio das APIs, em parceria com Matheus. |
| **Matheus** | Desenvolvimento do backend e integração com o frontend por meio das APIs, em parceria com Lucas. |
| **Jéssica** | Criação do design da aplicação e definição da experiência visual das interfaces. |
| **Eleudson Queiroz** | Acompanhamento e orientação da equipe durante o desenvolvimento. Nome: a confirmar. |

O planejamento da arquitetura foi realizado em colaboração com a equipe. As responsabilidades acima destacam as principais frentes de atuação, sem desconsiderar a colaboração entre os integrantes.

> Antes de publicar, complete o nome do hackathon e o nome do orientador, e confirme com os participantes se a descrição das contribuições está correta.
> 

## Contexto desta cópia

Este repositório contém uma adaptação para demonstração e portfólio do projeto coletivo desenvolvido no hackathon. O objetivo é permitir que recrutadores e outras pessoas conheçam a proposta e naveguem pelos principais fluxos do frontend sem exigir infraestrutura ativa.

A versão demonstrativa não representa a aplicação full stack em produção e não reivindica autoria individual sobre o trabalho coletivo. Consulte `CREDITOS.md` para informações adicionais sobre créditos e autorização de publicação.

## Licença

Esse projeto é licenciado pelo [MIT Licence](https://opensource.org/license/MIT)
