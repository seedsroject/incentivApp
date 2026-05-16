#!/usr/bin/env python3
"""
Seed: 2 alunos completos por núcleo (61 núcleos × 2 = 122 alunos)
Dados realistas brasileiros com nomes, CPF, endereço, escola, etc.
"""
import json, random, urllib.request

SRK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdHdnaWZ2cW5ybHdndXZiZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk1Nzc4OSwiZXhwIjoyMDk0NTMzNzg5fQ.yU6MtrwLlun8GMSmgDqFk6JwRAlqu0_MaK0dINd7__o"
URL = "https://vptwgifvqnrlwguvbdtf.supabase.co"

# Nomes brasileiros realistas
NOMES_M = ["João", "Pedro", "Lucas", "Gabriel", "Matheus", "Rafael", "Gustavo", "Felipe", "Arthur", "Enzo",
           "Davi", "Bernardo", "Thiago", "Nicolas", "Caio", "Henrique", "Samuel", "Leonardo", "Vinícius", "Bruno",
           "Miguel", "Daniel", "Igor", "Eduardo", "Murilo", "Guilherme", "Diego", "André", "Renan", "Luan"]
NOMES_F = ["Ana", "Maria", "Beatriz", "Laura", "Isabela", "Sophia", "Valentina", "Júlia", "Helena", "Alice",
           "Luana", "Amanda", "Camila", "Letícia", "Bianca", "Fernanda", "Larissa", "Natália", "Rafaela", "Vitória",
           "Mariana", "Gabriela", "Yasmin", "Clara", "Emilly", "Lorena", "Bruna", "Débora", "Jéssica", "Raquel"]
SOBRENOMES = ["Silva", "Santos", "Oliveira", "Souza", "Pereira", "Lima", "Almeida", "Ferreira", "Rodrigues",
              "Costa", "Martins", "Araújo", "Gomes", "Ribeiro", "Carvalho", "Nascimento", "Barbosa", "Rocha",
              "Moreira", "Freitas", "Monteiro", "Tavares", "Nunes", "Mendes", "Borges", "Lopes", "Dias", "Machado"]
ESCOLAS_PUB = ["Escola Estadual Monteiro Lobato", "EMEF Paulo Freire", "Escola Municipal Padre Anchieta",
               "Colégio Estadual Rui Barbosa", "EMEF Machado de Assis", "Escola Estadual Castro Alves",
               "EMEF Cecília Meireles", "Escola Municipal Olavo Bilac", "Colégio Estadual Dom Pedro II"]
ESCOLAS_PART = ["Colégio Santa Cruz", "Instituto Educacional Adonai", "Colégio Positivo", "Escola Adventista",
                "Colégio São José", "Instituto Sagrada Família"]
RUAS = ["Rua das Flores", "Av. Brasil", "Rua dos Lírios", "Rua São Paulo", "Av. Getúlio Vargas",
        "Rua Marechal Deodoro", "Rua 7 de Setembro", "Av. Santos Dumont", "Rua da Paz", "Rua José Bonifácio"]
BAIRROS = ["Centro", "Vila Nova", "Jardim América", "Bairro da Paz", "Novo Horizonte", "Santo Antônio",
           "São José", "Boa Vista", "Jardim das Oliveiras", "Parque Industrial"]

def gen_cpf():
    n = [random.randint(0,9) for _ in range(9)]
    for _ in range(2):
        v = sum((len(n)+1-i)*n[i] for i in range(len(n))) % 11
        n.append(0 if v < 2 else 11 - v)
    return f"{n[0]}{n[1]}{n[2]}.{n[3]}{n[4]}{n[5]}.{n[6]}{n[7]}{n[8]}-{n[9]}{n[10]}"

def gen_phone():
    return f"({random.randint(11,99):02d}) 9{random.randint(1000,9999)}-{random.randint(1000,9999)}"

def gen_date(y_min=2010, y_max=2015):
    return f"{random.randint(y_min,y_max)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"

def gen_student(project_id, nucleo_id, nucleo_city, idx):
    is_male = idx == 0
    nome = random.choice(NOMES_M if is_male else NOMES_F)
    sobrenome1 = random.choice(SOBRENOMES)
    sobrenome2 = random.choice(SOBRENOMES)
    full_name = f"{nome} {sobrenome1} {sobrenome2}"
    
    is_pub = random.random() < 0.7
    escola = random.choice(ESCOLAS_PUB if is_pub else ESCOLAS_PART)
    
    resp_nome = f"{random.choice(NOMES_F if is_male else NOMES_M)} {sobrenome1}"
    
    city_parts = (nucleo_city or "Cidade/XX").split("/")
    cidade = city_parts[0] if len(city_parts) > 0 else "Cidade"
    estado = city_parts[1] if len(city_parts) > 1 else "XX"
    
    return {
        "project_id": project_id,
        "nucleo_id": nucleo_id,
        "nome": full_name,
        "data_nascimento": gen_date(),
        "rg_cpf": gen_cpf(),
        "nome_responsavel": resp_nome,
        "endereco": f"{random.choice(RUAS)}, {random.randint(1,2000)}, {random.choice(BAIRROS)}, {cidade} - {estado}",
        "telefone": gen_phone(),
        "email_contato": f"{nome.lower()}.{sobrenome1.lower()}@email.com",
        "escola_nome": escola,
        "escola_tipo": "PUBLICA" if is_pub else "PARTICULAR",
        "n_sli": f"SLI-2026-{random.randint(1000,9999)}",
        "nome_projeto": "Formando Campeões",
        "proponente": "Instituto Vida Ativa",
        "nome_responsavel_organizacao": "Carlos Eduardo",
        "status": "ATIVO",
        "materiais_pendentes": random.choice([True, False]),
        "portador_necessidade_especial": random.random() < 0.05,
    }

def api_get(path):
    req = urllib.request.Request(f"{URL}/rest/v1/{path}",
        headers={"apikey": SRK, "Authorization": f"Bearer {SRK}"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def api_post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{URL}/rest/v1/{path}", data=body, method="POST",
        headers={"apikey": SRK, "Authorization": f"Bearer {SRK}",
                 "Content-Type": "application/json", "Prefer": "return=minimal"})
    with urllib.request.urlopen(req) as r:
        return r.status

# Main
print("Buscando núcleos...")
nucleos = api_get("nucleos?select=id,nome,project_id,city&order=nome")
print(f"  {len(nucleos)} núcleos encontrados")

students = []
for n in nucleos:
    for i in range(2):
        students.append(gen_student(n["project_id"], n["id"], n.get("city"), i))

print(f"Inserindo {len(students)} alunos...")

# Insert em batches de 50
batch_size = 50
for i in range(0, len(students), batch_size):
    batch = students[i:i+batch_size]
    status = api_post("students", batch)
    print(f"  Batch {i//batch_size + 1}: {status} ({len(batch)} alunos)")

print(f"\n✅ Seed completo: {len(students)} alunos inseridos ({len(nucleos)} núcleos × 2)")
