# Banco de dados IAgroTech

Este diretório contém a base relacional inicial do sistema.

- `schema.sql`: cria o banco `iagrotech`, tabelas, relações, validações, índices e campos `updated_at`.
- `seed.sql`: insere dados de desenvolvimento equivalentes às telas mockadas do front-end.
- `actions.sql`: cria procedures correspondentes aos botões de criação, edição, exclusão, perfil, planos e logout.

Ordem de execução:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
mysql -u root -p < database/actions.sql
```

O schema foi modelado para MySQL 8.0+ e cobre autenticação, registro de usuário, trial Free de 30 dias, planos Premium, pagamentos, sessões/logout, perfil, propriedades rurais, plantações, criações, estoque, financeiro, calendário, informações, alertas, assistente IA e configurações.

As operações do sistema devem ser chamadas com `CALL`, por exemplo:

```sql
CALL create_inventory_item('property-id', 'NPK 10-10-10', 'fertilizantes', 50, 'kg', 20, 'Galpão 1', NULL);
CALL update_user_subscription_plan('user-id', 'premium_monthly', 'pix');
```
