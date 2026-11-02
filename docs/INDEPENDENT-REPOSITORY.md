# Criar o repositório independente no GitHub

> Use uma pasta nova extraída deste pacote. Não execute estes comandos dentro do repositório do fork atual.

## 1. Antes de publicar

- Confirme com a equipe/organização do hackathon que a redistribuição da cópia é permitida.
- Preencha `CREDITOS.md` com o nome do evento, participantes e contribuições verificadas.
- Adicione a licença que foi realmente acordada. O pacote de origem não continha um arquivo `LICENSE`, então esta cópia não presume uma licença.

## 2. Criar o repositório vazio

Na conta GitHub do mantenedor, crie um repositório novo chamado `iagrotech-demo`. Não selecione opções para gerar README, `.gitignore` ou licença: estes arquivos já estão nesta pasta.

## 3. Inicializar e enviar a cópia

Abra o terminal na raiz desta pasta (aquela que contém `package.json`) e execute:

```bash
git init -b main
git add .
git commit -m "chore: prepare IAgroTech portfolio demo"
git remote add origin https://github.com/Samuel-fsb/iagrotech-demo.git
git push -u origin main
```

Este procedimento cria um histórico Git novo para a demonstração. Ele não altera nem envia commits ao fork nem ao repositório original do hackathon.

## 4. Importar na Vercel

- Importe `Samuel-fsb/iagrotech-demo`.
- Framework Preset: `Vite`.
- Root Directory: `.`.
- Build Command: `npm run build`.
- Output Directory: `dist`.
- Não cadastre `VITE_API_URL`; a demonstração não chama backend.

Depois do primeiro deploy, teste a raiz e as rotas internas em janela anônima e em outro dispositivo. Consulte `DEPLOY_VERCEL.md`.
