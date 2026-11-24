# Prompt de Execução do Roadmap (Copilot Chat)

Use este prompt para implementar o ERP de loja por prioridade de negócio, com foco em estabilidade, isolamento multi-tenant e consistência operacional.

## Papel
Você é um engenheiro full stack sênior responsável por implementar, validar e entregar um SaaS ERP multi-tenant usando NestJS + TypeORM + PostgreSQL (backend) e Next.js + React Query (frontend).

## Objetivo
Deixar o sistema funcional para operação real de loja, priorizando estoque, caixa e vendas, reduzindo risco de inconsistência e vazamento de dados entre tenants.

## Regras obrigatórias
1. Toda entidade, DTO, query e service deve respeitar tenantId.
2. Toda query deve filtrar por tenantId.
3. Nenhum endpoint pode retornar ou alterar dados de outro tenant.
4. Migrations devem acompanhar alterações de entidades.
5. Validação de payloads e autorização por perfil são obrigatórias.
6. Entregar sempre com evidência de teste (unitário ou integração/e2e) para regras críticas.

## Forma de trabalho
1. Implemente fase por fase, sem pular dependências.
2. Em cada fase, entregue:
	- código
	- migration (quando aplicável)
	- testes mínimos
	- resumo objetivo do que foi feito
3. Ao final de cada fase, valide critérios de pronto antes de avançar.

## Fase 1 - Base estável e confiável

### 1.1 Infraestrutura e ambiente
Objetivo: backend e banco confiáveis em dev e aptos para produção.

Implementar:
- validar backend com PostgreSQL em ambiente local
- garantir execução de migrations sem erro
- definir variáveis por ambiente (dev, homolog, prod)
- configurar seed com tenant inicial e usuário admin
- garantir scripts de setup e validação no projeto

Critério de pronto:
- aplicação sobe sem erro
- migrations executam do zero
- seed cria tenant e admin válidos
- configuração de ambiente está documentada e reproduzível

### 1.2 Multi-tenancy
Objetivo: isolamento total de dados por tenant.

Implementar:
- revisar módulos e confirmar tenantId em toda camada persistida
- aplicar filtros de tenantId em queries e services
- validar autenticação e autorização com escopo de tenant
- revisar endpoints com risco de vazamento cruzado

Critério de pronto:
- não existe leitura/escrita sem filtro por tenant
- testes confirmam isolamento entre dois tenants diferentes

### 1.3 Regressão mínima
Objetivo: baseline de confiabilidade para evolução.

Implementar testes para:
- login e autorização
- criação de produto
- alteração de estoque
- criação de venda
- abertura e fechamento de caixa
- consultas por tenant

Critério de pronto:
- suíte mínima verde em ambiente local e pipeline

## Fase 2 - Núcleo operacional da loja

### 2.1 Produtos
Implementar:
- cadastro completo de produtos
- SKU/código único por tenant
- categoria e marca
- custo, preço e margem
- estoque mínimo e máximo
- ativo/inativo
- imagem opcional

Critério de pronto:
- CRUD de produtos consistente e validado por tenant

### 2.2 Estoque
Implementar:
- entrada de mercadoria
- saída por venda
- ajuste manual
- devolução
- inventário físico
- histórico de movimentações
- bloqueio de venda por estoque insuficiente

Critério de pronto:
- toda movimentação de estoque é rastreável e auditável

### 2.3 Vendas e PDV
Implementar:
- carrinho
- quantidade por item
- subtotal, desconto e total
- múltiplas formas de pagamento
- cancelamento e devolução
- operador responsável
- vínculo com caixa
- baixa de estoque somente na conclusão

Critério de pronto:
- venda concluída gera baixa correta e vínculo com caixa/operador

### 2.4 Caixa e fechamento
Implementar:
- abertura com saldo inicial
- recebimentos por forma de pagamento
- sangria e suprimento
- fechamento com conferência esperado x real
- diferença de caixa
- fechamento por turno e por dia
- relatório de fechamento

Critério de pronto:
- fechamento diário reproduzível e divergências justificáveis

## Fase 3 - Financeiro e controle

### 3.1 Entradas e saídas
Implementar:
- lançamentos de receitas e despesas
- vínculo com venda e/ou caixa
- categoria financeira
- histórico por período

Critério de pronto:
- fluxo financeiro conciliável com vendas e caixa

### 3.2 Auditoria e consistência
Implementar:
- logs de alteração
- trilha para movimentações críticas
- regras de bloqueio em inconsistências
- política para reabertura de caixa, cancelamento e devolução

Critério de pronto:
- toda operação crítica possui rastro e regra de governança

## Fase 4 - Operações gerenciais

### 4.1 Dashboards
Implementar:
- vendas do dia
- caixa aberto/fechado
- estoque crítico
- produtos mais vendidos
- faturamento por período

### 4.2 Relatórios
Implementar:
- vendas por período
- vendas por vendedor
- vendas por forma de pagamento
- estoque movimentado
- produtos com baixa de estoque
- caixa e fechamento diário

### 4.3 Usuários e permissões
Implementar:
- perfis: admin, gerente, caixa, vendedor
- permissões por funcionalidade
- controle de acesso por tenant

Critério de pronto da fase:
- decisões operacionais e gerenciais suportadas por dados confiáveis

## Fase 5 - Produção e operação real

### 5.1 Qualidade e segurança
Implementar:
- testes unitários e integração para regras críticas
- cobertura mínima de fluxos sensíveis
- proteção de dados sensíveis
- validação de payload e autenticação robusta
- logs estruturados e monitoramento

### 5.2 Infra de produção
Implementar:
- PostgreSQL em produção
- backup automático
- HTTPS
- deploy automatizado
- gestão segura de variáveis
- CI/CD
- healthcheck e observabilidade

### 5.3 Operação e suporte
Implementar:
- procedimento de abertura/fechamento de caixa
- procedimento de inventário
- procedimento de devolução/cancelamento
- treinamento operacional
- política de manutenção

Critério de pronto da fase:
- ambiente estável, rastreável e suportável em operação contínua

## Ordem mandatória de execução
1. Infraestrutura e banco
2. Multi-tenancy e autenticação robusta
3. Produtos e estoque
4. PDV e vendas
5. Caixa e fechamento
6. Financeiro
7. Relatórios e dashboards
8. Testes finais e deploy de produção

## Critério global de aceite
Considerar pronto apenas quando:
- produto e estoque estiverem consistentes
- venda e caixa estiverem rastreáveis ponta a ponta
- não houver divergência de caixa sem justificativa
- operações críticas forem auditáveis
- dados estiverem isolados por tenant
- ambiente de produção estiver estável

## Primeiro ciclo (iniciar agora)
Execute imediatamente estes itens:
- [ ] validar setup local de backend + PostgreSQL
- [ ] rodar migrations em banco limpo
- [ ] executar seed com tenant e admin
- [ ] validar isolamento por tenant em auth e módulos críticos
- [ ] implementar/validar testes de regressão mínima da Fase 1

## Formato de resposta esperado do agente
Ao responder, use esta estrutura:
1. O que foi implementado
2. Arquivos alterados
3. Como validar
4. Riscos pendentes
5. Próximo passo recomendado
