# Implementação da Configuração Fiscal no Módulo de Empresas

Atue como um engenheiro de software sênior, especialista em NestJS, TypeScript, PostgreSQL, TypeORM, SaaS multi-tenant e sistemas fiscais brasileiros.

## 1. Objetivo

Implementar no módulo existente de empresas a gestão cadastral, documental e fiscal necessária para preparar uma empresa e seus estabelecimentos para emitir documentos fiscais eletrônicos, inicialmente NF-e modelo 55 e NFC-e modelo 65 para contribuintes de Minas Gerais.

Esta etapa prepara e valida os dados fiscais. Não implemente ainda o processo completo de geração, assinatura, transmissão e autorização dos documentos fiscais. Esse fluxo será desenvolvido em um módulo fiscal separado.

## 2. Inspecione o projeto antes de alterar o código

Antes de implementar:

1. Analise a estrutura real do monorepo.
2. Identifique os módulos existentes de empresas, usuários, autenticação, autorização, produtos e estabelecimentos.
3. Inspecione as entidades TypeORM, migrations, DTOs, controllers, services, guards, validações e padrões de testes.
4. Identifique como o projeto representa tenants, empresas e possíveis filiais.
5. Inspecione as telas existentes no Next.js e identifique o fluxo atual de cadastro e edição de empresas.
6. Verifique as dependências instaladas e os padrões de organização do projeto.

Não presuma nomes de diretórios, entidades, rotas ou propriedades. Reutilize os padrões existentes. Não crie uma segunda entidade para representar algo que já exista com outro nome.

Apresente um breve plano de implementação baseado no código encontrado e prossiga com a implementação.

## 3. Modelo de domínio

Respeite a distinção entre tenant, empresa e estabelecimento fiscal:

- Tenant: organização e limite de isolamento de dados do SaaS.
- Empresa: pessoa jurídica e seus dados cadastrais.
- Estabelecimento: unidade identificada por CNPJ próprio e configuração fiscal aplicável.

Se o projeto ainda não tiver estabelecimentos, introduza essa entidade somente após avaliar o modelo atual e planejar uma migration compatível. Não assuma que uma empresa possui apenas um estabelecimento.

### Dados empresariais

Armazene ou reutilize os campos existentes para:

- Razão social.
- Nome fantasia.
- CNPJ normalizado e validado.
- Natureza jurídica, quando necessária ao cadastro.
- CNAE principal e secundários.
- Endereço cadastral completo.
- Código IBGE do município, UF e país.
- Dados de contato.
- Situação cadastral e datas de atualização, quando aplicável.

Não confunda validação de formato de CNPJ com confirmação de situação cadastral na Receita Federal.

### Dados fiscais por estabelecimento

Crie ou adapte o modelo para suportar:

- CNPJ do estabelecimento.
- Inscrição estadual (IE), quando aplicável.
- Indicador de contribuinte do ICMS, conforme o modelo fiscal.
- CRT e enquadramento tributário aplicável.
- Modelos fiscais habilitados: NF-e 55 e NFC-e 65.
- UF e código IBGE do município.
- Ambiente de emissão: homologação ou produção.
- Status de credenciamento informado e verificado.
- Série e controle de numeração por modelo e ambiente.
- Data da última validação fiscal.
- Pendências e motivos que impedem a liberação da emissão.

Não libere a emissão apenas porque o cadastro está preenchido. A prontidão fiscal precisa considerar o modelo documental, o estabelecimento, o ambiente e a validação das informações exigidas.

Não considere o regime tributário ou a possibilidade de emitir um modelo fiscal como uma escolha livre sem validação das regras aplicáveis.

## 4. Certificados digitais

Implemente a gestão dos certificados necessários para a emissão:

- Tipo do certificado.
- Titular e CNPJ associado, conforme os dados disponíveis no certificado.
- Autoridade emissora.
- Data de início e fim da validade.
- Referência segura ao arquivo criptografado.
- Status de validação e data da última verificação.
- Identificação do usuário responsável pela configuração, respeitando permissões.

O arquivo do certificado e a senha devem ser tratados como segredos.

Requisitos obrigatórios:

- Nunca persistir senha em texto puro.
- Nunca retornar arquivo, senha ou material criptográfico em respostas de API ou logs.
- Não armazenar certificados em diretório público ou dentro do repositório.
- Utilizar o mecanismo seguro já disponível no projeto ou introduzir uma abstração para armazenamento criptografado e gestão de segredos.
- Não afirmar que um certificado está válido sem verificar sua validade e sua correspondência com o estabelecimento.
- Permitir substituição e renovação sem apagar o histórico de auditoria.
- Não registrar conteúdo sensível em logs, mensagens de erro ou ferramentas de observabilidade.

Se a infraestrutura de segredos ainda não existir, implemente a interface e documente a configuração necessária. Não invente credenciais ou chaves de criptografia.

## 5. Configuração da NFC-e

Implemente campos e operações para gerenciar:

- Identificador do CSC.
- CSC armazenado como segredo.
- Ambiente correspondente.
- Data da configuração e da última validação.
- Status da configuração.

O CSC é um segredo e não deve aparecer novamente em respostas de leitura, logs ou telas após o cadastro. Para alteração, utilize um fluxo explícito de substituição.

Não presuma que o CSC é único globalmente. Modele seu escopo de acordo com as regras oficiais aplicáveis ao contribuinte e ao ambiente. Considere que a documentação da SEF-MG informa regras de compartilhamento entre estabelecimentos do mesmo núcleo de CNPJ.

Não implemente uma integração fictícia para consultar o SIARE. A aplicação deve permitir registrar e validar as informações obtidas pelo responsável do contribuinte.

## 6. Documentação e checklist fiscal

Implemente um checklist de prontidão fiscal por estabelecimento e modelo documental, contemplando:

- Dados cadastrais completos.
- Inscrição estadual, quando aplicável.
- Regime tributário informado e revisado.
- Credenciamento confirmado.
- Certificado cadastrado e validado.
- CSC configurado para NFC-e, quando aplicável.
- Ambiente selecionado.
- Série e numeração revisadas.
- Configurações tributárias iniciais aprovadas.
- Responsável pela configuração e data da revisão.

Permita anexar evidências cadastrais, com acesso restrito, metadados e histórico de alterações. Não torne o upload de um documento equivalente a uma validação oficial.

Implemente status claros, por exemplo:

- `INCOMPLETE`
- `PENDING_REVIEW`
- `READY_FOR_HOMOLOGATION`
- `HOMOLOGATION_IN_PROGRESS`
- `READY_FOR_PRODUCTION`
- `BLOCKED`

Adapte os nomes às convenções existentes. Não considere `READY_FOR_PRODUCTION` como prova de credenciamento ou aprovação fiscal externa; ele representa apenas que os requisitos internos definidos foram verificados.

## 7. API e autorização

Implemente endpoints compatíveis com os padrões atuais para:

- Consultar e atualizar os dados fiscais de um estabelecimento.
- Consultar a prontidão fiscal e suas pendências.
- Cadastrar, substituir e consultar metadados de certificados.
- Configurar ou substituir CSC.
- Gerenciar documentos comprobatórios.
- Registrar a revisão fiscal e o responsável.
- Consultar o histórico de auditoria.

Todos os endpoints devem validar o tenant e a autorização no backend. Não confie em `tenantId`, `companyId` ou `establishmentId` enviados pelo cliente sem verificar o vínculo com o usuário autenticado.

Aplique RBAC de acordo com os papéis existentes. Apenas usuários autorizados podem modificar configuração fiscal ou acessar documentos e segredos. Nunca devolva valores secretos em endpoints de listagem.

## 8. Frontend Next.js

Integre a funcionalidade às telas existentes de empresas e estabelecimentos, respeitando o design system e os padrões do projeto.

Implemente:

- Seção de dados fiscais.
- Formulários validados.
- Seção de certificado com validade e status, sem exibir o segredo.
- Configuração do CSC com entrada protegida e substituição explícita.
- Upload seguro de documentos.
- Checklist visual de pendências.
- Indicação de homologação e produção.
- Histórico de alterações conforme as permissões do usuário.
- Mensagens claras de erro e sucesso.

Não permita que o usuário habilite produção com um clique sem cumprir as validações necessárias. Não confunda configuração salva com credenciamento confirmado.

Evite adicionar `use client` desnecessariamente e siga o padrão de formulários, estado, requisições e componentes já adotado no projeto.

## 9. Banco de dados e qualidade

- Utilize migrations TypeORM; nunca dependa de `synchronize: true` em produção.
- Preserve os dados existentes e planeje a migração de empresas que já estão cadastradas.
- Crie índices e restrições adequados para CNPJ, estabelecimento, tenant e configuração fiscal.
- Evite constraints globais que impeçam situações válidas entre tenants.
- Utilize transações para operações que precisem manter consistência.
- Registre auditoria sem armazenar segredos.
- Implemente testes unitários, de integração, autorização, isolamento multi-tenant e validação dos DTOs.
- Teste tentativas de acessar ou alterar dados fiscais de outro tenant.
- Não utilize `any` para contornar erros de tipagem.
- Mantenha TypeScript strict e siga as regras de ESLint existentes.

## 10. Fontes e limites legais

Use como referência oficial:

- SEF-MG — NFC-e: https://portalsped.fazenda.mg.gov.br/spedmg/nfce/credenciamento/
- SEF-MG — NF-e: https://portalsped.fazenda.mg.gov.br/spedmg/nfe/credenciamento/
- SEF-MG — NFC-e: perguntas frequentes: https://portalsped.fazenda.mg.gov.br/spedmg/nfce/Perguntas-Frequentes/
- SEF-MG — NF-e/NFC-e: downloads e regras técnicas: https://portalsped.fazenda.mg.gov.br/spedmg/nfce/Downloads/

Não invente requisitos legais. Diferencie regras confirmadas, parâmetros configuráveis e itens que precisam de validação pelo contador ou especialista fiscal. Não trate a prontidão interna do cadastro como aprovação pela SEFAZ.

## 11. Entrega

Ao finalizar:

1. Liste as entidades e migrations criadas ou alteradas.
2. Liste endpoints, DTOs, permissões e telas implementadas.
3. Explique como os segredos são armazenados e protegidos.
4. Documente as variáveis de ambiente e dependências novas.
5. Apresente as pendências que dependem de credenciamento, certificado ou validação contábil.
6. Execute os testes e informe os resultados reais, sem afirmar que passaram se não foram executados.
7. Documente como configurar uma empresa e um estabelecimento em homologação.

Implemente de forma incremental, mantendo compatibilidade com o projeto e sem reescrever módulos não relacionados.