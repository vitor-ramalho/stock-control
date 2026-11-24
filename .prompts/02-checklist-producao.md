# 2) Checklist de produção para loja

## Objetivo
Validar tudo o que precisa existir para operar uma loja com segurança, controle e previsibilidade antes de colocar o sistema em produção.

## 1. Base técnica e segurança
- [ ] Banco PostgreSQL configurado e funcionando
- [ ] Migrations executadas corretamente
- [ ] Seed inicial funcionando
- [ ] Ambiente de desenvolvimento e produção separados
- [ ] Variáveis sensíveis protegidas
- [ ] HTTPS ativo
- [ ] CORS e autenticação funcionando
- [ ] JWT e refresh tokens funcionando corretamente
- [ ] TenantId validado em todas as requisições
- [ ] Usuários e permissões isolados por tenant

## 2. Gestão de produtos
- [ ] Cadastro de produto com campos mínimos
- [ ] SKU/código único
- [ ] Categoria vinculada
- [ ] Custo e preço de venda definidos
- [ ] Estoque inicial cadastrado
- [ ] Estoque mínimo e máximo configurados
- [ ] Produto pode ser ativado e inativado
- [ ] Produto com histórico de alteração

## 3. Gestão de estoque
- [ ] Entrada de mercadoria registrada
- [ ] Saída por venda registrada
- [ ] Ajuste manual de estoque disponível
- [ ] Devolução com reversão correta
- [ ] Inventário físico possível
- [ ] Estoque atual calculado corretamente
- [ ] Venda bloqueada quando estoque for insuficiente
- [ ] Motivo da movimentação registrado
- [ ] Histórico de movimentação visível

## 4. Fluxo de venda / PDV
- [ ] Carrinho de compra funcionando
- [ ] Quantidade por item validada
- [ ] Cálculo de subtotal correto
- [ ] Desconto aplicado corretamente
- [ ] Total final calculado corretamente
- [ ] Pagamento por múltiplas formas funcionando
- [ ] Cancelamento de venda permitido conforme regra
- [ ] Devolução registrada corretamente
- [ ] Estoque atualizado somente no momento correto
- [ ] Operador e horário registrados

## 5. Caixa e financeiro
- [ ] Abertura de caixa com valor inicial
- [ ] Caixa relacionado ao operador e turno
- [ ] Recebimentos registrados por pagamento
- [ ] Suprimento e sangria configurados
- [ ] Fechamento de caixa com conferência de valores
- [ ] Diferença de caixa visível e explicada
- [ ] Fechamento somente com consistência válida
- [ ] Histórico de movimentações de caixa completo
- [ ] Relatório de fechamento diário gerado

## 6. Financeiro geral
- [ ] Lançamento de entrada financeira
- [ ] Lançamento de despesa financeira
- [ ] Categorias financeiras definidas
- [ ] Vínculo com caixa ou venda
- [ ] Relatório financeiro por período
- [ ] Ajustes e anotações registradas

## 7. Relatórios e dashboards
- [ ] Dashboard de vendas diário
- [ ] Dashboard de caixa
- [ ] Dashboard de estoque crítico
- [ ] Faturamento por período
- [ ] Produtos mais vendidos
- [ ] Vendas por vendedor
- [ ] Vendas por forma de pagamento
- [ ] Movimento de estoque por produto

## 8. Permissões e operação
- [ ] Perfis definidos: admin, gerente, caixa, vendedor
- [ ] Permissões por módulo e ação
- [ ] Usuário bloqueado sem acesso certo
- [ ] Fluxos específicos por cargo
- [ ] Operações sensíveis com auditoria

## 9. Qualidade e confiabilidade
- [ ] Testes unitários de regras críticas
- [ ] Testes de integração de módulos principais
- [ ] Redução de estoque testada
- [ ] Venda sem estoque bloqueada
- [ ] Fechamento de caixa com diferença validado
- [ ] Casos de cancelamento e devolução testados
- [ ] Logs e rastreio de eventos implementados
- [ ] Monitoramento e alertas configurados

## 10. Produção e suporte
- [ ] Backup automático configurado
- [ ] Restore testado
- [ ] Deploy automatizado
- [ ] Healthcheck e logs com observabilidade
- [ ] Procedimento de abertura e fechamento de caixa documentado
- [ ] Procedimento de inventário documentado
- [ ] Procedimento de devolução e cancelamento documentado
- [ ] Treinamento de usuários concluído
- [ ] Support de incidentes definido

## Regra de aprovação para produção
O sistema pode ir para produção quando todos os itens críticos estiverem verdes:
- estoque consistente
- venda sem quebra
- caixa confiável
- financeiro audível
- tenant e permissões corretos
- monitoramento e backup ativos

## Resumo operacional
Se a loja não consegue responder corretamente a estas perguntas, o sistema ainda não está pronto:
- Quantos itens existem no estoque?
- Qual foi a última movimentação de cada produto?
- Qual o valor em caixa hoje?
- Houve divergência no fechamento?
- Quem realizou cada operação?
- O que pertence a cada tenant/loja?

Quando essas respostas forem confiáveis, a operação da loja estará segura.
