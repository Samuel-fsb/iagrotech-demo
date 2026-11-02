# Modo de demonstração do IAgroTech

## Objetivo

Permitir que recrutadores explorem os principais fluxos do frontend sem cadastro, API hospedada ou banco de dados.

## Acesso

- A rota raiz redireciona ao dashboard.
- Rotas de login, cadastro e recuperação de senha redirecionam ao dashboard.
- As páginas administrativas não estão disponíveis nesta demonstração.

## Serviços locais

`src/services/demo/demo.store.ts` centraliza os dados iniciais, o acesso ao `localStorage`, as operações de leitura/gravação/remoção, os indicadores do dashboard e as recomendações de exemplo. Os serviços existentes (`dashboard.service.ts` e `operations.service.ts`) usam esse repositório quando `DEMO_MODE` está ativo.

## Coleções simuladas

- receitas e despesas;
- plantações e criações;
- estoque;
- calendário;
- artigos de informação;
- alertas;
- perfil e configurações da propriedade.

## Persistência e restauração

As alterações ficam no `localStorage` do navegador sob a chave `iagrotech-demo-state-v1`. Não há sincronização entre dispositivos ou visitantes. O aviso permanente na aplicação possui o controle **Restaurar demo**, que apaga as alterações daquele navegador e recria os dados iniciais.

## Limites deliberados

- Não há autenticação ou autorização real.
- Não são criadas contas; o perfil é fictício.
- Não há assinatura, pagamento nem integração com gateway.
- O assistente apresenta recomendações pré-definidas e não usa modelo de IA.
- Não usar dados pessoais, credenciais ou informações reais da propriedade.
- A demonstração não deve ser utilizada para decisões agrícolas, financeiras ou veterinárias.

## Segurança de chamadas de rede

O cliente Axios rejeita requisições no build demonstrativo. Os serviços que alimentam as telas retornam dados locais quando `DEMO_MODE` está ativo. As rotas administrativas ficam redirecionadas.

## Evolução

Para voltar a uma versão conectada ao backend, será necessário criar uma build separada, desativar o modo demonstrativo com uma estratégia explícita de ambiente, revisar autorização e autenticação, configurar uma API pública, CORS, banco de dados, segredos e testes ponta a ponta. Não basta apenas mudar `DEMO_MODE` para `false`.
