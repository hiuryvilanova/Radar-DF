# --- populate_demands.py ---
import datetime
import random
import sys
import os

# Adjust path to find the 'app' module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.models import User, City, Theme, Subtheme, Demand, Meeting, MeetingParticipant, Attendance, Action

def populate_data():
    db = SessionLocal()
    # 1. Get existing objects
    cities = db.query(City).all()
    themes = db.query(Theme).all()
    users = db.query(User).all()
    
    if not cities or not themes or not users:
        print("Database structure is empty. Please run uvicorn first to auto-generate basic structures.")
        db.close()
        return
        
    admin_user = db.query(User).filter(User.role_id == 1).first()
    if not admin_user:
        admin_user = users[0]
        
    print(f"Using Admin user: {admin_user.email} (ID: {admin_user.id})")
    print(f"Found {len(cities)} cities and {len(themes)} themes.")
    
    # 2. Clear existing demands, meetings, attendances, actions to prevent duplicates
    print("Clearing existing transaction tables...")
    db.query(Action).delete()
    db.query(Attendance).delete()
    db.query(MeetingParticipant).delete()
    db.query(Meeting).delete()
    db.query(Demand).delete()
    db.commit()
    print("Cleared existing demands, meetings, attendances, and actions.")
    
    # Seed random for reproducibility
    random.seed(42)

    # 3. Generate 120 Demands
    sources = ["Ouvidoria", "Ofício", "Reunião de Líderes", "WhatsApp", "Visita Local", "Indicação Parlamentar"]
    priorities = ["Baixa", "Média", "Alta", "Urgente", "Crítica"]
    statuses = ["Nova", "Em análise", "Encaminhada", "Em andamento", "Concluída"]
    
    requester_names = [
        "Maria Silva", "João Santos", "José Oliveira", "Ana Souza", "Carlos Lima",
        "Paulo Ferreira", "Lucas Rodrigues", "Marcos Costa", "Luiz Carvalho", "Antônio Gomes",
        "Francisca Rocha", "Adriana Costa", "Juliana Martins", "Patrícia Alves", "Aline Pereira"
    ]
    
    neighborhoods = {
        "Brasília": ["Asa Norte", "Asa Sul", "Vila Planalto", "Noroeste"],
        "Ceilândia": ["P Norte", "P Sul", "Setor O", "Ceilândia Centro", "Guariroba"],
        "Taguatinga": ["Taguatinga Norte", "Taguatinga Sul", "Setor D", "M Norte"],
        "Samambaia": ["Samambaia Norte", "Samambaia Sul"],
        "Planaltina": ["Arapoanga", "Setor Residencial East", "Vale do Amanhecer"],
        "Gama": ["Gama Leste", "Gama Oeste", "Setor Industrial"],
        "Santa Maria": ["Santa Maria Norte", "Santa Maria Sul"],
        "Recanto das Emas": ["Recanto Centro", "Setor de Mansões"],
        "Sobradinho": ["Sobradinho I", "Sobradinho II", "Setor de Mansões Sobradinho"]
    }
    
    # Realistic template details per theme
    theme_templates = {
        "Saúde": {
            "titles": ["Falta de pediatra no posto de saúde", "Falta de medicamentos de uso contínuo", "Fila excessiva para marcação de exames", "Necessidade de reforma da UBS"],
            "descriptions": ["Moradores relatam que não há pediatra de plantão na UBS.", "Pacientes com doenças crônicas reclamam da falta de medicamentos essenciais.", "O tempo de espera para agendamento de exames laboratoriais passa de 3 meses.", "A UBS local apresenta goteiras e falta de ar condicionado na sala de espera."]
        },
        "Educação": {
            "titles": ["Dificuldade no transporte escolar rural", "Falta de vagas em creche pública", "Manutenção urgente da quadra da escola", "Necessidade de monitores para alunos especiais"],
            "descriptions": ["Ônibus escolar que atende a região rural quebra frequentemente, deixando alunos sem aula.", "Mais de 100 mães aguardam na fila por vaga na creche pública local.", "A quadra esportiva da escola local está com piso quebrado e alambrado danificado.", "Mães reivindicam a contratação de monitores de apoio para crianças com autismo."]
        },
        "Segurança": {
            "titles": ["Necessidade de policiamento ostensivo", "Frequência de furtos a pedestres próximo ao comércio", "Instalação de posto policial ou câmera de monitoramento", "Falta de iluminação gerando insegurança"],
            "descriptions": ["Moradores cobram maior patrulhamento da PM no horário noturno.", "Criminosos estão realizando furtos frequentes a trabalhadores nas proximidades da parada de ônibus.", "Comunidade solicita a instalação de câmeras de monitoramento interligadas ao Ciob.", "A escuridão na praça central tem facilitado ações criminosas e assaltos."]
        },
        "Mobilidade": {
            "titles": ["Falta de horários de ônibus no pico", "Solicitação de faixa de pedestres em via movimentada", "Estudo de viabilidade para semáforo", "Problema com calçadas inacessíveis"],
            "descriptions": ["Usuários de transporte público aguardam mais de 1 hora por ônibus nos horários de pico.", "Pedestres encontram extrema dificuldade para atravessar a avenida principal com segurança.", "Alto índice de acidentes no cruzamento exige a instalação urgente de semáforo.", "Calçadas danificadas impedem o trânsito seguro de cadeirantes e idosos."]
        },
        "Infraestrutura": {
            "titles": ["Operação tapa-buraco na avenida principal", "Falta de iluminação pública na rua lateral", "Obstrução de bocas de lobo causando alagamento", "Necessidade de pavimentação asfáltica"],
            "descriptions": ["Vários buracos na pista estão danificando veículos e provocando acidentes.", "Postes da rua estão com lâmpadas queimadas há mais de duas semanas.", "Lixo acumulado entupiu as bocas de lobo, provocando alagamentos em dias de chuva.", "Rua de terra sofre com poeira no período de seca e lamaçal intransitável na chuva."]
        },
        "Emprego e renda": {
            "titles": ["Demanda por cursos de capacitação profissional", "Necessidade de feira de empregos local", "Apoio a microempreendedores locais", "Fomento ao comércio da região"],
            "descriptions": ["Jovens solicitam cursos técnicos e profissionalizantes gratuitos para inserção no mercado.", "Comunidade pede a realização de mutirão de emprego em parceria com a Secretaria de Trabalho.", "Comerciantes solicitam palestras de gestão e crédito facilitado para pequenos negócios.", "Associação comercial reivindica melhorias no espaço da feira permanente para atrair clientes."]
        },
        "Regularização": {
            "titles": ["Dúvidas sobre escrituração de lotes", "Processo de regularização fundiária paralisado", "Entrega de escrituras públicas pendente", "Solicitação de vistoria da Terracap"],
            "descriptions": ["Moradores antigos de área consolidada buscam informações sobre a escrituração de suas casas.", "O processo administrativo de regularização da quadra está sem movimentação há meses.", "Comunidade aguarda a cerimônia de entrega das escrituras prometidas.", "Solicitação de demarcação de limites de lotes residenciais para evitar conflitos territoriais."]
        },
        "Habitação": {
            "titles": ["Cadastro no programa habitacional da Codhab", "Necessidade de realocação de famílias em área de risco", "Déficit habitacional na região", "Projetos de moradia popular"],
            "descriptions": ["Famílias de baixa renda solicitam apoio para atualização cadastral no Codhab.", "Defesa Civil identificou famílias vivendo em encosta com risco iminente de desabamento.", "Líderes comunitários cobram o lançamento de novos empreendimentos habitacionais populares.", "Solicitação de melhorias habitacionais para casas em condições precárias de salubridade."]
        },
        "Assistência social": {
            "titles": ["Fila de espera para atendimento no CRAS", "Necessidade de cestas básicas para famílias vulneráveis", "Falta de atividades de lazer para idosos", "Atendimento à população em situação de rua"],
            "descriptions": ["Moradores reclamam que agendamento no CRAS demora mais de 30 dias.", "Aumento do desemprego elevou a procura por auxílio vulnerabilidade e cestas de alimentos.", "Comunidade solicita oficinas e atividades físicas voltadas para a terceira idade no centro de convivência.", "Aumento do número de pessoas dormindo sob viadutos exige abordagem social e acolhimento."]
        },
        "Meio ambiente": {
            "titles": ["Descarte irregular de entulho e lixo", "Solicitação de poda de árvores de grande porte", "Preservação de nascente no parque local", "Campanha de conscientização ambiental"],
            "descriptions": ["Terreno baldio está sendo utilizado como lixão clandestino, atraindo roedores.", "Árvore com galhos tocando a rede elétrica ameaça cair sobre residências.", "Nascente de córrego local está sofrendo com assoreamento e descarte de esgoto.", "Associação pede apoio para mutirão de limpeza e plantio de mudas nativas do Cerrado."]
        }
    }

    # Generate exactly 120 demands
    print("Generating 120 demands...")
    created_demands = []
    now = datetime.datetime.utcnow()
    
    for i in range(120):
        # Pick city
        city = random.choice(cities)
        # Pick theme
        theme = random.choice(themes)
        
        # Pick template titles and descriptions based on theme
        templates = theme_templates.get(theme.name, {
            "titles": [f"Demanda de {theme.name} na RA"],
            "descriptions": [f"Descrição da demanda relacionada a {theme.name}."]
        })
        
        # Get subthemes for this theme
        subthemes = db.query(Subtheme).filter(Subtheme.theme_id == theme.id).all()
        subtheme_id = random.choice(subthemes).id if subthemes else None
        
        # Select title and description
        idx = random.randint(0, len(templates["titles"]) - 1)
        title_base = templates["titles"][idx]
        desc_base = templates["descriptions"][idx]
        
        # Contextualize title and description
        title = f"{title_base} ({city.name})"
        loc = random.choice(neighborhoods.get(city.name, ['Setor Central', 'Área Residencial', 'Quadras Comerciais']))
        description = f"Em {city.name}, na localidade {loc}, os moradores relatam: {desc_base}"
        
        # Distribute date over the last 8 weeks (56 days)
        days_ago = random.randint(0, 56)
        created_at = now - datetime.timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
        
        # Set priority and status
        priority = random.choices(priorities, weights=[15, 30, 25, 18, 12], k=1)[0]
        status = random.choices(statuses, weights=[20, 25, 15, 20, 20], k=1)[0]
        
        # Suggested Priority Score calculation
        priority_weight = {"Baixa": 15, "Média": 35, "Alta": 55, "Urgente": 75, "Crítica": 95}
        base_score = priority_weight[priority]
        suggested_priority_score = min(max(base_score + random.randint(-10, 10), 0), 100)
        
        # Requester details
        requester_name = random.choice(requester_names)
        requester_contact = f"(61) 9{random.randint(8000, 9999)}-{random.randint(1000, 9999)}"
        consent_contact = random.choice([True, False])
        
        demand = Demand(
            title=title,
            description=description,
            city_id=city.id,
            neighborhood=loc,
            theme_id=theme.id,
            subtheme_id=subtheme_id,
            source=random.choice(sources),
            priority=priority,
            status=status,
            suggested_priority_score=suggested_priority_score,
            requester_name=requester_name,
            requester_contact=requester_contact if consent_contact else None,
            consent_contact=consent_contact,
            entity_name=random.choice(["Associação de Moradores", "Conselho de Segurança", "Prefeitura Comunitária", None]),
            approximate_address=f"Quadra {random.randint(1, 400)}, Conjunto {random.choice('ABCDEFGH')}, Lote {random.randint(1, 30)}",
            created_by=admin_user.id,
            responsible_user_id=admin_user.id if status != "Nova" else None,
            created_at=created_at,
            updated_at=created_at + datetime.timedelta(days=random.randint(0, min(5, days_ago))) if days_ago > 0 else created_at
        )
        
        db.add(demand)
        created_demands.append(demand)
        
    db.commit()
    print("Seeded 120 demands successfully.")
    
    # Refresh demands to get IDs
    for d in created_demands:
        db.refresh(d)

    # 4. Seed 15 Meetings
    print("Generating 15 meetings...")
    meeting_types = ["Audiência Pública", "Visita Técnica", "Reunião de Líderes Comunitários", "Despacho Interno"]
    for i in range(15):
        city = random.choice(cities)
        days_ago = random.randint(0, 56)
        meeting_datetime = now - datetime.timedelta(days=days_ago, hours=random.randint(9, 18))
        loc = random.choice(neighborhoods.get(city.name, ['Setor Central', 'Área Residencial']))
        
        meeting = Meeting(
            title=f"Reunião de Alinhamento Territorial - {city.name}",
            city_id=city.id,
            neighborhood=loc,
            meeting_datetime=meeting_datetime,
            location=f"Administração Regional de {city.name}",
            meeting_type=random.choice(meeting_types),
            summary=f"Discussão sobre demandas críticas de {city.name}. Foco em infraestrutura local e segurança.",
            discussed_themes="Infraestrutura, Segurança",
            identified_demands="Solicitações de recapeamento e manutenção da iluminação.",
            forwardings="Encaminhado ofício formal aos órgãos competentes do GDF.",
            responsible_user_id=admin_user.id,
            created_by=admin_user.id,
            created_at=meeting_datetime - datetime.timedelta(days=1),
            status="Realizada"
        )
        db.add(meeting)
        db.flush()
        
        # Add 3 participants for each meeting
        for p_idx in range(3):
            part = MeetingParticipant(
                meeting_id=meeting.id,
                name=f"Líder {random.choice(requester_names)}",
                contact=f"(61) 9{random.randint(8000, 9999)}-{random.randint(1000, 9999)}",
                entity_role=random.choice(["Presidente da Associação", "Conselheiro", "Líder Comunitário"])
            )
            db.add(part)
            
    db.commit()
    print("Seeded 15 meetings successfully.")

    # 5. Seed 20 Attendances
    print("Generating 20 citizen attendances...")
    attendance_types = ["Presencial", "Telefone", "E-mail", "Ofício", "Rede Social"]
    attendance_statuses = ["Pendente", "Em andamento", "Concluído"]
    for i in range(20):
        city = random.choice(cities)
        theme = random.choice(themes)
        days_ago = random.randint(0, 56)
        att_datetime = now - datetime.timedelta(days=days_ago, hours=random.randint(9, 18))
        loc = random.choice(neighborhoods.get(city.name, ['Setor Central', 'Área Residencial']))
        
        att = Attendance(
            attendance_type=random.choice(attendance_types),
            attendance_datetime=att_datetime,
            city_id=city.id,
            neighborhood=loc,
            person_or_entity_name=random.choice(requester_names),
            contact=f"(61) 9{random.randint(8000, 9999)}-{random.randint(1000, 9999)}",
            main_theme_id=theme.id,
            description=f"Atendimento individual ao cidadão para tratar de temas de {theme.name} na quadra de residência.",
            status=random.choices(attendance_statuses, weights=[30, 40, 30], k=1)[0],
            internal_notes="Anotações internas de controle. Aguardando retorno da equipe de campo.",
            responsible_user_id=admin_user.id,
            created_by=admin_user.id,
            created_at=att_datetime
        )
        db.add(att)
        
    db.commit()
    print("Seeded 20 attendances successfully.")

    # 6. Seed 30 Actions
    print("Generating 30 administrative actions...")
    action_priorities = ["Baixa", "Média", "Alta"]
    action_statuses = ["Pendente", "Em andamento", "Concluída"]
    
    for i in range(30):
        demand = random.choice(created_demands)
        action_created_at = demand.created_at + datetime.timedelta(hours=random.randint(1, 12))
        
        # Deadlines can be overdue or in the future
        deadline_offset = random.choice([-6, -2, 4, 10, 15]) 
        deadline = action_created_at + datetime.timedelta(days=deadline_offset)
        
        status = random.choice(action_statuses)
        completed_at = None
        if status == "Concluída":
            completed_at = action_created_at + datetime.timedelta(days=random.randint(1, 5))
            
        act = Action(
            title=f"Ação Corretiva: {demand.title.split(' (')[0]}",
            description=f"Providências formais relativas à demanda: {demand.description}. Requer ofício oficial.",
            city_id=demand.city_id,
            theme_id=demand.theme_id,
            demand_id=demand.id,
            responsible_user_id=admin_user.id,
            deadline=deadline,
            priority=random.choice(action_priorities),
            status=status,
            expected_result="Protocolo do órgão público competente respondido.",
            obtained_result="Encaminhado com resposta positiva do órgão." if status == "Concluída" else None,
            notes="Realizar contato semanal com o órgão.",
            created_at=action_created_at,
            completed_at=completed_at
        )
        db.add(act)
        
    db.commit()
    print("Seeded 30 actions successfully.")
    
    print("\nDATABASE POPULATED SUCCESSFULLY!")
    print(f"Total seeded: 120 Demands, 15 Meetings, 20 Attendances, 30 Actions.")
    db.close()

if __name__ == "__main__":
    populate_data()
