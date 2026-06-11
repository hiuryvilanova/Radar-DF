import io
import datetime
import pandas as pd
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

from app.models.models import Demand, City, Meeting, Attendance, Action, Theme, Subtheme

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        if self._pageNumber == 1:
            # Skip page number on cover page
            return
            
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#475569"))
        
        # Header
        self.drawString(54, 800, "Radar DF — Inteligência Territorial de Demandas Públicas")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 792, 541, 792)
        
        # Footer
        page_text = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(541, 40, page_text)
        self.drawString(54, 40, f"Gerado em {datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        self.line(54, 52, 541, 52)
        self.restoreState()


def generate_dossier_pdf(db: Session, city_id: int, start_date: datetime.datetime, end_date: datetime.datetime) -> bytes:
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise ValueError("Cidade não encontrada")

    # Gather data
    demand_query = db.query(Demand).filter(
        Demand.city_id == city_id,
        Demand.deleted_at.is_(None),
        Demand.created_at >= start_date,
        Demand.created_at <= end_date
    )
    demands = demand_query.all()
    
    meetings = db.query(Meeting).filter(
        Meeting.city_id == city_id,
        Meeting.meeting_datetime >= start_date,
        Meeting.meeting_datetime <= end_date
    ).all()

    attendances = db.query(Attendance).filter(
        Attendance.city_id == city_id,
        Attendance.attendance_datetime >= start_date,
        Attendance.attendance_datetime <= end_date
    ).all()

    actions = db.query(Action).filter(
        Action.city_id == city_id,
        Action.created_at >= start_date,
        Action.created_at <= end_date
    ).all()

    # Calculations
    total_demands = len(demands)
    urgent_demands = sum(1 for d in demands if d.priority in ["Urgente", "Crítica"])
    pending_demands = sum(1 for d in demands if d.status not in ["Concluída", "Arquivada", "Respondida"])
    completed_demands = sum(1 for d in demands if d.status == "Concluída")
    
    actions_pending = sum(1 for a in actions if a.status in ["Pendente", "Em andamento"])
    actions_overdue = 0
    now = datetime.datetime.utcnow()
    for a in actions:
        if a.status in ["Pendente", "Em andamento"] and a.deadline < now:
            actions_overdue += 1

    # Demands by Theme
    theme_counts = {}
    for d in demands:
        t_name = d.theme.name if d.theme else "Não classificado"
        theme_counts[t_name] = theme_counts.get(t_name, 0) + 1

    # ReportLab document setup
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=32,
        leading=38,
        textColor=colors.HexColor("#0f172a"),
        alignment=0, # Left
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=16,
        leading=22,
        textColor=colors.HexColor("#059669"),
        spaceAfter=20
    )
    
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )
    
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#334155")
    )

    story = []

    # --- COVER PAGE ---
    story.append(Spacer(1, 150))
    story.append(Paragraph("RADAR DF", title_style))
    story.append(Paragraph("Inteligência Territorial de Demandas Públicas", subtitle_style))
    
    # Divider line
    divider = Table([[""]], colWidths=[487], rowHeights=[4])
    divider.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#059669")),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(divider)
    story.append(Spacer(1, 20))
    
    # Cover Metadata
    story.append(Paragraph(f"<b>Dossiê Territorial:</b> {city.name}", ParagraphStyle('Meta', fontName='Helvetica-Bold', fontSize=14, leading=18, textColor=colors.HexColor("#0f172a"))))
    story.append(Paragraph(f"<b>Período Analisado:</b> {start_date.strftime('%d/%m/%Y')} a {end_date.strftime('%d/%m/%Y')}", body_style))
    story.append(Paragraph(f"<b>Região do DF:</b> {city.region}", body_style))
    story.append(Spacer(1, 150))
    story.append(Paragraph("<i>Escuta inteligente para ações que fazem sentido.</i>", ParagraphStyle('Quote', fontName='Helvetica-Oblique', fontSize=11, leading=15, textColor=colors.HexColor("#475569"))))
    story.append(PageBreak())

    # --- PAGE 2: EXEC SUMMARY & KEY STATS ---
    story.append(Paragraph(f"Dossiê de {city.name} - Resumo Executivo", h1_style))
    
    intro_text = (
        f"Este documento apresenta o diagnóstico consolidado das demandas e ações de monitoramento na "
        f"Região Administrativa de {city.name} no período compreendido entre {start_date.strftime('%d/%m/%Y')} "
        f"e {end_date.strftime('%d/%m/%Y')}. O objetivo é apoiar tomadas de decisões governamentais "
        f"e formulação de propostas públicas com base em dados coletados em reuniões, visitas técnicas e atendimentos."
    )
    story.append(Paragraph(intro_text, body_style))
    story.append(Spacer(1, 10))

    # KPI Grid Table
    kpi_data = [
        [
            Paragraph("<b>Total de Demandas</b>", table_cell_style), 
            Paragraph("<b>Críticas/Urgentes</b>", table_cell_style), 
            Paragraph("<b>Demandas Pendentes</b>", table_cell_style)
        ],
        [
            Paragraph(f"<font size=16 color='#1e3a8a'><b>{total_demands}</b></font>", table_cell_style),
            Paragraph(f"<font size=16 color='#ef4444'><b>{urgent_demands}</b></font>", table_cell_style),
            Paragraph(f"<font size=16 color='#f59e0b'><b>{pending_demands}</b></font>", table_cell_style)
        ],
        [
            Paragraph("<b>Reuniões Realizadas</b>", table_cell_style), 
            Paragraph("<b>Atendimentos Registrados</b>", table_cell_style), 
            Paragraph("<b>Ações Atrasadas</b>", table_cell_style)
        ],
        [
            Paragraph(f"<font size=16 color='#059669'><b>{len(meetings)}</b></font>", table_cell_style),
            Paragraph(f"<font size=16 color='#0d9488'><b>{len(attendances)}</b></font>", table_cell_style),
            Paragraph(f"<font size=16 color='#b91c1c'><b>{actions_overdue}</b></font>", table_cell_style)
        ]
    ]
    
    kpi_table = Table(kpi_data, colWidths=[162, 162, 163])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 15))

    # --- DEMANDS BY THEME TABLE ---
    story.append(Paragraph("Distribuição de Demandas por Tema", h2_style))
    theme_data = [[Paragraph("Tema", table_header_style), Paragraph("Quantidade", table_header_style), Paragraph("Percentual", table_header_style)]]
    for t_name, count in sorted(theme_counts.items(), key=lambda x: x[1], reverse=True):
        pct = (count / total_demands * 100) if total_demands > 0 else 0
        theme_data.append([
            Paragraph(t_name, table_cell_style),
            Paragraph(str(count), table_cell_style),
            Paragraph(f"{pct:.1f}%", table_cell_style)
        ])
        
    if len(theme_data) == 1:
        theme_data.append([Paragraph("Nenhuma demanda registrada no período.", table_cell_style), "", ""])

    theme_table = Table(theme_data, colWidths=[247, 120, 120])
    theme_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(theme_table)
    
    story.append(PageBreak())

    # --- CRITICAL DEMANDS DETAIL ---
    story.append(Paragraph("Demandas Críticas e Urgentes", h1_style))
    critical_list = [d for d in demands if d.priority in ["Urgente", "Crítica"]]
    
    crit_table_data = [[
        Paragraph("ID", table_header_style),
        Paragraph("Título", table_header_style),
        Paragraph("Bairro", table_header_style),
        Paragraph("Tema", table_header_style),
        Paragraph("Status", table_header_style)
    ]]
    for cd in critical_list[:10]: # Top 10 critical
        crit_table_data.append([
            Paragraph(f"#{cd.id}", table_cell_style),
            Paragraph(cd.title, table_cell_style),
            Paragraph(cd.neighborhood or "N/A", table_cell_style),
            Paragraph(cd.theme.name if cd.theme else "N/A", table_cell_style),
            Paragraph(cd.status, table_cell_style)
        ])
        
    if len(crit_table_data) == 1:
        crit_table_data.append([Paragraph("Nenhuma demanda crítica cadastrada.", table_cell_style), "", "", "", ""])
        
    crit_table = Table(crit_table_data, colWidths=[40, 187, 90, 90, 80])
    crit_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#b91c1c")), # Red header for critical
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#fca5a5")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#fef2f2")]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(crit_table)
    story.append(Spacer(1, 15))

    # --- MEETINGS & ATTENDANCES ---
    story.append(Paragraph("Reuniões Realizadas & Diálogo Comunitário", h1_style))
    meet_table_data = [[
        Paragraph("Data", table_header_style),
        Paragraph("Título da Reunião", table_header_style),
        Paragraph("Tipo de Reunião", table_header_style),
        Paragraph("Status/Encaminhamento", table_header_style)
    ]]
    for m in meetings[:5]:
        meet_table_data.append([
            Paragraph(m.meeting_datetime.strftime("%d/%m/%Y"), table_cell_style),
            Paragraph(m.title, table_cell_style),
            Paragraph(m.meeting_type, table_cell_style),
            Paragraph(m.status, table_cell_style)
        ])
    if len(meet_table_data) == 1:
        meet_table_data.append([Paragraph("Nenhuma reunião registrada no período.", table_cell_style), "", "", ""])
        
    meet_table = Table(meet_table_data, colWidths=[70, 217, 100, 100])
    meet_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(meet_table)
    story.append(Spacer(1, 15))

    # --- ACTIONS & FORWARDINGS ---
    story.append(Paragraph("Status de Ações e Encaminhamentos", h1_style))
    act_table_data = [[
        Paragraph("Ação", table_header_style),
        Paragraph("Responsável", table_header_style),
        Paragraph("Prazo", table_header_style),
        Paragraph("Prioridade", table_header_style),
        Paragraph("Situação", table_header_style)
    ]]
    for a in actions[:10]:
        deadline_str = a.deadline.strftime("%d/%m/%Y")
        is_overdue = a.status in ["Pendente", "Em andamento"] and a.deadline < now
        status_text = f"<font color='red'>Atrasada</font>" if is_overdue else a.status
        act_table_data.append([
            Paragraph(a.title, table_cell_style),
            Paragraph(a.responsible_user.name if a.responsible_user else "Não designado", table_cell_style),
            Paragraph(deadline_str, table_cell_style),
            Paragraph(a.priority, table_cell_style),
            Paragraph(status_text, table_cell_style)
        ])
    if len(act_table_data) == 1:
        act_table_data.append([Paragraph("Nenhum encaminhamento registrado no período.", table_cell_style), "", "", "", ""])
        
    act_table = Table(act_table_data, colWidths=[167, 100, 70, 70, 80])
    act_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(act_table)
    
    # --- STRATEGIC CONCLUSION ---
    story.append(Spacer(1, 15))
    conclusion_box = []
    conclusion_box.append(Paragraph("<b>Diretrizes Estratégicas Territoriais</b>", h2_style))
    
    conc_text = (
        f"Com base na escuta ativa territorial e nos dados do painel, a Região Administrativa de "
        f"{city.name} requer atenção prioritária nas seguintes frentes: "
    )
    # Add top theme if exists
    if theme_counts:
        top_theme = max(theme_counts, key=theme_counts.get)
        conc_text += f"1) Fortalecimento de ações na área de <b>{top_theme}</b> (tema mais recorrente); "
    else:
        conc_text += "1) Estruturação das primeiras escutas para registrar as demandas locais; "
        
    conc_text += (
        f"2) Monitoramento rígido dos {actions_pending} encaminhamentos pendentes e, "
        f"especialmente, das {actions_overdue} ações atrasadas; "
        f"3) Planejamento de novas visitas técnicas e reuniões com lideranças locais nos bairros "
        f"com maior concentração de relatos críticos."
    )
    conclusion_box.append(Paragraph(conc_text, body_style))
    
    conclusion_table = Table([[conclusion_box]], colWidths=[487])
    conclusion_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")), # Light green container
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#dcfce7")),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    
    story.append(Spacer(1, 15))
    story.append(KeepTogether([conclusion_table]))

    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()


def export_demands_dataframe(demands: List[Demand], format_type: str = "xlsx") -> bytes:
    data = []
    for d in demands:
        data.append({
            "ID": d.id,
            "Data Registro": d.created_at.strftime("%d/%m/%Y %H:%M:%S") if d.created_at else "",
            "Título": d.title,
            "Descrição": d.description,
            "Cidade / RA": d.city.name if d.city else "",
            "Bairro": d.neighborhood or "",
            "Tema": d.theme.name if d.theme else "",
            "Subtema": d.subtheme.name if d.subtheme else "",
            "Origem": d.source,
            "Prioridade": d.priority,
            "Score Inteligente": d.suggested_priority_score,
            "Status": d.status,
            "Solicitante": d.requester_name or "",
            "Contato": d.requester_contact or "",
            "Entidade / Liderança": d.entity_name or "",
            "Endereço Aproximado": d.approximate_address or "",
            "Responsável Interno": d.responsible_user.name if d.responsible_user else "",
            "Observação Estratégica": d.strategic_note or ""
        })

    df = pd.DataFrame(data)
    
    buffer = io.BytesIO()
    if format_type.lower() == "csv":
        df.to_csv(buffer, index=False, encoding="utf-8-sig")
    else:
        # Excel
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Demandas Radar DF")
            
    buffer.seek(0)
    return buffer.getvalue()
