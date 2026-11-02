# Publicação da demonstração na Vercel

Esta versão do IAgroTech é uma aplicação frontend Vite/React com dados simulados no navegador. Não precisa publicar o backend, configurar PostgreSQL/Neon, configurar Render nem cadastrar `VITE_API_URL`.

## Configurações do projeto

| Campo | Valor |
|---|---|
| Framework Preset | Vite |
| Root Directory | `.` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

Não habilite uma variável `VITE_API_URL` apontando para uma API nesta versão demonstrativa.

## Rotas SPA

O `vercel.json` encaminha as rotas do frontend para `/index.html`, permitindo abrir diretamente `/dashboard`, `/financeiro`, `/plantacoes` e as demais rotas.

## Checklist de validação após o deploy

- Abrir o domínio em janela anônima.
- Abrir diretamente `/dashboard`, `/financeiro`, `/plantacoes`, `/criacoes`, `/estoque` e `/calendario`.
- Cadastrar e editar um registro de exemplo.
- Atualizar a página e confirmar que a alteração permaneceu no mesmo navegador.
- Restaurar a demonstração e confirmar que os dados iniciais retornaram.
- Abrir DevTools → Network e confirmar que a navegação não dispara requisições para `/api` nem para serviços externos.

## Observação

A demonstração não oferece autenticação, autorização, sincronização, pagamentos ou persistência de servidor. O `localStorage` é apenas um recurso de demonstração por navegador e não deve receber dados reais.
