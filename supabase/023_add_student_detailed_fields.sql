-- Adiciona colunas faltantes para Ficha de Inscrição detalhada

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS pne_descricao text,
ADD COLUMN IF NOT EXISTS pne_medicacao_suporte text,
ADD COLUMN IF NOT EXISTS pne_necessita_supervisao boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pne_supervisor_nome text,
ADD COLUMN IF NOT EXISTS pne_supervisor_cpf text,
ADD COLUMN IF NOT EXISTS pne_supervisor_e_responsavel boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS contato_emergencia_nome text,
ADD COLUMN IF NOT EXISTS contato_emergencia_email text,
ADD COLUMN IF NOT EXISTS contato_emergencia_endereco text,
ADD COLUMN IF NOT EXISTS turma_selecionada text,
ADD COLUMN IF NOT EXISTS turma_nome text,
ADD COLUMN IF NOT EXISTS turma_horario text;
