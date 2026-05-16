#!/bin/bash
# Seed: 2 alunos por núcleo via curl (bypasses SSL issues with Python)

SRK="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdHdnaWZ2cW5ybHdndXZiZHRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODk1Nzc4OSwiZXhwIjoyMDk0NTMzNzg5fQ.yU6MtrwLlun8GMSmgDqFk6JwRAlqu0_MaK0dINd7__o"
URL="https://vptwgifvqnrlwguvbdtf.supabase.co"

echo "Buscando núcleos..."
NUCLEOS=$(curl -s "$URL/rest/v1/nucleos?select=id,nome,project_id,city&order=nome" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK")

echo "Gerando alunos..."

# Arrays de nomes
NOMES_M=("João" "Pedro" "Lucas" "Gabriel" "Matheus" "Rafael" "Gustavo" "Felipe" "Arthur" "Enzo" "Davi" "Bernardo" "Thiago" "Nicolas" "Caio" "Henrique" "Samuel" "Leonardo" "Vinícius" "Bruno" "Miguel" "Daniel" "Igor" "Eduardo" "Murilo" "Guilherme" "Diego" "André" "Renan" "Luan")
NOMES_F=("Ana" "Maria" "Beatriz" "Laura" "Isabela" "Sophia" "Valentina" "Júlia" "Helena" "Alice" "Luana" "Amanda" "Camila" "Letícia" "Bianca" "Fernanda" "Larissa" "Natália" "Rafaela" "Vitória" "Mariana" "Gabriela" "Yasmin" "Clara" "Emilly" "Lorena" "Bruna" "Débora" "Jéssica" "Raquel")
SOBRENOMES=("Silva" "Santos" "Oliveira" "Souza" "Pereira" "Lima" "Almeida" "Ferreira" "Rodrigues" "Costa" "Martins" "Araújo" "Gomes" "Ribeiro" "Carvalho" "Nascimento" "Barbosa" "Rocha" "Moreira" "Freitas")
ESCOLAS=("Escola Estadual Monteiro Lobato" "EMEF Paulo Freire" "Escola Municipal Padre Anchieta" "Colégio Estadual Rui Barbosa" "EMEF Machado de Assis" "Escola Estadual Castro Alves" "EMEF Cecília Meireles" "Escola Municipal Olavo Bilac")
RUAS=("Rua das Flores" "Av. Brasil" "Rua dos Lírios" "Rua São Paulo" "Av. Getúlio Vargas" "Rua Marechal Deodoro" "Rua 7 de Setembro" "Av. Santos Dumont")

# Build all students JSON using python (it's just string processing, no network)
STUDENTS_JSON=$(echo "$NUCLEOS" | python3 -c "
import json, sys, random
nucleos = json.load(sys.stdin)
nomes_m = ['João','Pedro','Lucas','Gabriel','Matheus','Rafael','Gustavo','Felipe','Arthur','Enzo','Davi','Bernardo','Thiago','Nicolas','Caio','Henrique','Samuel','Leonardo','Vinícius','Bruno','Miguel','Daniel','Igor','Eduardo','Murilo','Guilherme','Diego','André','Renan','Luan']
nomes_f = ['Ana','Maria','Beatriz','Laura','Isabela','Sophia','Valentina','Júlia','Helena','Alice','Luana','Amanda','Camila','Letícia','Bianca','Fernanda','Larissa','Natália','Rafaela','Vitória','Mariana','Gabriela','Yasmin','Clara','Emilly','Lorena','Bruna','Débora','Jéssica','Raquel']
sobrenomes = ['Silva','Santos','Oliveira','Souza','Pereira','Lima','Almeida','Ferreira','Rodrigues','Costa','Martins','Araújo','Gomes','Ribeiro','Carvalho','Nascimento','Barbosa','Rocha','Moreira','Freitas']
escolas = ['Escola Estadual Monteiro Lobato','EMEF Paulo Freire','Escola Municipal Padre Anchieta','Colégio Estadual Rui Barbosa','EMEF Machado de Assis','Escola Estadual Castro Alves','EMEF Cecília Meireles','Escola Municipal Olavo Bilac']
ruas = ['Rua das Flores','Av. Brasil','Rua dos Lírios','Rua São Paulo','Av. Getúlio Vargas','Rua Marechal Deodoro','Rua 7 de Setembro','Av. Santos Dumont']
bairros = ['Centro','Vila Nova','Jardim América','Bairro da Paz','Novo Horizonte','Santo Antônio','São José','Boa Vista']

def cpf():
    n=[random.randint(0,9) for _ in range(9)]
    for _ in range(2):
        v=sum((len(n)+1-i)*n[i] for i in range(len(n)))%11
        n.append(0 if v<2 else 11-v)
    return f'{n[0]}{n[1]}{n[2]}.{n[3]}{n[4]}{n[5]}.{n[6]}{n[7]}{n[8]}-{n[9]}{n[10]}'

students = []
for n in nucleos:
    city = (n.get('city') or 'Cidade/XX').split('/')
    cidade = city[0] if city else 'Cidade'
    estado = city[1] if len(city)>1 else 'XX'
    for i in range(2):
        nm = random.choice(nomes_m if i==0 else nomes_f)
        s1, s2 = random.choice(sobrenomes), random.choice(sobrenomes)
        resp = random.choice(nomes_f if i==0 else nomes_m)
        students.append({
            'project_id': n['project_id'],
            'nucleo_id': n['id'],
            'nome': f'{nm} {s1} {s2}',
            'data_nascimento': f'{random.randint(2010,2015)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}',
            'rg_cpf': cpf(),
            'nome_responsavel': f'{resp} {s1}',
            'endereco': f'{random.choice(ruas)}, {random.randint(1,2000)}, {random.choice(bairros)}, {cidade} - {estado}',
            'telefone': f'({random.randint(11,99):02d}) 9{random.randint(1000,9999)}-{random.randint(1000,9999)}',
            'email_contato': f'{nm.lower()}.{s1.lower()}@email.com',
            'escola_nome': random.choice(escolas),
            'escola_tipo': 'PUBLICA',
            'n_sli': f'SLI-2026-{random.randint(1000,9999)}',
            'nome_projeto': 'Formando Campeões',
            'proponente': 'Instituto Vida Ativa',
            'nome_responsavel_organizacao': 'Carlos Eduardo',
            'status': 'ATIVO',
            'materiais_pendentes': random.choice([True, False]),
            'portador_necessidade_especial': False,
        })
print(json.dumps(students))
")

echo "Inserindo alunos..."
echo "$STUDENTS_JSON" | curl -s -o /dev/null -w "HTTP %{http_code}" \
  "$URL/rest/v1/students" \
  -H "apikey: $SRK" \
  -H "Authorization: Bearer $SRK" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d @-

echo ""
echo "Verificando contagem..."
curl -s "$URL/rest/v1/students?select=id" \
  -H "apikey: $SRK" -H "Authorization: Bearer $SRK" \
  -H "Prefer: count=exact" -I 2>&1 | grep -i content-range

echo "✅ Seed completo!"
