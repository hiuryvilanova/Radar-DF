from sqlalchemy.orm import Session
from app.models.models import Role, User, City, Theme, Subtheme
from app.core.security import get_password_hash

def seed_db(db: Session):
    # 1. Seed Roles
    roles_data = [
        {"id": 1, "name": "Administrador", "description": "Acesso total ao sistema, gerencia usuários e configurações."},
        {"id": 2, "name": "Coordenador", "description": "Gerencia demandas, reuniões, atendimentos e visualiza dashboards de sua equipe."},
        {"id": 3, "name": "Operador", "description": "Cadastra demandas, atendimentos e reuniões. Atualiza status de seus registros."},
        {"id": 4, "name": "Visualizador", "description": "Visualização exclusiva de dashboards, relatórios e dossiês (sem permissão de escrita)."}
    ]
    
    for r in roles_data:
        db_role = db.query(Role).filter(Role.id == r["id"]).first()
        if not db_role:
            role = Role(id=r["id"], name=r["name"], description=r["description"])
            db.add(role)
    db.commit()

    # 2. Seed Admin User
    admin_email = "admin@radardf.local"
    db_admin = db.query(User).filter(User.email == admin_email).first()
    if not db_admin:
        admin_user = User(
            name="Administrador",
            email=admin_email,
            password_hash=get_password_hash("Admin@123456"),
            role_id=1,  # Admin
            status="pending_password_change"  # Forces password change on first login
        )
        db.add(admin_user)
        db.commit()

    # 3. Seed Cities (Regiões Administrativas do DF)
    cities_data = [
        {"name": "Brasília", "region": "Central"},
        {"name": "Ceilândia", "region": "Oeste"},
        {"name": "Taguatinga", "region": "Oeste"},
        {"name": "Samambaia", "region": "Oeste"},
        {"name": "Planaltina", "region": "Norte"},
        {"name": "Gama", "region": "Sul"},
        {"name": "Santa Maria", "region": "Sul"},
        {"name": "Recanto das Emas", "region": "Sudoeste"},
        {"name": "Sobradinho", "region": "Norte"},
        {"name": "São Sebastião", "region": "Leste"},
        {"name": "Paranoá", "region": "Leste"},
        {"name": "Brazlândia", "region": "Oeste"},
        {"name": "Guará", "region": "Centro-Sul"},
        {"name": "Núcleo Bandeirante", "region": "Centro-Sul"},
        {"name": "Riacho Fundo", "region": "Centro-Sul"},
        {"name": "Riacho Fundo II", "region": "Oeste"},
        {"name": "Vicente Pires", "region": "Oeste"},
        {"name": "Águas Claras", "region": "Oeste"},
        {"name": "Sol Nascente/Pôr do Sol", "region": "Oeste"},
        {"name": "Estrutural", "region": "Centro-Sul"},
        {"name": "Itapoã", "region": "Leste"},
        {"name": "Jardim Botânico", "region": "Leste"},
        {"name": "Lago Norte", "region": "Central"},
        {"name": "Lago Sul", "region": "Central"},
        {"name": "Cruzeiro", "region": "Central"},
        {"name": "Sudoeste/Octogonal", "region": "Central"},
        {"name": "Park Way", "region": "Centro-Sul"},
        {"name": "Fercal", "region": "Norte"},
        {"name": "Varjão", "region": "Central"},
        {"name": "Candangolândia", "region": "Centro-Sul"},
        {"name": "SCIA", "region": "Centro-Sul"},
        {"name": "Arniqueira", "region": "Oeste"},
        {"name": "Arapoanga", "region": "Norte"}
    ]

    for c in cities_data:
        db_city = db.query(City).filter(City.name == c["name"]).first()
        if not db_city:
            city = City(
                name=c["name"],
                region=c["region"],
                description=f"Região Administrativa de {c['name']} - DF.",
                status=True,
                strategic_priority="Média"
            )
            db.add(city)
    db.commit()

    # 4. Seed Themes and Subthemes
    themes_data = [
        {
            "name": "Saúde",
            "color": "#ef4444",
            "icon": "Activity",
            "subthemes": ["UBS", "Hospital", "Medicamentos", "Fila de atendimento"]
        },
        {
            "name": "Educação",
            "color": "#3b82f6",
            "icon": "GraduationCap",
            "subthemes": ["Creche", "Escola", "Transporte escolar"]
        },
        {
            "name": "Segurança",
            "color": "#1e3a8a",
            "icon": "Shield",
            "subthemes": ["Policiamento", "Violência"]
        },
        {
            "name": "Mobilidade",
            "color": "#f59e0b",
            "icon": "Car",
            "subthemes": ["Ônibus", "Metrô", "Trânsito"]
        },
        {
            "name": "Infraestrutura",
            "color": "#10b981",
            "icon": "Hammer",
            "subthemes": ["Asfalto", "Buracos", "Calçadas", "Iluminação pública", "Limpeza urbana", "Saneamento"]
        },
        {
            "name": "Emprego e renda",
            "color": "#8b5cf6",
            "icon": "Briefcase",
            "subthemes": ["Cursos profissionalizantes", "Comércio local"]
        },
        {
            "name": "Regularização",
            "color": "#ec4899",
            "icon": "FileText",
            "subthemes": ["Escritura", "Regularização fundiária"]
        },
        {
            "name": "Habitação",
            "color": "#06b6d4",
            "icon": "Home",
            "subthemes": ["Moradia", "Loteamento"]
        },
        {
            "name": "Assistência social",
            "color": "#f43f5e",
            "icon": "Heart",
            "subthemes": ["Auxílio social", "Atendimento CRAS"]
        },
        {
            "name": "Meio ambiente",
            "color": "#14b8a6",
            "icon": "Leaf",
            "subthemes": ["Coleta de lixo", "Preservação de áreas", "Poda de árvores"]
        }
    ]

    for t in themes_data:
        db_theme = db.query(Theme).filter(Theme.name == t["name"]).first()
        if not db_theme:
            theme = Theme(
                name=t["name"],
                color=t["color"],
                icon=t["icon"],
                description=f"Assuntos relacionados a {t['name']}.",
                status=True
            )
            db.add(theme)
            db.flush()  # Gets the theme.id for subthemes
            
            for s_name in t["subthemes"]:
                sub = Subtheme(
                    theme_id=theme.id,
                    name=s_name,
                    description=f"Subtema de {t['name']}: {s_name}.",
                    status=True
                )
                db.add(sub)
        else:
            # Theme exists, check subthemes
            for s_name in t["subthemes"]:
                db_sub = db.query(Subtheme).filter(
                    Subtheme.theme_id == db_theme.id,
                    Subtheme.name == s_name
                ).first()
                if not db_sub:
                    sub = Subtheme(
                        theme_id=db_theme.id,
                        name=s_name,
                        description=f"Subtema de {t['name']}: {s_name}.",
                        status=True
                    )
                    db.add(sub)
            
    db.commit()
