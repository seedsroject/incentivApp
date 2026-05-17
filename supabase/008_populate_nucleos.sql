
-- Script para registrar os núcleos de demonstração no banco oficial
DO $$
DECLARE
  v_proj_fc UUID;
  v_proj_dd UUID;
  v_proj_fut UUID;
BEGIN
  SELECT id INTO v_proj_fc FROM projects WHERE slug = 'FORMANDO_CAMPEOES' LIMIT 1;
  SELECT id INTO v_proj_dd FROM projects WHERE slug = 'DANIEL_DIAS' LIMIT 1;
  SELECT id INTO v_proj_fut FROM projects WHERE slug = 'FUTEBOL' LIMIT 1;
  

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Ilhéus | BA - CEEP do Chocolate – Av. Antônio Carlos Magalhães, nº 755, Ilhéus - BA' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Ilhéus | BA - CEEP do Chocolate – Av. Antônio Carlos Magalhães, nº 755, Ilhéus - BA', 
        'CEEP do Chocolate – Av. Antônio Carlos Magalhães, nº 755, Ilhéus', 
        '(00) 3333-4444', 
        'contato.nuc_ilheus@esporte.gov.br', 
        '(-39.048333, -14.788889)',
        ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'],
        'Seg/Qua: 8h-10h, 13:30-15:30 | Ter/Qui: 8h-10h, 16h-18h'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'], dias_aulas),
        horario_aulas = COALESCE('Seg/Qua: 8h-10h, 13:30-15:30 | Ter/Qui: 8h-10h, 16h-18h', horario_aulas)
      WHERE nome = 'Ilhéus | BA - CEEP do Chocolate – Av. Antônio Carlos Magalhães, nº 755, Ilhéus - BA' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Aquiraz | CE - Sec. de Esporte – Av. Airton Sena, Vila da Prata, Aquiraz - CE' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Aquiraz | CE - Sec. de Esporte – Av. Airton Sena, Vila da Prata, Aquiraz - CE', 
        'Sec. de Esporte – Av. Airton Sena, Vila da Prata, Aquiraz', 
        '(00) 3333-4444', 
        'contato.nuc_aquiraz@esporte.gov.br', 
        '(-38.3925, -3.9186)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Aquiraz | CE - Sec. de Esporte – Av. Airton Sena, Vila da Prata, Aquiraz - CE' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Aracati | CE - Colégio EEFTI Prof Onélio Porto – Rua Padre Pachêco, 147, Aracati - CE' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Aracati | CE - Colégio EEFTI Prof Onélio Porto – Rua Padre Pachêco, 147, Aracati - CE', 
        'Colégio EEFTI Prof Onélio Porto – Rua Padre Pachêco, 147, Aracati', 
        '(00) 3333-4444', 
        'contato.nuc_aracati@esporte.gov.br', 
        '(-37.7697, -4.5617)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Aracati | CE - Colégio EEFTI Prof Onélio Porto – Rua Padre Pachêco, 147, Aracati - CE' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Cascavel | CE - Centro Comunitário do Coqueiro – Sítio Coqueiro, S/N, Guanacés, Cascavel - CE' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Cascavel | CE - Centro Comunitário do Coqueiro – Sítio Coqueiro, S/N, Guanacés, Cascavel - CE', 
        'Centro Comunitário do Coqueiro – Sítio Coqueiro, S/N, Guanacés, Cascavel', 
        '(00) 3333-4444', 
        'contato.nuc_cascavel@esporte.gov.br', 
        '(-38.2417, -4.1283)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Cascavel | CE - Centro Comunitário do Coqueiro – Sítio Coqueiro, S/N, Guanacés, Cascavel - CE' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Caucaia | CE - Centro Municipal de Formação e Avaliação (Av. Juaci Sampaio Pontes, s/n), Caucaia - CE' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Caucaia | CE - Centro Municipal de Formação e Avaliação (Av. Juaci Sampaio Pontes, s/n), Caucaia - CE', 
        'Centro Municipal de Formação e Avaliação (Av. Juaci Sampaio Pontes, s/n), Caucaia', 
        '(00) 3333-4444', 
        'contato.nuc_caucaia@esporte.gov.br', 
        '(-38.6533, -3.7375)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Caucaia | CE - Centro Municipal de Formação e Avaliação (Av. Juaci Sampaio Pontes, s/n), Caucaia - CE' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Atitude Atletas - Bairro Pirambu (Praia de Pirambu), Fortaleza - CE' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Atitude Atletas - Bairro Pirambu (Praia de Pirambu), Fortaleza - CE', 
        'Bairro Pirambu (Praia de Pirambu), Fortaleza', 
        '(00) 3333-4444', 
        'contato.nuc_fortaleza@esporte.gov.br', 
        '(-38.56, -3.715)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Atitude Atletas - Bairro Pirambu (Praia de Pirambu), Fortaleza - CE' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Horizonte | CE - Rua Moreira da Silva, nº 90 (Rua 13), Diadema, Horizonte - CE' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Horizonte | CE - Rua Moreira da Silva, nº 90 (Rua 13), Diadema, Horizonte - CE', 
        'Rua Moreira da Silva, nº 90 (Rua 13), Diadema, Horizonte', 
        '(00) 3333-4444', 
        'contato.nuc_horizonte@esporte.gov.br', 
        '(-38.4833, -4.1)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Horizonte | CE - Rua Moreira da Silva, nº 90 (Rua 13), Diadema, Horizonte - CE' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Maracanaú | CE - Instituto Lucimário Caitano – Av. Central, 120, Novo Oriente, Maracanaú - CE' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Maracanaú | CE - Instituto Lucimário Caitano – Av. Central, 120, Novo Oriente, Maracanaú - CE', 
        'Instituto Lucimário Caitano – Av. Central, 120, Novo Oriente, Maracanaú', 
        '(00) 3333-4444', 
        'contato.nuc_maracanau@esporte.gov.br', 
        '(-38.6256, -3.8744)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Maracanaú | CE - Instituto Lucimário Caitano – Av. Central, 120, Novo Oriente, Maracanaú - CE' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Pecém | CE - Rua Professor José Denilson, São Gonçalo do Amarante - CE' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Pecém | CE - Rua Professor José Denilson, São Gonçalo do Amarante - CE', 
        'Rua Professor José Denilson, São Gonçalo do Amarante', 
        '(00) 3333-4444', 
        'contato.nuc_pecem@esporte.gov.br', 
        '(-38.8258, -3.5433)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Pecém | CE - Rua Professor José Denilson, São Gonçalo do Amarante - CE' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Ceilândia | DF - C.O.P. Parque da Vaquejada – QNP 21, AE, Sol Nascente, Ceilândia - DF' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Ceilândia | DF - C.O.P. Parque da Vaquejada – QNP 21, AE, Sol Nascente, Ceilândia - DF', 
        'C.O.P. Parque da Vaquejada – QNP 21, AE, Sol Nascente, Ceilândia', 
        '(00) 3333-4444', 
        'contato.nuc_ceilandia@esporte.gov.br', 
        '(-48.1158, -15.8203)',
        ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'],
        'Seg à Qui: 9h às 11h e 14h às 16h'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'], dias_aulas),
        horario_aulas = COALESCE('Seg à Qui: 9h às 11h e 14h às 16h', horario_aulas)
      WHERE nome = 'Ceilândia | DF - C.O.P. Parque da Vaquejada – QNP 21, AE, Sol Nascente, Ceilândia - DF' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Vila Velha | ES - UMEF Vila Olímpica – Rua Almirante Tamandaré, nº 1, Soteco, Vila Velha - ES' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Vila Velha | ES - UMEF Vila Olímpica – Rua Almirante Tamandaré, nº 1, Soteco, Vila Velha - ES', 
        'UMEF Vila Olímpica – Rua Almirante Tamandaré, nº 1, Soteco, Vila Velha', 
        '(00) 3333-4444', 
        'contato.nuc_vila_velha@esporte.gov.br', 
        '(-40.2925, -20.3297)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Vila Velha | ES - UMEF Vila Olímpica – Rua Almirante Tamandaré, nº 1, Soteco, Vila Velha - ES' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Vitória | ES - Clube ACS – Rua Alvin Borges da Silva, nº 42, Jardim Camburi, Vitória - ES' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Vitória | ES - Clube ACS – Rua Alvin Borges da Silva, nº 42, Jardim Camburi, Vitória - ES', 
        'Clube ACS – Rua Alvin Borges da Silva, nº 42, Jardim Camburi, Vitória', 
        '(00) 3333-4444', 
        'contato.nuc_vitoria@esporte.gov.br', 
        '(-40.2844, -20.2589)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Vitória | ES - Clube ACS – Rua Alvin Borges da Silva, nº 42, Jardim Camburi, Vitória - ES' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Goiânia | GO - Praça de Esporte Pedro Ludovico – Rua 1015, Setor Pedro Ludovico, Goiânia - GO' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Goiânia | GO - Praça de Esporte Pedro Ludovico – Rua 1015, Setor Pedro Ludovico, Goiânia - GO', 
        'Praça de Esporte Pedro Ludovico – Rua 1015, Setor Pedro Ludovico, Goiânia', 
        '(00) 3333-4444', 
        'contato.nuc_goiania@esporte.gov.br', 
        '(-49.25, -16.7)',
        ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'],
        'Seg à Qui: 9h às 11h e 15h às 17h'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'], dias_aulas),
        horario_aulas = COALESCE('Seg à Qui: 9h às 11h e 15h às 17h', horario_aulas)
      WHERE nome = 'Goiânia | GO - Praça de Esporte Pedro Ludovico – Rua 1015, Setor Pedro Ludovico, Goiânia - GO' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Parauapebas | PA - Usina da Paz – Avenida D, Quadra, nº 101, Jardim Tropical, Parauapebas - PA' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Parauapebas | PA - Usina da Paz – Avenida D, Quadra, nº 101, Jardim Tropical, Parauapebas - PA', 
        'Usina da Paz – Avenida D, Quadra, nº 101, Jardim Tropical, Parauapebas', 
        '(00) 3333-4444', 
        'contato.nuc_parauapebas@esporte.gov.br', 
        '(-49.9, -6.0667)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Parauapebas | PA - Usina da Paz – Avenida D, Quadra, nº 101, Jardim Tropical, Parauapebas - PA' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Camaragibe | PE - CT Pr1me – Av. Dr. Belmino Correia, nº 144, Novo do Carmelo, Camaragibe - PE' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Camaragibe | PE - CT Pr1me – Av. Dr. Belmino Correia, nº 144, Novo do Carmelo, Camaragibe - PE', 
        'CT Pr1me – Av. Dr. Belmino Correia, nº 144, Novo do Carmelo, Camaragibe', 
        '(00) 3333-4444', 
        'contato.nuc_camaragibe@esporte.gov.br', 
        '(-34.9786, -8.0208)',
        ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'],
        'Seg à Qui: 9h às 11h e 14h às 16h'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'], dias_aulas),
        horario_aulas = COALESCE('Seg à Qui: 9h às 11h e 14h às 16h', horario_aulas)
      WHERE nome = 'Camaragibe | PE - CT Pr1me – Av. Dr. Belmino Correia, nº 144, Novo do Carmelo, Camaragibe - PE' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'CPM | PR (Colégio da Polícia Militar) - Rua José Ferreira Pinheiro, nº 349, Bairro Portão, Curitiba - PR' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'CPM | PR (Colégio da Polícia Militar) - Rua José Ferreira Pinheiro, nº 349, Bairro Portão, Curitiba - PR', 
        'Rua José Ferreira Pinheiro, nº 349, Bairro Portão, Curitiba', 
        '(00) 3333-4444', 
        'contato.nuc_cpm_curitiba@esporte.gov.br', 
        '(-49.2889, -25.4667)',
        ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'],
        'Seg à Qui: 9h20 às 11h20 e 13h30 às 15h30'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'], dias_aulas),
        horario_aulas = COALESCE('Seg à Qui: 9h20 às 11h20 e 13h30 às 15h30', horario_aulas)
      WHERE nome = 'CPM | PR (Colégio da Polícia Militar) - Rua José Ferreira Pinheiro, nº 349, Bairro Portão, Curitiba - PR' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Bairro Novo - Rua Marcolina Caetana Chaves, nº 150, Curitiba - PR' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Bairro Novo - Rua Marcolina Caetana Chaves, nº 150, Curitiba - PR', 
        'Rua Marcolina Caetana Chaves, nº 150, Curitiba', 
        '(00) 3333-4444', 
        'contato.nuc_bairro_novo@esporte.gov.br', 
        '(-49.2743, -25.5532)',
        ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'],
        'Seg à Qui: 8h às 10h e 15h às 17h'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'], dias_aulas),
        horario_aulas = COALESCE('Seg à Qui: 8h às 10h e 15h às 17h', horario_aulas)
      WHERE nome = 'Bairro Novo - Rua Marcolina Caetana Chaves, nº 150, Curitiba - PR' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Boa Vista - Rua Joaquim da Costa Ribeiro, nº 319, Curitiba - PR' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Boa Vista - Rua Joaquim da Costa Ribeiro, nº 319, Curitiba - PR', 
        'Rua Joaquim da Costa Ribeiro, nº 319, Curitiba', 
        '(00) 3333-4444', 
        'contato.nuc_boa_vista@esporte.gov.br', 
        '(-49.2319, -25.385)',
        ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'],
        'Seg à Qui: 9h às 11h e 14h às 16h'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'], dias_aulas),
        horario_aulas = COALESCE('Seg à Qui: 9h às 11h e 14h às 16h', horario_aulas)
      WHERE nome = 'Boa Vista - Rua Joaquim da Costa Ribeiro, nº 319, Curitiba - PR' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Boqueirão - Rua Pastor Antonio Polito, nº 2200, Curitiba - PR' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Boqueirão - Rua Pastor Antonio Polito, nº 2200, Curitiba - PR', 
        'Rua Pastor Antonio Polito, nº 2200, Curitiba', 
        '(00) 3333-4444', 
        'contato.nuc_boqueirao@esporte.gov.br', 
        '(-49.2392, -25.5008)',
        ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'],
        'Seg à Qui: 9h30 às 11h30 e 15h30 às 17h30'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'], dias_aulas),
        horario_aulas = COALESCE('Seg à Qui: 9h30 às 11h30 e 15h30 às 17h30', horario_aulas)
      WHERE nome = 'Boqueirão - Rua Pastor Antonio Polito, nº 2200, Curitiba - PR' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Cajuru - Rua João Henrique Hoffman, nº 125, Curitiba - PR' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Cajuru - Rua João Henrique Hoffman, nº 125, Curitiba - PR', 
        'Rua João Henrique Hoffman, nº 125, Curitiba', 
        '(00) 3333-4444', 
        'contato.nuc_cajuru@esporte.gov.br', 
        '(-49.2133, -25.4611)',
        ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'],
        'Seg à Qui: 9h30 às 11h30 e 13h às 15h'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'], dias_aulas),
        horario_aulas = COALESCE('Seg à Qui: 9h30 às 11h30 e 13h às 15h', horario_aulas)
      WHERE nome = 'Cajuru - Rua João Henrique Hoffman, nº 125, Curitiba - PR' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'CIC (Cidade Industrial) - Rua Hilda Cadilhe de Oliveira, s/n, Curitiba - PR' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'CIC (Cidade Industrial) - Rua Hilda Cadilhe de Oliveira, s/n, Curitiba - PR', 
        'Rua Hilda Cadilhe de Oliveira, s/n, Curitiba', 
        '(00) 3333-4444', 
        'contato.nuc_cic@esporte.gov.br', 
        '(-49.3333, -25.4925)',
        ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'],
        'Seg à Qui: 9h30 às 11h30 e 13h30 às 15h30'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'], dias_aulas),
        horario_aulas = COALESCE('Seg à Qui: 9h30 às 11h30 e 13h30 às 15h30', horario_aulas)
      WHERE nome = 'CIC (Cidade Industrial) - Rua Hilda Cadilhe de Oliveira, s/n, Curitiba - PR' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Oswaldo Cruz - Praça Oswaldo Cruz (Rua Brigadeiro Franco, s/n°), Curitiba - PR' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Oswaldo Cruz - Praça Oswaldo Cruz (Rua Brigadeiro Franco, s/n°), Curitiba - PR', 
        'Praça Oswaldo Cruz (Rua Brigadeiro Franco, s/n°), Curitiba', 
        '(00) 3333-4444', 
        'contato.nuc_oswaldo_cruz@esporte.gov.br', 
        '(-49.2783, -25.4386)',
        ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'],
        'Seg à Qui: 9h30 às 11h30 e 13h30 às 15h30'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'], dias_aulas),
        horario_aulas = COALESCE('Seg à Qui: 9h30 às 11h30 e 13h30 às 15h30', horario_aulas)
      WHERE nome = 'Oswaldo Cruz - Praça Oswaldo Cruz (Rua Brigadeiro Franco, s/n°), Curitiba - PR' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Santa Felicidade - Rua Daniel Cesario Pereira, nº 681, Curitiba - PR' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Santa Felicidade - Rua Daniel Cesario Pereira, nº 681, Curitiba - PR', 
        'Rua Daniel Cesario Pereira, nº 681, Curitiba', 
        '(00) 3333-4444', 
        'contato.nuc_santa_felicidade@esporte.gov.br', 
        '(-49.3283, -25.4053)',
        ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'],
        'Seg à Qui: 9h15 às 11h15 e 13h15 às 15h15'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Segunda', 'Terça', 'Quarta', 'Quinta'], dias_aulas),
        horario_aulas = COALESCE('Seg à Qui: 9h15 às 11h15 e 13h15 às 15h15', horario_aulas)
      WHERE nome = 'Santa Felicidade - Rua Daniel Cesario Pereira, nº 681, Curitiba - PR' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Tatuquara - Rua Evelázio Augusto Bley, nº 151, Curitiba - PR' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Tatuquara - Rua Evelázio Augusto Bley, nº 151, Curitiba - PR', 
        'Rua Evelázio Augusto Bley, nº 151, Curitiba', 
        '(00) 3333-4444', 
        'contato.nuc_tatuquara@esporte.gov.br', 
        '(-49.3242, -25.5683)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Tatuquara - Rua Evelázio Augusto Bley, nº 151, Curitiba - PR' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Matinhos | PR - UFPR Litoral – Rua Jaguariaíva, nº 512, Matinhos - PR' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Matinhos | PR - UFPR Litoral – Rua Jaguariaíva, nº 512, Matinhos - PR', 
        'UFPR Litoral – Rua Jaguariaíva, nº 512, Matinhos', 
        '(00) 3333-4444', 
        'contato.nuc_matinhos@esporte.gov.br', 
        '(-48.5428, -25.8175)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Matinhos | PR - UFPR Litoral – Rua Jaguariaíva, nº 512, Matinhos - PR' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Paranaguá | PR - Complexo Olímpico Nereu Gouvêa – Rua Um, Ponta do Caju, Paranaguá - PR' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Paranaguá | PR - Complexo Olímpico Nereu Gouvêa – Rua Um, Ponta do Caju, Paranaguá - PR', 
        'Complexo Olímpico Nereu Gouvêa – Rua Um, Ponta do Caju, Paranaguá', 
        '(00) 3333-4444', 
        'contato.nuc_paranagua@esporte.gov.br', 
        '(-48.5092, -25.5203)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Paranaguá | PR - Complexo Olímpico Nereu Gouvêa – Rua Um, Ponta do Caju, Paranaguá - PR' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'São José dos Pinhais | PR - Centro da Juventude – Rua Leôncio Corrêa, nº 311, Roseira, S.J. Pinhais - PR' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'São José dos Pinhais | PR - Centro da Juventude – Rua Leôncio Corrêa, nº 311, Roseira, S.J. Pinhais - PR', 
        'Centro da Juventude – Rua Leôncio Corrêa, nº 311, Roseira, S.J. Pinhais', 
        '(00) 3333-4444', 
        'contato.nuc_sjp@esporte.gov.br', 
        '(-49.2064, -25.5347)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'São José dos Pinhais | PR - Centro da Juventude – Rua Leôncio Corrêa, nº 311, Roseira, S.J. Pinhais - PR' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Joinville | SC - Univille – Rua Paulo Malschitzki, nº 10, Joinville - SC' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Joinville | SC - Univille – Rua Paulo Malschitzki, nº 10, Joinville - SC', 
        'Univille – Rua Paulo Malschitzki, nº 10, Joinville', 
        '(00) 3333-4444', 
        'contato.nuc_joinville@esporte.gov.br', 
        '(-48.8489, -26.3031)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Joinville | SC - Univille – Rua Paulo Malschitzki, nº 10, Joinville - SC' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Laranjeiras | SE - Clube Rec. Antônio Carlos Franco – Rua Propriá, 182, Centro, Laranjeiras - SE' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Laranjeiras | SE - Clube Rec. Antônio Carlos Franco – Rua Propriá, 182, Centro, Laranjeiras - SE', 
        'Clube Rec. Antônio Carlos Franco – Rua Propriá, 182, Centro, Laranjeiras', 
        '(00) 3333-4444', 
        'contato.nuc_laranjeiras@esporte.gov.br', 
        '(-37.1722, -10.8061)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Laranjeiras | SE - Clube Rec. Antônio Carlos Franco – Rua Propriá, 182, Centro, Laranjeiras - SE' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Campinas | SP - Lagoa Taquaral – Av. Dr. Heitor Penteado, 1671, Campinas - SP' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Campinas | SP - Lagoa Taquaral – Av. Dr. Heitor Penteado, 1671, Campinas - SP', 
        'Lagoa Taquaral – Av. Dr. Heitor Penteado, 1671, Campinas', 
        '(00) 3333-4444', 
        'contato.nuc_campinas@esporte.gov.br', 
        '(-47.0506, -22.8681)',
        ARRAY['Terça', 'Quarta', 'Quinta', 'Sexta'],
        'Ter à Sex: 9h às 11h e 15h às 17h'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Terça', 'Quarta', 'Quinta', 'Sexta'], dias_aulas),
        horario_aulas = COALESCE('Ter à Sex: 9h às 11h e 15h às 17h', horario_aulas)
      WHERE nome = 'Campinas | SP - Lagoa Taquaral – Av. Dr. Heitor Penteado, 1671, Campinas - SP' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Itu | SP - C. Aquático Fiori Marcello Amantéa – Praça Washington Luiz, s/nº, Itu - SP' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Itu | SP - C. Aquático Fiori Marcello Amantéa – Praça Washington Luiz, s/nº, Itu - SP', 
        'C. Aquático Fiori Marcello Amantéa – Praça Washington Luiz, s/nº, Itu', 
        '(00) 3333-4444', 
        'contato.nuc_itu@esporte.gov.br', 
        '(-47.3, -23.2667)',
        ARRAY['Terça', 'Quarta', 'Quinta', 'Sexta'],
        'Ter à Sex: 9h às 11h e 15h às 17h'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Terça', 'Quarta', 'Quinta', 'Sexta'], dias_aulas),
        horario_aulas = COALESCE('Ter à Sex: 9h às 11h e 15h às 17h', horario_aulas)
      WHERE nome = 'Itu | SP - C. Aquático Fiori Marcello Amantéa – Praça Washington Luiz, s/nº, Itu - SP' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Jundiaí | SP - CECE Dr. Nicolino de Luca (Bolão) – Rua Rodrigo Soares de Oliveira, s/n, Jundiaí - SP' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Jundiaí | SP - CECE Dr. Nicolino de Luca (Bolão) – Rua Rodrigo Soares de Oliveira, s/n, Jundiaí - SP', 
        'CECE Dr. Nicolino de Luca (Bolão) – Rua Rodrigo Soares de Oliveira, s/n, Jundiaí', 
        '(00) 3333-4444', 
        'contato.nuc_jundiai@esporte.gov.br', 
        '(-46.8842, -23.1864)',
        ARRAY['Terça', 'Quarta', 'Quinta', 'Sexta'],
        'Ter à Sex: 9h às 11h e 15h às 17h'
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(ARRAY['Terça', 'Quarta', 'Quinta', 'Sexta'], dias_aulas),
        horario_aulas = COALESCE('Ter à Sex: 9h às 11h e 15h às 17h', horario_aulas)
      WHERE nome = 'Jundiaí | SP - CECE Dr. Nicolino de Luca (Bolão) – Rua Rodrigo Soares de Oliveira, s/n, Jundiaí - SP' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_fc IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Ribeirão Preto | SP - Ginásio Cava do Bosque – Rua Camilo de Mattos, nº 627, Rib. Preto - SP' AND project_id = v_proj_fc) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fc, 
        'Ribeirão Preto | SP - Ginásio Cava do Bosque – Rua Camilo de Mattos, nº 627, Rib. Preto - SP', 
        'Ginásio Cava do Bosque – Rua Camilo de Mattos, nº 627, Rib. Preto', 
        '(00) 3333-4444', 
        'contato.nuc_ribeirao@esporte.gov.br', 
        '(-47.8103, -21.1775)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Ribeirão Preto | SP - Ginásio Cava do Bosque – Rua Camilo de Mattos, nº 627, Rib. Preto - SP' AND project_id = v_proj_fc;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'CIC | PR - CEL Bairro CIC – Rua Pedro Gusso, 2447, Cidade Industrial, Curitiba - PR' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'CIC | PR - CEL Bairro CIC – Rua Pedro Gusso, 2447, Cidade Industrial, Curitiba - PR', 
        'Rua Pedro Gusso, 2447, Cidade Industrial, Curitiba - PR', 
        '(00) 3333-4444', 
        'contato.dd_cic@danieldias.org.br', 
        '(-49.345, -25.4925)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'CIC | PR - CEL Bairro CIC – Rua Pedro Gusso, 2447, Cidade Industrial, Curitiba - PR' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Boa Vista | PR - CEL Boa Vista – Rua Lodovico Geronazzo, 1910, Boa Vista, Curitiba - PR' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Boa Vista | PR - CEL Boa Vista – Rua Lodovico Geronazzo, 1910, Boa Vista, Curitiba - PR', 
        'Rua Lodovico Geronazzo, 1910, Boa Vista, Curitiba - PR', 
        '(00) 3333-4444', 
        'contato.dd_boa_vista@danieldias.org.br', 
        '(-49.2319, -25.385)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Boa Vista | PR - CEL Boa Vista – Rua Lodovico Geronazzo, 1910, Boa Vista, Curitiba - PR' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Boqueirão | PR - CEL Boqueirão – Rua Dr. Luiz Losso Filho, s/n, Boqueirão, Curitiba - PR' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Boqueirão | PR - CEL Boqueirão – Rua Dr. Luiz Losso Filho, s/n, Boqueirão, Curitiba - PR', 
        'Rua Dr. Luiz Losso Filho, s/n, Boqueirão, Curitiba - PR', 
        '(00) 3333-4444', 
        'contato.dd_boqueirao@danieldias.org.br', 
        '(-49.2392, -25.5008)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Boqueirão | PR - CEL Boqueirão – Rua Dr. Luiz Losso Filho, s/n, Boqueirão, Curitiba - PR' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Centro | PR - CEL Osvaldo Cruz – Rua Cel. Dulcídio, 950, Centro, Curitiba - PR' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Centro | PR - CEL Osvaldo Cruz – Rua Cel. Dulcídio, 950, Centro, Curitiba - PR', 
        'Rua Cel. Dulcídio, 950, Centro, Curitiba - PR', 
        '(00) 3333-4444', 
        'contato.dd_osvaldo_cruz@danieldias.org.br', 
        '(-49.2783, -25.4386)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Centro | PR - CEL Osvaldo Cruz – Rua Cel. Dulcídio, 950, Centro, Curitiba - PR' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Cajuru | PR - CEL Cajuru – Rua Benedito Herculano de Oliveira, s/n, Cajuru, Curitiba - PR' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Cajuru | PR - CEL Cajuru – Rua Benedito Herculano de Oliveira, s/n, Cajuru, Curitiba - PR', 
        'Rua Benedito Herculano de Oliveira, s/n, Cajuru, Curitiba - PR', 
        '(00) 3333-4444', 
        'contato.dd_cajuru@danieldias.org.br', 
        '(-49.2133, -25.4611)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Cajuru | PR - CEL Cajuru – Rua Benedito Herculano de Oliveira, s/n, Cajuru, Curitiba - PR' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Santa Felicidade | PR - CEL Santa Felicidade – Via Vêneto, 1431, Santa Felicidade, Curitiba - PR' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Santa Felicidade | PR - CEL Santa Felicidade – Via Vêneto, 1431, Santa Felicidade, Curitiba - PR', 
        'Via Vêneto, 1431, Santa Felicidade, Curitiba - PR', 
        '(00) 3333-4444', 
        'contato.dd_santa_felicidade@danieldias.org.br', 
        '(-49.3283, -25.4053)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Santa Felicidade | PR - CEL Santa Felicidade – Via Vêneto, 1431, Santa Felicidade, Curitiba - PR' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Sítio Cercado | PR - Clube da Gente Bairro Novo – Rua Marcolina Caetano Chaves, 150, Sítio Cercado, Curitiba - PR' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Sítio Cercado | PR - Clube da Gente Bairro Novo – Rua Marcolina Caetano Chaves, 150, Sítio Cercado, Curitiba - PR', 
        'Rua Marcolina Caetano Chaves, 150, Sítio Cercado, Curitiba - PR', 
        '(00) 3333-4444', 
        'contato.dd_gente_bairro_novo@danieldias.org.br', 
        '(-49.2743, -25.5532)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Sítio Cercado | PR - Clube da Gente Bairro Novo – Rua Marcolina Caetano Chaves, 150, Sítio Cercado, Curitiba - PR' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'CIC Gente | PR - Clube da Gente CIC – Rua Emílio Romani, s/n, CIC, Curitiba - PR' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'CIC Gente | PR - Clube da Gente CIC – Rua Emílio Romani, s/n, CIC, Curitiba - PR', 
        'Rua Emílio Romani, s/n, CIC, Curitiba - PR', 
        '(00) 3333-4444', 
        'contato.dd_gente_cic@danieldias.org.br', 
        '(-49.35, -25.51)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'CIC Gente | PR - Clube da Gente CIC – Rua Emílio Romani, s/n, CIC, Curitiba - PR' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Valinhos | SP - Praça da Juventude – Rua Geraldo de Gasperi, s/n, Cecap, Valinhos - SP' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Valinhos | SP - Praça da Juventude – Rua Geraldo de Gasperi, s/n, Cecap, Valinhos - SP', 
        'Rua Geraldo de Gasperi, s/n, Cecap, Valinhos - SP', 
        '(00) 3333-4444', 
        'contato.dd_valinhos_juventude@danieldias.org.br', 
        '(-46.9958, -22.9708)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Valinhos | SP - Praça da Juventude – Rua Geraldo de Gasperi, s/n, Cecap, Valinhos - SP' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Valinhos Nardini | SP - Parque Monsenhor Nardini – Rua Dom João VI, s/n, Jardim Planalto, Valinhos - SP' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Valinhos Nardini | SP - Parque Monsenhor Nardini – Rua Dom João VI, s/n, Jardim Planalto, Valinhos - SP', 
        'Rua Dom João VI, s/n, Jardim Planalto, Valinhos - SP', 
        '(00) 3333-4444', 
        'contato.dd_valinhos_nardini@danieldias.org.br', 
        '(-47.005, -22.965)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Valinhos Nardini | SP - Parque Monsenhor Nardini – Rua Dom João VI, s/n, Jardim Planalto, Valinhos - SP' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Atibaia CIEM2 | SP - CIEM 2 – Av. Industrial Walter Kloth, 1135, Jd. Imperial, Atibaia - SP' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Atibaia CIEM2 | SP - CIEM 2 – Av. Industrial Walter Kloth, 1135, Jd. Imperial, Atibaia - SP', 
        'Av. Industrial Walter Kloth, 1135, Jd. Imperial, Atibaia - SP', 
        '(00) 3333-4444', 
        'contato.dd_atibaia_ciem2@danieldias.org.br', 
        '(-46.553, -23.117)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Atibaia CIEM2 | SP - CIEM 2 – Av. Industrial Walter Kloth, 1135, Jd. Imperial, Atibaia - SP' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Atibaia CIEM3 | SP - CIEM 3 – Av. Jerônimo de Camargo, 421, Caetetuba, Atibaia - SP' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Atibaia CIEM3 | SP - CIEM 3 – Av. Jerônimo de Camargo, 421, Caetetuba, Atibaia - SP', 
        'Av. Jerônimo de Camargo, 421, Caetetuba, Atibaia - SP', 
        '(00) 3333-4444', 
        'contato.dd_atibaia_ciem3@danieldias.org.br', 
        '(-46.565, -23.125)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Atibaia CIEM3 | SP - CIEM 3 – Av. Jerônimo de Camargo, 421, Caetetuba, Atibaia - SP' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Atibaia Elefantão | SP - Piscina do Elefantão – Alameda Lucas Nogueira Garcez, s/n, Atibaia - SP' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Atibaia Elefantão | SP - Piscina do Elefantão – Alameda Lucas Nogueira Garcez, s/n, Atibaia - SP', 
        'Alameda Lucas Nogueira Garcez, s/n, Atibaia - SP', 
        '(00) 3333-4444', 
        'contato.dd_atibaia_elefantao@danieldias.org.br', 
        '(-46.55, -23.117)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Atibaia Elefantão | SP - Piscina do Elefantão – Alameda Lucas Nogueira Garcez, s/n, Atibaia - SP' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Ponta Grossa | PR - Arena Multiuso – Av. Visconde de Taunay, 950, Ronda, Ponta Grossa - PR' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Ponta Grossa | PR - Arena Multiuso – Av. Visconde de Taunay, 950, Ronda, Ponta Grossa - PR', 
        'Av. Visconde de Taunay, 950, Ronda, Ponta Grossa - PR', 
        '(00) 3333-4444', 
        'contato.dd_ponta_grossa_arena@danieldias.org.br', 
        '(-50.1619, -25.095)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Ponta Grossa | PR - Arena Multiuso – Av. Visconde de Taunay, 950, Ronda, Ponta Grossa - PR' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Ponta Grossa CECON | PR - CECON (Idoso) – Rua João Cecy Filho, s/n, Nova Rússia, Ponta Grossa - PR' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Ponta Grossa CECON | PR - CECON (Idoso) – Rua João Cecy Filho, s/n, Nova Rússia, Ponta Grossa - PR', 
        'Rua João Cecy Filho, s/n, Nova Rússia, Ponta Grossa - PR', 
        '(00) 3333-4444', 
        'contato.dd_ponta_grossa_cecon@danieldias.org.br', 
        '(-50.17, -25.09)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Ponta Grossa CECON | PR - CECON (Idoso) – Rua João Cecy Filho, s/n, Nova Rússia, Ponta Grossa - PR' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Hortolândia | SP - Complexo Nelson Cancian – Rua João Mendes, 203, Jd. Nova Hortolândia, Hortolândia - SP' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Hortolândia | SP - Complexo Nelson Cancian – Rua João Mendes, 203, Jd. Nova Hortolândia, Hortolândia - SP', 
        'Rua João Mendes, 203, Jd. Nova Hortolândia, Hortolândia - SP', 
        '(00) 3333-4444', 
        'contato.dd_hortolandia@danieldias.org.br', 
        '(-47.22, -22.86)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Hortolândia | SP - Complexo Nelson Cancian – Rua João Mendes, 203, Jd. Nova Hortolândia, Hortolândia - SP' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Jundiaí | SP - CECE Nicolino de Luca (Bolão) – Rua Rodrigo Soares de Oliveira, s/n, Jundiaí - SP' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Jundiaí | SP - CECE Nicolino de Luca (Bolão) – Rua Rodrigo Soares de Oliveira, s/n, Jundiaí - SP', 
        'Rua Rodrigo Soares de Oliveira, s/n, Jundiaí - SP', 
        '(00) 3333-4444', 
        'contato.dd_jundiai@danieldias.org.br', 
        '(-46.8842, -23.1864)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Jundiaí | SP - CECE Nicolino de Luca (Bolão) – Rua Rodrigo Soares de Oliveira, s/n, Jundiaí - SP' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Limeira | SP - Piscina Alberto Savoi – Rua Dr. Roberto Mange, s/n, Jd. Mercedes, Limeira - SP' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Limeira | SP - Piscina Alberto Savoi – Rua Dr. Roberto Mange, s/n, Jd. Mercedes, Limeira - SP', 
        'Rua Dr. Roberto Mange, s/n, Jd. Mercedes, Limeira - SP', 
        '(00) 3333-4444', 
        'contato.dd_limeira@danieldias.org.br', 
        '(-47.4017, -22.565)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Limeira | SP - Piscina Alberto Savoi – Rua Dr. Roberto Mange, s/n, Jd. Mercedes, Limeira - SP' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Extrema | MG - Parque de Eventos – Av. Delegado Waldemar Gomes Pinto, s/n, Extrema - MG' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Extrema | MG - Parque de Eventos – Av. Delegado Waldemar Gomes Pinto, s/n, Extrema - MG', 
        'Av. Delegado Waldemar Gomes Pinto, s/n, Extrema - MG', 
        '(00) 3333-4444', 
        'contato.dd_extrema@danieldias.org.br', 
        '(-46.3178, -22.855)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Extrema | MG - Parque de Eventos – Av. Delegado Waldemar Gomes Pinto, s/n, Extrema - MG' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Pindoretama | CE - Ginásio Poliesportivo – Centro da Cidade, Pindoretama - CE' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Pindoretama | CE - Ginásio Poliesportivo – Centro da Cidade, Pindoretama - CE', 
        'Centro da Cidade, Pindoretama - CE', 
        '(00) 3333-4444', 
        'contato.dd_pindoretama@danieldias.org.br', 
        '(-38.305, -4.0142)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Pindoretama | CE - Ginásio Poliesportivo – Centro da Cidade, Pindoretama - CE' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Pacajus | CE - Estádio/Ginásio Municipal – Rua Tabelião José de Lima, s/n, Pacajus - CE' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Pacajus | CE - Estádio/Ginásio Municipal – Rua Tabelião José de Lima, s/n, Pacajus - CE', 
        'Rua Tabelião José de Lima, s/n, Pacajus - CE', 
        '(00) 3333-4444', 
        'contato.dd_pacajus@danieldias.org.br', 
        '(-38.4617, -4.1722)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Pacajus | CE - Estádio/Ginásio Municipal – Rua Tabelião José de Lima, s/n, Pacajus - CE' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Canaã dos Carajás | PA - Polo de Natação Municipal – Av. Weyne Cavalcante, s/n, Canaã dos Carajás - PA' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Canaã dos Carajás | PA - Polo de Natação Municipal – Av. Weyne Cavalcante, s/n, Canaã dos Carajás - PA', 
        'Av. Weyne Cavalcante, s/n, Canaã dos Carajás - PA', 
        '(00) 3333-4444', 
        'contato.dd_canaa@danieldias.org.br', 
        '(-49.8783, -6.4967)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Canaã dos Carajás | PA - Polo de Natação Municipal – Av. Weyne Cavalcante, s/n, Canaã dos Carajás - PA' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_dd IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Belo Jardim | PE - SESC Belo Jardim (Parceria) – Rua Pedro Rocha, s/n, Centro, Belo Jardim - PE' AND project_id = v_proj_dd) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_dd, 
        'Belo Jardim | PE - SESC Belo Jardim (Parceria) – Rua Pedro Rocha, s/n, Centro, Belo Jardim - PE', 
        'Rua Pedro Rocha, s/n, Centro, Belo Jardim - PE', 
        '(00) 3333-4444', 
        'contato.dd_belo_jardim@danieldias.org.br', 
        '(-36.4244, -8.3361)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Belo Jardim | PE - SESC Belo Jardim (Parceria) – Rua Pedro Rocha, s/n, Centro, Belo Jardim - PE' AND project_id = v_proj_dd;
    END IF;
  END IF;

  IF v_proj_fut IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Maracanaú | CE - Sede Maracanaú, Maracanaú - CE' AND project_id = v_proj_fut) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fut, 
        'Maracanaú | CE - Sede Maracanaú, Maracanaú - CE', 
        'Endereço não cadastrado', 
        '(00) 3333-4444', 
        'contato.fut_maracanau@futebol.org.br', 
        '(-38.6256, -3.8744)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Maracanaú | CE - Sede Maracanaú, Maracanaú - CE' AND project_id = v_proj_fut;
    END IF;
  END IF;

  IF v_proj_fut IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Caucaia | CE - Sede Caucaia, Caucaia - CE' AND project_id = v_proj_fut) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fut, 
        'Caucaia | CE - Sede Caucaia, Caucaia - CE', 
        'Endereço não cadastrado', 
        '(00) 3333-4444', 
        'contato.fut_caucaia@futebol.org.br', 
        '(-38.6533, -3.7375)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Caucaia | CE - Sede Caucaia, Caucaia - CE' AND project_id = v_proj_fut;
    END IF;
  END IF;

  IF v_proj_fut IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Pacajus | CE - Sede Pacajus, Pacajus - CE' AND project_id = v_proj_fut) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fut, 
        'Pacajus | CE - Sede Pacajus, Pacajus - CE', 
        'Endereço não cadastrado', 
        '(00) 3333-4444', 
        'contato.fut_pacajus@futebol.org.br', 
        '(-38.4617, -4.1722)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Pacajus | CE - Sede Pacajus, Pacajus - CE' AND project_id = v_proj_fut;
    END IF;
  END IF;

  IF v_proj_fut IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Itaitinga | CE - Sede Itaitinga, Itaitinga - CE' AND project_id = v_proj_fut) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fut, 
        'Itaitinga | CE - Sede Itaitinga, Itaitinga - CE', 
        'Endereço não cadastrado', 
        '(00) 3333-4444', 
        'contato.fut_itaitinga@futebol.org.br', 
        '(-38.5278, -3.9667)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Itaitinga | CE - Sede Itaitinga, Itaitinga - CE' AND project_id = v_proj_fut;
    END IF;
  END IF;

  IF v_proj_fut IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM nucleos WHERE nome = 'Maranguape | CE - Sede Maranguape, Maranguape - CE' AND project_id = v_proj_fut) THEN
      INSERT INTO nucleos (project_id, nome, address, phone, email, coordinates, dias_aulas, horario_aulas)
      VALUES (
        v_proj_fut, 
        'Maranguape | CE - Sede Maranguape, Maranguape - CE', 
        'Endereço não cadastrado', 
        '(00) 3333-4444', 
        'contato.fut_maranguape@futebol.org.br', 
        '(-38.6836, -3.8914)',
        NULL,
        NULL
      );
    ELSE
      -- Atualiza dias e horarios caso o nucleo ja exista
      UPDATE nucleos SET 
        dias_aulas = COALESCE(NULL, dias_aulas),
        horario_aulas = COALESCE(NULL, horario_aulas)
      WHERE nome = 'Maranguape | CE - Sede Maranguape, Maranguape - CE' AND project_id = v_proj_fut;
    END IF;
  END IF;

END $$;
