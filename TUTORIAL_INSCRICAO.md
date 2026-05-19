# Guia Completo: Processo de Captação e Inscrição de Alunos

Este documento descreve detalhadamente o fluxo operacional da plataforma, desde o primeiro acesso do professor/coordenador até a efetivação da matrícula de um aluno. Este material é ideal para alimentar modelos de IA (como o Google NotebookLM) para geração de treinamentos, apresentações e FAQs.

---

## 1. Acesso ao Sistema (Login)

O acesso à plataforma é restrito a profissionais previamente cadastrados e autorizados (Super Admins, Coordenadores, Monitores ou Professores).

1. **Página Inicial:** O usuário acessa a página inicial do sistema e visualiza a tela de login.
2. **Autenticação:** Insere suas credenciais (E-mail e Senha). O sistema utiliza autenticação segura.
3. **Validação de Permissões:** 
   - Ao logar, o sistema verifica a qual "Projeto" e "Núcleo" o usuário pertence.
   - Caso seja um novo usuário que acabou de se registrar, ele entrará em um estado "Pendente" e precisará que o Administrador Geral aprove o seu acesso através da aba **Gestão de Acessos** antes de visualizar os dados do sistema.
4. **Redirecionamento:** Após a validação, o usuário é direcionado para o Dashboard principal correspondente ao seu nível de acesso.

---

## 2. Visão Geral (Dashboard e Mapa Interativo)

O Dashboard é a central de comando do profissional. O foco principal é a gestão visual e rápida da situação das turmas e núcleos.

### O Mapa de Núcleos (Georreferenciamento)
- No centro da tela (ou em destaque na lateral), o usuário visualiza um **Mapa Interativo do Brasil**.
- Cada pino no mapa representa um núcleo esportivo ativo.
- **Interação:** Ao clicar em um pino, um balão de informações é exibido contendo:
  - Nome da cidade/estado.
  - Ocupação atual (ex: "45/60 alunos").
  - Botão de acesso rápido para "Ver Núcleo" ou "Lista de Espera".
- **Filtros Rápidos:** Acima do mapa, existem botões para filtrar o mapa (ex: mostrar apenas núcleos com vagas abertas, ou apenas os núcleos do estado do usuário logado).

### Indicadores (Cards Resumo)
Abaixo ou ao lado do mapa, o dashboard apresenta cards quantitativos:
- Total de alunos ativos.
- Quantidade de alunos na Fila de Espera (Pré-cadastro).
- Alertas de documentos ou atestados médicos vencendo/pendentes.

---

## 3. Fila de Espera Inteligente (Pré-cadastro)

Antes de um aluno ser efetivado, ele passa pelo processo de Pré-cadastro. Essa é a etapa de "captação" onde as famílias demonstram interesse na vaga.

### Como a família se cadastra?
1. **Link Público:** O professor/admin pode gerar um link público ou enviar diretamente para o WhatsApp das famílias.
2. **Formulário de Captação:** A mãe/pai do aluno acessa o link do próprio celular e preenche um formulário socioeconômico e de saúde inicial.
3. **Geolocalização Automática:** Com base no endereço inserido pela família, o sistema *sugere* automaticamente qual é o núcleo esportivo mais próximo para alocar a criança.

### Gestão da Fila de Espera pelo Professor
1. No menu principal, o profissional acessa a aba **"Pré-cadastro"**.
2. **Visão da Fila:** Ele verá uma lista de cards ordenados por ordem cronológica (quem se cadastrou primeiro aparece no topo).
3. **Extrato de Vagas:** Um botão em destaque (ícone de sino com alerta vermelho) mostra o "Extrato de Vagas", calculando em tempo real quantas vagas restam no núcleo para atingir a capacidade máxima (ex: 60 vagas totais).
4. **Análise do Candidato:** O professor clica em "Ver Detalhes" para conferir a vulnerabilidade social, interesse e eventuais deficiências (PCD).
5. **Aprovação / Chamada:** O sistema destaca visualmente os alunos que estão "Na vez" para preencher as vagas abertas. O professor entra em contato com a família e se prepara para matricular.

---

## 4. Efetivação da Inscrição (Matrícula Definitiva)

Quando a criança é chamada da Fila de Espera para começar as aulas, ocorre a matrícula oficial.

### Fluxo de Conversão (Pré-cadastro para Aluno Ativo)
1. O professor acessa o card do aluno no painel de **Pré-cadastro**.
2. Ele clica na opção para ver os detalhes da ficha pré-cadastrada.
3. No mundo ideal, o professor cadastra oficialmente a criança na aba **Alunos**, preenchendo todos os dados adicionais com base no que a mãe digitou. O sistema facilita copiando visualmente as informações essenciais.
4. **Associação de Turma:** O professor escolhe o núcleo e a turma em que o aluno fará as aulas.
5. **Status do Aluno:** Ao salvar, o aluno é listado na aba principal **"Alunos"** com o status de `ATIVO`.

### Documentação e Termos (Onboarding do Aluno)
Imediatamente após a matrícula, o sistema exige que as formalidades legais e médicas sejam anexadas.

1. O professor acessa a ficha do novo aluno matriculado na aba Alunos.
2. Vai até a tela/aba de **Documentos**.
3. **Uploads Exigidos:**
   - RG/CPF do Aluno e Responsável.
   - Comprovante de Matrícula Escolar (para provar que a criança estuda).
   - Termo de Uso de Imagem e Autorização de Participação.
   - **Atestado Médico** (obrigatório para a prática esportiva).
4. O sistema possui alertas de "Materiais Pendentes". Se um atestado médico não for entregue, o perfil do aluno acusa pendência, sinalizando para o professor cobrar a família.

---

## Resumo do Ciclo de Vida do Aluno

1. **Captação:** Família preenche o formulário online -> Aluno cai na **Fila de Espera Inteligente (Pré-cadastro)**.
2. **Análise de Vagas:** Admin analisa o **Mapa** e o **Extrato de Vagas** -> Identifica, por exemplo, que o núcleo de Ilhéus tem 3 vagas em aberto.
3. **Chamada:** Admin entra na aba de Pré-cadastro, filtra os interessados em "Ilhéus", e chama os 3 primeiros da lista.
4. **Efetivação:** Insere os 3 alunos como ATIVOS no módulo de Alunos.
5. **Regularização:** O Admin recolhe as cópias (fotos/PDF) do boletim escolar, identidade e atestado de aptidão física, fazendo o upload de cada arquivo na ficha do aluno. O aluno está 100% legal e apto para os treinos!

*Fim do Guia.*
