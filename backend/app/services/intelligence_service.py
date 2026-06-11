import re
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.models import Demand, Theme

def suggest_secretariat(theme_name: str, title: str, description: str) -> str:
    """
    Analyzes the theme and keywords in title and description to suggest
    the most appropriate DF Government Secretariat.
    """
    text = (title + " " + description).lower()
    theme = theme_name.lower()

    # Define keyword maps
    routing_rules = [
        {
            "secretariat": "CAESB (Cia. de Saneamento Ambiental)",
            "keywords": ["caesb", "saneamento", "água", "esgoto", "vazamento", "adutora", "hidrômetro", "fossas", "caixa d'água", "drenagem sanitária"]
        },
        {
            "secretariat": "Neoenergia / CEB (Iluminação Pública)",
            "keywords": ["ceb", "neoenergia", "iluminação", "poste", "lâmpada", "escuridão", "energia", "fiação", "curto-circuito", " blackout"]
        },
        {
            "secretariat": "Secretaria de Saúde (SES-DF)",
            "keywords": ["saúde", "hospital", "upa", "posto de saúde", "médico", "dengue", "vacina", "remédio", "farmácia", "consulta", "ambulância", "ubs", "marcação"]
        },
        {
            "secretariat": "Secretaria de Segurança Pública (SSP-DF)",
            "keywords": ["segurança", "policiamento", "assalto", "roubo", "droga", "furto", "câmera", "pmdf", "pcdf", "violência", "ilícito", "guarda", "viatura"]
        },
        {
            "secretariat": "Secretaria de Educação (SEE-DF)",
            "keywords": ["educação", "escola", "creche", "professor", "merenda", "aluno", "aula", "matrícula", "ensino", "quadra escolar", "transporte escolar"]
        },
        {
            "secretariat": "Secretaria de Mobilidade (SEMOB)",
            "keywords": ["semob", "transporte", "ônibus", "parada", "abrigo de ônibus", "linha", "terminal", "metrô", "tarifa", "tcb", "lotação"]
        },
        {
            "secretariat": "Secretaria de Obras e Infraestrutura (SODF)",
            "keywords": ["obras", "infraestrutura", "pavimentação", "asfalto", "bueiro", "galeria", "drenagem pluvial", "calçada", "passarela", "ponte", "duplicação", "recapeamento"]
        },
        {
            "secretariat": "Novacap (Cia. de Urbanização)",
            "keywords": ["novacap", "poda", "árvore", "praça", "parque", "urbanização", "jardinagem", "buraco", "tapa-buraco", "roçagem", "capina", "canteiro"]
        },
        {
            "secretariat": "DF Legal (Fiscalização Urbana)",
            "keywords": ["df legal", "fiscalização", "irregular", "invasão", "entulho", "poluição sonora", "loteamento", "comércio ambulante", "alvará", "interdição"]
        },
        {
            "secretariat": "Secretaria de Esporte e Lazer (SEL)",
            "keywords": ["esporte", "lazer", "quadra", "campo", "ginásio", "pec", "academia da terceira idade", "torneio", "parquinho", "playground"]
        },
        {
            "secretariat": "Secretaria de Desenvolvimento Social (SEDES)",
            "keywords": ["social", "sedes", "cras", "creas", "família", "vulnerabilidade", "assistência", "abrigo", "auxílio", "alimentação", "restaurante comunitário"]
        }
    ]

    # First check theme-specific keywords
    if "saneamento" in theme or "caesb" in theme:
        return "CAESB (Cia. de Saneamento Ambiental)"
    if "iluminação" in theme or "energia" in theme:
        return "Neoenergia / CEB (Iluminação Pública)"
    if "saúde" in theme or "ubs" in theme or "hospital" in theme:
        return "Secretaria de Saúde (SES-DF)"
    if "segurança" in theme or "policiamento" in theme:
        return "Secretaria de Segurança Pública (SSP-DF)"
    if "educação" in theme or "escola" in theme:
        return "Secretaria de Educação (SEE-DF)"
    if "transporte" in theme or "mobilidade" in theme or "ônibus" in theme:
        return "Secretaria de Mobilidade (SEMOB)"
    if "infraestrutura" in theme or "pavimentação" in theme or "asfalto" in theme:
        return "Secretaria de Obras e Infraestrutura (SODF)"
    if "meio ambiente" in theme or "poda" in theme or "jardinagem" in theme:
        return "Novacap (Cia. de Urbanização)"
    if "esporte" in theme or "lazer" in theme:
        return "Secretaria de Esporte e Lazer (SEL)"

    # Check text rules
    for rule in routing_rules:
        for keyword in rule["keywords"]:
            if keyword in text:
                return rule["secretariat"]

    # Fallback default
    return "Administração Regional"


def get_words(text: str) -> set:
    """Helper to extract a set of lowercase alphanumeric words, ignoring small ones."""
    if not text:
        return set()
    cleaned = re.sub(r'[^\w\s]', '', text.lower())
    words = cleaned.split()
    return {w for w in words if len(w) > 3}


def calculate_jaccard_similarity(text1: str, text2: str) -> float:
    """Calculates Jaccard similarity between two texts."""
    words1 = get_words(text1)
    words2 = get_words(text2)
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union)


def find_potential_duplicates(db: Session, demand: Demand, threshold: float = 0.25) -> list:
    """
    Finds potential duplicates for a demand in the same city.
    Returns a list of matching Demands with similarity score.
    """
    # Find active demands in the same city
    query = db.query(Demand).filter(
        Demand.city_id == demand.city_id,
        Demand.id != demand.id,
        Demand.deleted_at.is_(None)
    )
    
    potential_matches = []
    
    # Text to match
    target_text = f"{demand.title} {demand.description}"
    
    for item in query.all():
        # Avoid creating circular dependency
        if item.parent_demand_id == demand.id or (demand.parent_demand_id and item.id == demand.parent_demand_id):
            continue
            
        item_text = f"{item.title} {item.description}"
        score = calculate_jaccard_similarity(target_text, item_text)
        
        # If theme matches, give a slight boost
        if item.theme_id == demand.theme_id:
            score += 0.1
            
        if score >= threshold:
            potential_matches.append({
                "demand": item,
                "score": round(score, 3)
            })
            
    # Sort by score descending
    potential_matches.sort(key=lambda x: x["score"], reverse=True)
    return potential_matches
