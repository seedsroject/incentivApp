-- ============================================================
-- SEED: NÚCLEOS DOS 3 PROJETOS  
-- Executar APÓS o schema principal (001_schema_fase1.sql)
-- ============================================================

-- Helper: Buscar project IDs
DO $$
DECLARE
  v_triathlon UUID;
  v_daniel UUID;
  v_futebol UUID;
BEGIN
  SELECT id INTO v_triathlon FROM projects WHERE slug = 'FORMANDO_CAMPEOES';
  SELECT id INTO v_daniel FROM projects WHERE slug = 'DANIEL_DIAS';
  SELECT id INTO v_futebol FROM projects WHERE slug = 'FUTEBOL';

  -- ============================================================
  -- TRIATHLON (33 núcleos)
  -- ============================================================
  INSERT INTO nucleos (project_id, nome, address, coordinates, city) VALUES
    (v_triathlon, 'Ilhéus', 'CEEP do Chocolate – Av. Antônio Carlos Magalhães, nº 755, Ilhéus - BA', POINT(-39.048333, -14.788889), 'Ilhéus/BA'),
    (v_triathlon, 'Aquiraz', 'Sec. de Esporte – Av. Airton Sena, Vila da Prata, Aquiraz - CE', POINT(-38.3925, -3.9186), 'Aquiraz/CE'),
    (v_triathlon, 'Aracati', 'Colégio EEFTI Prof Onélio Porto – Rua Padre Pachêco, 147, Aracati - CE', POINT(-37.7697, -4.5617), 'Aracati/CE'),
    (v_triathlon, 'Cascavel', 'Centro Comunitário do Coqueiro – Sítio Coqueiro, S/N, Guanacés, Cascavel - CE', POINT(-38.2417, -4.1283), 'Cascavel/CE'),
    (v_triathlon, 'Caucaia', 'Centro Municipal de Formação e Avaliação, Av. Juaci Sampaio Pontes, s/n, Caucaia - CE', POINT(-38.6533, -3.7375), 'Caucaia/CE'),
    (v_triathlon, 'Fortaleza', 'Atitude Atletas - Bairro Pirambu, Praia de Pirambu, Fortaleza - CE', POINT(-38.56, -3.715), 'Fortaleza/CE'),
    (v_triathlon, 'Horizonte', 'Rua Moreira da Silva, nº 90 (Rua 13), Diadema, Horizonte - CE', POINT(-38.4833, -4.1), 'Horizonte/CE'),
    (v_triathlon, 'Maracanaú', 'Instituto Lucimário Caitano – Av. Central, 120, Novo Oriente, Maracanaú - CE', POINT(-38.6256, -3.8744), 'Maracanaú/CE'),
    (v_triathlon, 'Pecém', 'Rua Professor José Denilson, São Gonçalo do Amarante - CE', POINT(-38.8258, -3.5433), 'São Gonçalo do Amarante/CE'),
    (v_triathlon, 'Ceilândia', 'C.O.P. Parque da Vaquejada – QNP 21, AE, Sol Nascente, Ceilândia - DF', POINT(-48.1158, -15.8203), 'Ceilândia/DF'),
    (v_triathlon, 'Vila Velha', 'UMEF Vila Olímpica – Rua Almirante Tamandaré, nº 1, Soteco, Vila Velha - ES', POINT(-40.2925, -20.3297), 'Vila Velha/ES'),
    (v_triathlon, 'Vitória', 'Clube ACS – Rua Alvin Borges da Silva, nº 42, Jardim Camburi, Vitória - ES', POINT(-40.2844, -20.2589), 'Vitória/ES'),
    (v_triathlon, 'Goiânia', 'Praça de Esporte Pedro Ludovico – Rua 1015, Setor Pedro Ludovico, Goiânia - GO', POINT(-49.25, -16.7), 'Goiânia/GO'),
    (v_triathlon, 'Parauapebas', 'Usina da Paz – Avenida D, Quadra, nº 101, Jardim Tropical, Parauapebas - PA', POINT(-49.9, -6.0667), 'Parauapebas/PA'),
    (v_triathlon, 'Camaragibe', 'CT Pr1me – Av. Dr. Belmino Correia, nº 144, Novo do Carmelo, Camaragibe - PE', POINT(-34.9786, -8.0208), 'Camaragibe/PE'),
    (v_triathlon, 'CPM Curitiba', 'Colégio da Polícia Militar - Rua José Ferreira Pinheiro, nº 349, Bairro Portão, Curitiba - PR', POINT(-49.2889, -25.4667), 'Curitiba/PR'),
    (v_triathlon, 'Bairro Novo', 'Rua Marcolina Caetana Chaves, nº 150, Curitiba - PR', POINT(-49.2743, -25.5532), 'Curitiba/PR'),
    (v_triathlon, 'Boa Vista', 'Rua Joaquim da Costa Ribeiro, nº 319, Curitiba - PR', POINT(-49.2319, -25.385), 'Curitiba/PR'),
    (v_triathlon, 'Boqueirão', 'Rua Pastor Antonio Polito, nº 2200, Curitiba - PR', POINT(-49.2392, -25.5008), 'Curitiba/PR'),
    (v_triathlon, 'Cajuru', 'Rua João Henrique Hoffman, nº 125, Curitiba - PR', POINT(-49.2133, -25.4611), 'Curitiba/PR'),
    (v_triathlon, 'CIC', 'Rua Hilda Cadilhe de Oliveira, s/n, Curitiba - PR', POINT(-49.3333, -25.4925), 'Curitiba/PR'),
    (v_triathlon, 'Oswaldo Cruz', 'Praça Oswaldo Cruz, Rua Brigadeiro Franco, s/n°, Curitiba - PR', POINT(-49.2783, -25.4386), 'Curitiba/PR'),
    (v_triathlon, 'Santa Felicidade', 'Rua Daniel Cesario Pereira, nº 681, Curitiba - PR', POINT(-49.3283, -25.4053), 'Curitiba/PR'),
    (v_triathlon, 'Tatuquara', 'Rua Evelázio Augusto Bley, nº 151, Curitiba - PR', POINT(-49.3242, -25.5683), 'Curitiba/PR'),
    (v_triathlon, 'Matinhos', 'UFPR Litoral – Rua Jaguariaíva, nº 512, Matinhos - PR', POINT(-48.5428, -25.8175), 'Matinhos/PR'),
    (v_triathlon, 'Paranaguá', 'Complexo Olímpico Nereu Gouvêa – Rua Um, Ponta do Caju, Paranaguá - PR', POINT(-48.5092, -25.5203), 'Paranaguá/PR'),
    (v_triathlon, 'São José dos Pinhais', 'Centro da Juventude – Rua Leôncio Corrêa, nº 311, Roseira, S.J. Pinhais - PR', POINT(-49.2064, -25.5347), 'São José dos Pinhais/PR'),
    (v_triathlon, 'Joinville', 'Univille – Rua Paulo Malschitzki, nº 10, Joinville - SC', POINT(-48.8489, -26.3031), 'Joinville/SC'),
    (v_triathlon, 'Laranjeiras', 'Clube Rec. Antônio Carlos Franco – Rua Propriá, 182, Centro, Laranjeiras - SE', POINT(-37.1722, -10.8061), 'Laranjeiras/SE'),
    (v_triathlon, 'Campinas', 'Lagoa Taquaral – Av. Dr. Heitor Penteado, 1671, Campinas - SP', POINT(-47.0506, -22.8681), 'Campinas/SP'),
    (v_triathlon, 'Itu', 'C. Aquático Fiori Marcello Amantéa – Praça Washington Luiz, s/nº, Itu - SP', POINT(-47.3, -23.2667), 'Itu/SP'),
    (v_triathlon, 'Jundiaí', 'CECE Dr. Nicolino de Luca (Bolão) – Rua Rodrigo Soares de Oliveira, s/n, Jundiaí - SP', POINT(-46.8842, -23.1864), 'Jundiaí/SP'),
    (v_triathlon, 'Ribeirão Preto', 'Ginásio Cava do Bosque – Rua Camilo de Mattos, nº 627, Rib. Preto - SP', POINT(-47.8103, -21.1775), 'Ribeirão Preto/SP');

  -- ============================================================
  -- DANIEL DIAS (23 núcleos)
  -- ============================================================
  INSERT INTO nucleos (project_id, nome, address, coordinates, city) VALUES
    (v_daniel, 'CIC', 'CEL Bairro CIC – Rua Pedro Gusso, 2447, Cidade Industrial, Curitiba - PR', POINT(-49.3450, -25.4925), 'Curitiba/PR'),
    (v_daniel, 'Boa Vista', 'CEL Boa Vista – Rua Lodovico Geronazzo, 1910, Boa Vista, Curitiba - PR', POINT(-49.2319, -25.3850), 'Curitiba/PR'),
    (v_daniel, 'Boqueirão', 'CEL Boqueirão – Rua Dr. Luiz Losso Filho, s/n, Boqueirão, Curitiba - PR', POINT(-49.2392, -25.5008), 'Curitiba/PR'),
    (v_daniel, 'Centro', 'CEL Osvaldo Cruz – Rua Cel. Dulcídio, 950, Centro, Curitiba - PR', POINT(-49.2783, -25.4386), 'Curitiba/PR'),
    (v_daniel, 'Cajuru', 'CEL Cajuru – Rua Benedito Herculano de Oliveira, s/n, Cajuru, Curitiba - PR', POINT(-49.2133, -25.4611), 'Curitiba/PR'),
    (v_daniel, 'Santa Felicidade', 'CEL Santa Felicidade – Via Vêneto, 1431, Santa Felicidade, Curitiba - PR', POINT(-49.3283, -25.4053), 'Curitiba/PR'),
    (v_daniel, 'Sítio Cercado', 'Clube da Gente Bairro Novo – Rua Marcolina Caetano Chaves, 150, Sítio Cercado, Curitiba - PR', POINT(-49.2743, -25.5532), 'Curitiba/PR'),
    (v_daniel, 'CIC Gente', 'Clube da Gente CIC – Rua Emílio Romani, s/n, CIC, Curitiba - PR', POINT(-49.3500, -25.5100), 'Curitiba/PR'),
    (v_daniel, 'Valinhos Juventude', 'Praça da Juventude – Rua Geraldo de Gasperi, s/n, Cecap, Valinhos - SP', POINT(-46.9958, -22.9708), 'Valinhos/SP'),
    (v_daniel, 'Valinhos Nardini', 'Parque Monsenhor Nardini – Rua Dom João VI, s/n, Jardim Planalto, Valinhos - SP', POINT(-47.0050, -22.9650), 'Valinhos/SP'),
    (v_daniel, 'Atibaia CIEM2', 'CIEM 2 – Av. Industrial Walter Kloth, 1135, Jd. Imperial, Atibaia - SP', POINT(-46.5530, -23.1170), 'Atibaia/SP'),
    (v_daniel, 'Atibaia CIEM3', 'CIEM 3 – Av. Jerônimo de Camargo, 421, Caetetuba, Atibaia - SP', POINT(-46.5650, -23.1250), 'Atibaia/SP'),
    (v_daniel, 'Atibaia Elefantão', 'Piscina do Elefantão – Alameda Lucas Nogueira Garcez, s/n, Atibaia - SP', POINT(-46.5500, -23.1170), 'Atibaia/SP'),
    (v_daniel, 'Ponta Grossa Arena', 'Arena Multiuso – Av. Visconde de Taunay, 950, Ronda, Ponta Grossa - PR', POINT(-50.1619, -25.0950), 'Ponta Grossa/PR'),
    (v_daniel, 'Ponta Grossa CECON', 'CECON (Idoso) – Rua João Cecy Filho, s/n, Nova Rússia, Ponta Grossa - PR', POINT(-50.1700, -25.0900), 'Ponta Grossa/PR'),
    (v_daniel, 'Hortolândia', 'Complexo Nelson Cancian – Rua João Mendes, 203, Jd. Nova Hortolândia, Hortolândia - SP', POINT(-47.2200, -22.8600), 'Hortolândia/SP'),
    (v_daniel, 'Jundiaí', 'CECE Nicolino de Luca (Bolão) – Rua Rodrigo Soares de Oliveira, s/n, Jundiaí - SP', POINT(-46.8842, -23.1864), 'Jundiaí/SP'),
    (v_daniel, 'Limeira', 'Piscina Alberto Savoi – Rua Dr. Roberto Mange, s/n, Jd. Mercedes, Limeira - SP', POINT(-47.4017, -22.5650), 'Limeira/SP'),
    (v_daniel, 'Extrema', 'Parque de Eventos – Av. Delegado Waldemar Gomes Pinto, s/n, Extrema - MG', POINT(-46.3178, -22.8550), 'Extrema/MG'),
    (v_daniel, 'Pindoretama', 'Ginásio Poliesportivo – Centro da Cidade, Pindoretama - CE', POINT(-38.3050, -4.0142), 'Pindoretama/CE'),
    (v_daniel, 'Pacajus', 'Estádio/Ginásio Municipal – Rua Tabelião José de Lima, s/n, Pacajus - CE', POINT(-38.4617, -4.1722), 'Pacajus/CE'),
    (v_daniel, 'Canaã dos Carajás', 'Polo de Natação Municipal – Av. Weyne Cavalcante, s/n, Canaã dos Carajás - PA', POINT(-49.8783, -6.4967), 'Canaã dos Carajás/PA'),
    (v_daniel, 'Belo Jardim', 'SESC Belo Jardim (Parceria) – Rua Pedro Rocha, s/n, Centro, Belo Jardim - PE', POINT(-36.4244, -8.3361), 'Belo Jardim/PE');

  -- ============================================================
  -- FUTEBOL (5 núcleos)
  -- ============================================================
  INSERT INTO nucleos (project_id, nome, address, coordinates, city) VALUES
    (v_futebol, 'Maracanaú', 'Sede Maracanaú, Maracanaú - CE', POINT(-38.6256, -3.8744), 'Maracanaú/CE'),
    (v_futebol, 'Caucaia', 'Sede Caucaia, Caucaia - CE', POINT(-38.6533, -3.7375), 'Caucaia/CE'),
    (v_futebol, 'Pacajus', 'Sede Pacajus, Pacajus - CE', POINT(-38.4617, -4.1722), 'Pacajus/CE'),
    (v_futebol, 'Itaitinga', 'Sede Itaitinga, Itaitinga - CE', POINT(-38.5278, -3.9667), 'Itaitinga/CE'),
    (v_futebol, 'Maranguape', 'Sede Maranguape, Maranguape - CE', POINT(-38.6836, -3.8914), 'Maranguape/CE');

  RAISE NOTICE 'Seed completo: 33 Triathlon + 23 Daniel Dias + 5 Futebol = 61 núcleos';
END$$;
