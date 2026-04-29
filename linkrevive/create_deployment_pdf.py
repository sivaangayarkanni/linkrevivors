#!/usr/bin/env python3
"""Generate LinkRevive Deployment Playbook PDF"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import os

# Colors
PRIMARY = HexColor("#1e40af")  # Deep blue
SECONDARY = HexColor("#3b82f6")
DARK = HexColor("#0f172a")
LIGHT = HexColor("#f8fafc")
ACCENT = HexColor("#10b981")

def create_pdf():
    doc = SimpleDocTemplate(
        "/home/workdir/artifacts/linkrevive/LinkRevive_Deployment_Playbook.pdf",
        pagesize=A4,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=28,
        textColor=PRIMARY,
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )

    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=HexColor("#64748b"),
        alignment=TA_CENTER,
        spaceAfter=30
    )

    heading1 = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=PRIMARY,
        spaceBefore=20,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )

    heading2 = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=SECONDARY,
        spaceBefore=15,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontSize=10,
        textColor=DARK,
        alignment=TA_JUSTIFY,
        spaceAfter=8,
        leading=14
    )

    code_style = ParagraphStyle(
        'CodeCustom',
        parent=styles['Code'],
        fontSize=8,
        fontName='Courier',
        backColor=HexColor("#f1f5f9"),
        leftIndent=10,
        rightIndent=10,
        spaceAfter=10,
        leading=11
    )

    story = []

    # Title Page
    story.append(Spacer(1, 1.5*inch))
    story.append(Paragraph("🔗 LinkRevive", title_style))
    story.append(Paragraph("Dead Link Internet Fixer", ParagraphStyle(
        'SubMain', parent=styles['Normal'], fontSize=16, textColor=SECONDARY, alignment=TA_CENTER, spaceAfter=20
    )))
    story.append(Paragraph("Production Deployment Playbook", subtitle_style))
    story.append(Spacer(1, 0.5*inch))

    # Info box
    info_data = [
        ["Version", "1.0.0 - Production Ready"],
        ["Date", "April 30, 2026"],
        ["Stack", "Next.js 15 + Fastify + Prisma + Redis + BullMQ"],
        ["Targets", "Vercel (Frontend) • Railway (Backend) • Docker"],
    ]
    info_table = Table(info_data, colWidths=[2*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), LIGHT),
        ('TEXTCOLOR', (0, 0), (-1, -1), DARK),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(info_table)

    story.append(PageBreak())

    # Section 1: Quick Deploy
    story.append(Paragraph("🚀 Quick Deploy (2 Minutes)", heading1))
    story.append(Paragraph(
        "The fastest way to get LinkRevive running in production:",
        body_style
    ))

    story.append(Paragraph("Option A: Docker (Recommended for local/production)", heading2))
    story.append(Paragraph(
        "```bash<br/>"
        "git clone &lt;your-repo&gt;<br/>"
        "cd linkrevive<br/>"
        "cp .env.example .env<br/>"
        "# Edit .env with your API keys<br/>"
        "./deploy.sh docker<br/>"
        "```",
        code_style
    ))
    story.append(Paragraph("Access: <b>http://localhost:3000</b> (Web) | <b>http://localhost:3001</b> (API)", body_style))

    story.append(Paragraph("Option B: Vercel + Railway (True Production)", heading2))
    story.append(Paragraph(
        "1. Push code to GitHub<br/>"
        "2. Import to <b>Vercel</b> → Deploy frontend (auto)<br/>"
        "3. Import to <b>Railway</b> → Add Postgres + Redis + Deploy backend<br/>"
        "4. Set environment variables (see below)<br/>"
        "5. Update <code>NEXT_PUBLIC_API_URL</code> in Vercel",
        body_style
    ))

    story.append(PageBreak())

    # Section 2: Environment Variables
    story.append(Paragraph("🔐 Required Environment Variables", heading1))

    env_data = [
        ["Variable", "Required For", "Example / Notes"],
        ["DATABASE_URL", "Backend (Prisma)", "postgresql://user:pass@host:5432/db"],
        ["REDIS_URL", "Cache + BullMQ", "redis://user:pass@host:6379"],
        ["OPENAI_API_KEY", "AI Explanations", "sk-proj-... (GPT-4o-mini)"],
        ["GOOGLE_CSE_API_KEY", "Alternative Finder", "Create at console.cloud.google.com"],
        ["GOOGLE_CSE_CX", "Alternative Finder", "Programmable Search Engine ID"],
        ["GITHUB_TOKEN", "Optional (higher limits)", "ghp_... (classic PAT)"],
        ["NEXT_PUBLIC_API_URL", "Frontend", "https://api.yourdomain.com"],
    ]

    env_table = Table(env_data, colWidths=[2.2*inch, 1.5*inch, 2.8*inch])
    env_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, LIGHT]),
    ]))
    story.append(env_table)

    story.append(Spacer(1, 15))
    story.append(Paragraph(
        "<b>Tip:</b> On Railway, add these as variables in the dashboard. On Vercel, use the Environment Variables tab.",
        body_style
    ))

    # Section 3: Architecture
    story.append(Paragraph("🏗️ Production Architecture", heading1))
    story.append(Paragraph(
        "• <b>Frontend</b>: Next.js 15 on Vercel (Edge + Serverless Functions)<br/>"
        "• <b>Backend</b>: Fastify on Railway (Node 20, auto-scaling)<br/>"
        "• <b>Database</b>: PostgreSQL on Railway (with connection pooling)<br/>"
        "• <b>Cache/Queue</b>: Redis on Railway or Upstash (BullMQ workers)<br/>"
        "• <b>Extension</b>: Chrome Web Store (MV3, ~150KB)",
        body_style
    ))

    story.append(PageBreak())

    # Section 4: Step-by-Step
    story.append(Paragraph("📋 Detailed Deployment Steps", heading1))

    story.append(Paragraph("1. Prepare the Code", heading2))
    story.append(Paragraph(
        "```bash<br/>"
        "cd linkrevive<br/>"
        "pnpm install          # Install all workspaces<br/>"
        "cp .env.example .env<br/>"
        "pnpm prisma migrate deploy   # Run in production<br/>"
        "```",
        code_style
    ))

    story.append(Paragraph("2. Deploy Backend (Railway - Recommended)", heading2))
    story.append(Paragraph(
        "1. Go to <b>railway.app</b> → New Project → Deploy from GitHub<br/>"
        "2. Add services: <b>PostgreSQL</b> + <b>Redis</b><br/>"
        "3. Deploy the <code>apps/api</code> folder (or root with monorepo config)<br/>"
        "4. Set all environment variables from .env<br/>"
        "5. Railway gives you a URL like <code>https://linkrevive-api.up.railway.app</code>",
        body_style
    ))

    story.append(Paragraph("3. Deploy Frontend (Vercel)", heading2))
    story.append(Paragraph(
        "1. Go to <b>vercel.com</b> → Import GitHub repo<br/>"
        "2. Set Root Directory: <code>apps/web</code><br/>"
        "3. Add Environment Variable: <code>NEXT_PUBLIC_API_URL</code> = your Railway URL<br/>"
        "4. Deploy → Get URL like <code>https://linkrevive.vercel.app</code>",
        body_style
    ))

    story.append(Paragraph("4. Update Extension (Optional)", heading2))
    story.append(Paragraph(
        "Edit <code>apps/extension/src/content/overlay.ts</code> line ~10:<br/>"
        "<code>const API_BASE = 'https://your-railway-url.up.railway.app/v1';</code><br/>"
        "Then: <code>cd apps/extension && pnpm build</code> → Load in Chrome or publish to store.",
        body_style
    ))

    # Final CTA
    story.append(Spacer(1, 30))
    story.append(Paragraph("✅ You're Live!", heading1))
    story.append(Paragraph(
        "Your LinkRevive instance is now serving users worldwide with:<br/>"
        "• Sub-2s cached responses<br/>"
        "• AI-powered explanations<br/>"
        "• Real-time browser extension<br/>"
        "• Auto-scaling infrastructure",
        body_style
    ))

    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "<i>Generated by Grok (xAI) • Senior Software Architect Mode • April 30, 2026</i>",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=HexColor("#94a3b8"), alignment=TA_CENTER)
    ))

    doc.build(story)
    print("✅ PDF created: LinkRevive_Deployment_Playbook.pdf")

if __name__ == "__main__":
    create_pdf()
