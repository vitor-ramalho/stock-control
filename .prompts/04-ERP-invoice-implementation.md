# Implementação do Módulo Fiscal — ERP/PDV SaaS para Minas Gerais

Atue como um engenheiro de software sênior especializado em NestJS, TypeScript, PostgreSQL, TypeORM, arquitetura de domínio, documentos fiscais eletrônicos brasileiros e integração com a SEFAZ.

Implemente o módulo fiscal de um ERP/PDV SaaS multi-tenant, começando por NFC-e modelo 65 e NF-e modelo 55 para estabelecimentos de Minas Gerais.

O sistema já possui ou está desenvolvendo um módulo de empresas e estabelecimentos com configuração fiscal. O módulo fiscal deve consumir essa configuração, sem duplicar dados cadastrais nem armazenar cópias divergentes de certificados, CSC ou regime tributário.

## 1. Inspecione o projeto antes de implementar

Antes de escrever código:

1. Inspecione a estrutura real do monorepo e as convenções do NestJS.
2. Localize os módulos de empresas, estabelecimentos, produtos, estoque, vendas, pagamentos, usuários, autenticação e autorização.
3. Identifique as entidades TypeORM e migrations existentes.
4. Verifique o padrão atual de transações, eventos, jobs, filas e logs.
5. Identifique como o tenant é determinado e validado em requisições e processos assíncronos.
6. Verifique a existência de bibliotecas XML, assinatura digital, geração de DANFE, comunicação SOAP e armazenamento de arquivos.
7. Confirme as versões vigentes de schemas, Notas Técnicas, endpoints e regras fiscais oficiais antes de implementar os adaptadores.

Não presuma caminhos, nomes de entidades, propriedades ou bibliotecas. Não reescreva módulos existentes sem necessidade. Apresente um plano de implementação baseado no código encontrado e prossiga com o desenvolvimento.

## 2. Arquitetura

Implemente o módulo fiscal como parte do monólito modular do NestJS, com fronteiras claras entre:

- Domínio fiscal.
- Casos de uso.
- Persistência.
- Integração com serviços fiscais.
- Assinatura e validação de XML.
- Geração e armazenamento de documentos auxiliares.
- Processamento assíncrono.
- API e autorização.

Utilize interfaces para os serviços externos, por exemplo:

- `FiscalAuthorizationPort`
- `FiscalCertificateProvider`
- `FiscalDocumentStorage`
- `FiscalXmlSigner`
- `FiscalXmlValidator`

Os nomes podem ser adaptados às convenções existentes.

Não acople as regras de negócio diretamente a SOAP, HTTP, XML ou a uma biblioteca específica. O domínio deve poder testar os casos de uso sem conexão com a SEFAZ.

Comece com um backend modular e um worker fiscal. Não crie microserviços independentes ou dependências de infraestrutura sem necessidade demonstrada.

## 3. Escopo inicial

Implemente suporte arquitetural para:

- NF-e modelo 55.
- NFC-e modelo 65.
- Ambientes de homologação e produção.
- Consulta de situação e protocolo.
- Autorização e rejeição.
- Cancelamento e inutilização, conforme as regras aplicáveis.
- Contingência específica por modelo e ambiente.
- Persistência de XML, protocolos, eventos e histórico.
- Geração do DANFE ou DANFE NFC-e correspondente.
- Monitoramento e reprocessamento seguro.

Não presuma que todo tipo de venda pode usar NFC-e. A seleção do modelo deve considerar a natureza da operação, o estabelecimento, o destinatário e as regras legais aplicáveis.

Implemente primeiro NFC-e em homologação, mas mantenha o domínio preparado para NF-e. Não declare o módulo pronto para produção enquanto a implementação fiscal, os testes e os requisitos legais ainda estiverem pendentes.

## 4. Modelo de domínio e persistência

Crie ou adapte entidades para representar:

- Documento fiscal.
- Itens do documento fiscal.
- Evento fiscal.
- Tentativa de transmissão.
- Controle de numeração por estabelecimento, modelo, série e ambiente.
- Registro de processamento pendente.
- Versão do schema e das regras utilizadas.
- Histórico de mudanças de estado.

Cada documento deve referenciar tenant, estabelecimento e, quando aplicável, a venda de origem.

Armazene, conforme necessário:

- Modelo, série e número.
- Ambiente.
- Chave de acesso.
- Estado atual.
- Valores e dados tributários congelados no momento da emissão.
- XML gerado, assinado e autorizado.
- Protocolo de autorização ou evento.
- Código e motivo de rejeição.
- Datas de criação, transmissão, resposta e autorização.
- Identificação da versão técnica utilizada.
- Modo de emissão e dados de contingência, quando aplicável.

Não altere os dados originais de documentos assinados ou autorizados. Preserve o XML original e o histórico de eventos.

Use migrations TypeORM e `synchronize: false` em produção.

### Controle de numeração

Implemente reserva de numeração de forma transacional, com bloqueio adequado da linha de controle e restrições únicas no banco.

Não use `MAX(number) + 1`.

A numeração deve ser isolada conforme a combinação exigida de estabelecimento, modelo, série e ambiente. Preserve números reservados e documentos rejeitados conforme as regras aplicáveis; não reutilize números automaticamente sem verificar a legislação e o estado do documento.

## 5. Máquina de estados fiscal

Modele explicitamente o ciclo de vida dos documentos. Os nomes devem seguir as convenções existentes, mas a semântica precisa distinguir pelo menos:

- Documento preparado.
- Aguardando transmissão.
- Transmissão em andamento.
- Resultado desconhecido após falha ou timeout.
- Autorizado.
- Rejeitado.
- Em contingência, quando aplicável.
- Cancelamento solicitado.
- Cancelado após confirmação fiscal.
- Inutilização solicitada e confirmada, quando aplicável.
- Falha técnica que requer intervenção.

Não trate uma requisição HTTP bem-sucedida como autorização fiscal. A autorização só existe após confirmação válida da SEFAZ.

Implemente transições válidas entre estados, com auditoria. Não permita que chamadas arbitrárias do frontend alterem diretamente o estado fiscal.

## 6. Integração com a SEFAZ-MG

Implemente um adaptador responsável por:

- Selecionar o endpoint correto por serviço, modelo e ambiente.
- Construir requisições no formato técnico oficial.
- Validar schemas e versões antes de transmitir.
- Assinar XML com o certificado correto.
- Estabelecer a comunicação segura com o serviço fiscal.
- Interpretar códigos, mensagens e protocolos de retorno.
- Diferenciar rejeições fiscais de falhas de rede, TLS, certificado ou infraestrutura.
- Consultar o resultado quando houver timeout ou resposta ambígua.
- Registrar versões técnicas utilizadas e informações suficientes para diagnóstico sem expor segredos.

Não implemente uma API REST fictícia para substituir os Web Services oficiais. Não invente endpoints, namespaces, schemas, códigos de rejeição ou campos XML.

Use os endpoints e schemas oficiais vigentes para cada ambiente e serviço. Se uma dependência ou detalhe técnico não puder ser confirmado, documente a pendência e não simule uma implementação funcional.

## 7. XML, assinatura e certificados

Implemente a geração de XML conforme os schemas vigentes do documento escolhido.

Requisitos:

- Validar o XML contra o schema correto.
- Aplicar a assinatura digital exigida.
- Utilizar certificado compatível com o estabelecimento e a operação.
- Validar a cadeia e o período de validade do certificado conforme o fluxo técnico.
- Preservar XML assinado e autorizado.
- Nunca registrar certificados, senhas, CSC ou XML com segredos em logs.
- Nunca retornar material criptográfico pela API.
- Não armazenar chaves privadas em texto puro ou no repositório.
- Não considerar um XML válido no schema como prova de que a tributação está correta.

Utilize o serviço seguro de certificados implementado pelo módulo de empresas. Não duplique o armazenamento de certificados.

## 8. Integração com vendas e estoque

A emissão fiscal deve consumir uma venda persistida e validada. Não misture o cálculo do carrinho, o fechamento do caixa e o protocolo de transmissão fiscal em um único método extenso.

Defina claramente os limites transacionais.

Quando a venda for concluída, registre os dados comerciais e tributários necessários, e crie o trabalho fiscal de forma durável. Não dependa de publicar diretamente em uma fila externa antes de confirmar a transação principal.

A venda e o movimento de estoque precisam permanecer consistentes mesmo que a SEFAZ esteja indisponível.

A aplicação deve distinguir o estado comercial da venda do estado fiscal do documento. Não marque uma nota como autorizada antes de receber e validar a confirmação fiscal.

Não altere ou reverta automaticamente uma venda apenas porque a nota foi rejeitada; siga as regras do domínio e os procedimentos fiscais aplicáveis.

## 9. Transactional Outbox e worker

Implemente um padrão Transactional Outbox usando PostgreSQL.

A transação responsável por registrar a operação fiscal deve persistir o documento e o evento pendente de processamento de maneira atômica.

O worker deve:

- Buscar eventos pendentes com concorrência controlada.
- Reservar o trabalho de maneira segura.
- Registrar tentativas, timestamps e erros classificados.
- Aplicar backoff para falhas transitórias.
- Impedir reprocessamento simultâneo indevido do mesmo documento.
- Ser idempotente sempre que possível.
- Encaminhar falhas permanentes para estado de intervenção manual.
- Permitir observabilidade e recuperação operacional.

Não faça retries infinitos para erros de validação ou rejeições determinísticas. Monitore rejeições repetidas e aplique mecanismos de contenção para evitar consumo indevido dos serviços fiscais.

Comece sem Redis se o projeto ainda não precisar de uma fila dedicada. Se BullMQ for adotado, mantenha a outbox como registro durável e faça o processamento tolerar entregas repetidas.

### Idempotência e timeout

O frontend e a API devem suportar uma chave de idempotência para evitar duplicar a criação de uma operação fiscal após retry do cliente.

Se a transmissão tiver timeout, marque o resultado como desconhecido e consulte a situação antes de repetir a operação. Não crie automaticamente outro documento ou outro número apenas porque a resposta não chegou.

## 10. Tributação e regras de produtos

O módulo fiscal deve receber os dados tributários dos produtos e das operações de origem. Não invente CST, CSOSN, CFOP, NCM, CEST, alíquotas ou benefícios fiscais.

Implemente validações estruturais e interfaces para cálculo tributário, mas mantenha as regras fiscais versionadas e passíveis de atualização.

Separe:

- Dados cadastrais do produto.
- Dados tributários do produto.
- Regras específicas da operação.
- Valores calculados e congelados no documento.
- Regras de validação do XML.

Não reutilize cegamente uma tributação de uma venda anterior. A aplicabilidade depende do estabelecimento, regime, operação, produto, destinatário e legislação vigente.

IBS/CBS e demais mudanças da Reforma Tributária devem ser implementados conforme as versões de schema, Notas Técnicas, cronogramas e regras vigentes. Não fixe uma versão antiga de XML.

## 11. Contingência

Implemente políticas distintas por modelo documental.

Para NFC-e, modele o fluxo de contingência offline conforme a legislação e a documentação técnica vigente. Registre o motivo, horário, tipo de emissão, numeração, XML, DANFE, transmissão posterior e resultado.

Não trate contingência como uma fila genérica de documentos que falharam.

A arquitetura centralizada na nuvem não permite emitir offline se o caixa perdeu acesso ao backend. Caso a operação offline seja implementada, planeje explicitamente um componente local com persistência, proteção de credenciais, controle de numeração, sincronização e prevenção de duplicidade.

Não declare suporte offline completo antes de implementar e testar esse componente.

## 12. API e autorização

Implemente endpoints REST compatíveis com os padrões existentes para:

- Solicitar emissão a partir de uma venda elegível.
- Consultar o estado de um documento.
- Consultar XML autorizado e DANFE conforme permissões.
- Consultar eventos e tentativas.
- Solicitar cancelamento quando permitido.
- Solicitar inutilização quando aplicável.
- Consultar pendências e falhas operacionais.

A API deve validar tenant, estabelecimento e permissões em todas as operações. Não confie em identificadores enviados pelo frontend sem verificar a relação com o usuário autenticado.

Workers devem carregar explicitamente o contexto de tenant e estabelecimento; não dependam de contexto HTTP implícito.

Não permita que um tenant consulte documentos, certificados, XML ou arquivos de outro tenant.

## 13. Frontend e experiência operacional

Integre a emissão às telas existentes de venda, PDV e administração fiscal.

A interface deve mostrar estados claros, como:

- Aguardando emissão.
- Em processamento.
- Autorizada.
- Rejeitada com código e mensagem úteis.
- Resultado ainda não confirmado.
- Em contingência.
- Cancelamento pendente ou confirmado.

Disponibilize XML autorizado, protocolo e DANFE somente quando apropriado ao estado do documento e às permissões do usuário.

Para erros, diferencie uma falha técnica temporária de uma rejeição que exige corrigir os dados fiscais. Evite expor stack traces, credenciais ou conteúdo sensível.

## 14. Segurança e auditoria

Implemente:

- Segredos fora do código-fonte.
- Criptografia de certificados e CSC.
- Controle de acesso por papel.
- Auditoria de ações fiscais.
- Logs estruturados com correlação de requisição e documento.
- Redação de dados sensíveis nos logs.
- Retenção e backups adequados dos XMLs, protocolos e eventos.
- Verificação de isolamento multi-tenant.
- Rate limiting e proteção contra reenvios indevidos.
- Alertas para certificados próximos do vencimento, falhas de transmissão e rejeições repetidas.

Não registre o XML completo indiscriminadamente em logs.

## 15. Testes obrigatórios

Crie testes unitários e de integração para:

- Geração e validação do XML.
- Assinatura digital, com certificados de teste adequados.
- Interpretação de respostas de autorização e rejeição.
- Timeout com resultado desconhecido.
- Consulta de situação antes de reenvio.
- Idempotência.
- Concorrência na reserva de numeração.
- Processamento repetido da outbox.
- Recuperação após reinício do worker.
- Isolamento multi-tenant.
- Cancelamento e inutilização.
- Regras de contingência suportadas.
- Dados tributários inválidos ou incompletos.

Use fixtures e respostas de homologação. Não envie documentos reais para produção durante testes automatizados.

## 16. Documentação oficial e conformidade

Use como fontes principais:

- SEF-MG — NFC-e: https://portalsped.fazenda.mg.gov.br/spedmg/nfce/
- SEF-MG — NFC-e: credenciamento: https://portalsped.fazenda.mg.gov.br/spedmg/nfce/credenciamento/
- SEF-MG — NFC-e: Web Services: https://portalsped.fazenda.mg.gov.br/spedmg/nfce/web-services/
- SEF-MG — NFC-e: downloads: https://portalsped.fazenda.mg.gov.br/spedmg/nfce/Downloads/
- SEF-MG — NF-e: https://portalsped.fazenda.mg.gov.br/spedmg/nfe/
- SEF-MG — NF-e: Web Services: https://portalsped.fazenda.mg.gov.br/spedmg/nfe/webservices/
- Portal Nacional NF-e: https://www.nfe.fazenda.gov.br/portal/
- Documentação técnica oficial, schemas, MOC, Notas Técnicas, regras de validação e cronogramas vigentes.

Verifique também a aplicabilidade da Portaria SRE 277/2025 e demais exigências para empresas desenvolvedoras de software fiscal. Não assuma que o SaaS está dispensado de obrigações regulatórias.

Não afirme que o sistema está em conformidade legal apenas porque os testes de software passaram. Diferencie conformidade técnica, credenciamento do contribuinte, enquadramento tributário e eventuais requisitos aplicáveis à empresa desenvolvedora.

## 17. Entrega e critérios de conclusão

Ao finalizar:

1. Liste as entidades, migrations, serviços, interfaces, workers e endpoints implementados.
2. Explique o fluxo de uma emissão de ponta a ponta.
3. Documente a configuração de homologação e os segredos necessários.
4. Liste os schemas, versões técnicas e endpoints oficiais utilizados.
5. Informe quais cenários foram testados e seus resultados reais.
6. Liste os requisitos que dependem do contribuinte, do contador ou de validação regulatória.
7. Documente a recuperação de documentos com resultado desconhecido e o procedimento operacional para falhas.
8. Informe claramente o que ainda não está pronto para produção.

Implemente incrementalmente, mantenha TypeScript strict, siga o padrão do repositório e não use dados fiscais fictícios como se fossem regras oficiais.