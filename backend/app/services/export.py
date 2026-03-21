import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)


def generate_pdf(queries: list) -> bytes:
    """
    Generate a PDF report from a list of WeatherQuery ORM objects.
    Returns the PDF as bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=20,
        spaceAfter=20,
        textColor=colors.HexColor("#1a1a2e"),
    )
    heading_style = ParagraphStyle(
        "CustomHeading",
        parent=styles["Heading2"],
        fontSize=14,
        spaceAfter=8,
        textColor=colors.HexColor("#16213e"),
    )
    body_style = ParagraphStyle(
        "CustomBody",
        parent=styles["Normal"],
        fontSize=10,
        spaceAfter=6,
        leading=14,
    )

    elements = []

    # Title
    elements.append(Paragraph("Weather App — Query Export", title_style))
    elements.append(
        Paragraph("PM Accelerator Technical Assessment", body_style)
    )
    elements.append(Spacer(1, 0.3 * inch))

    if not queries:
        elements.append(Paragraph("No weather queries found.", body_style))
        doc.build(elements)
        return buffer.getvalue()

    for i, q in enumerate(queries):
        # Header for each query
        elements.append(
            Paragraph(f"Query #{q.id}: {q.location_query}", heading_style)
        )

        # Info table
        info_data = [
            ["Resolved Location", q.resolved_name or "N/A"],
            ["Coordinates", f"{q.latitude}, {q.longitude}" if q.latitude else "N/A"],
            ["Country", f"{q.country or 'N/A'} ({q.country_code or ''})"],
            ["Query Type", q.query_type or "free_form"],
            [
                "Date Range",
                f"{q.date_start} → {q.date_end}"
                if q.date_start
                else "Current / default",
            ],
            [
                "Searched On",
                q.created_at.strftime("%Y-%m-%d %H:%M:%S") if q.created_at else "N/A",
            ],
        ]

        info_table = Table(info_data, colWidths=[1.8 * inch, 4.5 * inch])
        info_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e8f0fe")),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("PADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        elements.append(info_table)
        elements.append(Spacer(1, 0.15 * inch))

        # Current weather
        cw = q.current_weather
        if cw and isinstance(cw, dict):
            elements.append(Paragraph("Current Weather", heading_style))
            cw_data = [
                ["Temperature", f"{cw.get('temperature', 'N/A')} °C"],
                ["Wind Speed", f"{cw.get('windspeed', 'N/A')} km/h"],
                ["Humidity", f"{cw.get('humidity', 'N/A')}%"],
                ["Condition", cw.get("weather_description", "N/A")],
            ]
            cw_table = Table(cw_data, colWidths=[1.8 * inch, 4.5 * inch])
            cw_table.setStyle(
                TableStyle(
                    [
                        ("FONTSIZE", (0, 0), (-1, -1), 9),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                        ("PADDING", (0, 0), (-1, -1), 5),
                    ]
                )
            )
            elements.append(cw_table)
            elements.append(Spacer(1, 0.15 * inch))

        # Forecast table
        fc = q.forecast_data
        if fc and isinstance(fc, list) and len(fc) > 0:
            elements.append(Paragraph("Forecast", heading_style))
            fc_header = ["Date", "High (°C)", "Low (°C)", "Condition"]
            fc_rows = [fc_header]
            for day in fc:
                fc_rows.append(
                    [
                        day.get("date", ""),
                        str(day.get("temp_max", "")),
                        str(day.get("temp_min", "")),
                        day.get("weather_description", ""),
                    ]
                )

            fc_table = Table(fc_rows, colWidths=[1.5 * inch, 1.2 * inch, 1.2 * inch, 2.4 * inch])
            fc_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, -1), 9),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
                        ("ALIGN", (1, 0), (2, -1), "CENTER"),
                        ("PADDING", (0, 0), (-1, -1), 5),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
                    ]
                )
            )
            elements.append(fc_table)
            elements.append(Spacer(1, 0.15 * inch))

        # Wikipedia summary
        if q.wiki_summary:
            elements.append(Paragraph("About this Location", heading_style))
            # Truncate long summaries for PDF
            summary_text = q.wiki_summary[:800]
            if len(q.wiki_summary) > 800:
                summary_text += "..."
            elements.append(Paragraph(summary_text, body_style))

        # Separator between queries
        if i < len(queries) - 1:
            elements.append(Spacer(1, 0.2 * inch))
            elements.append(HRFlowable(width="100%", color=colors.HexColor("#cccccc")))
            elements.append(Spacer(1, 0.2 * inch))

    doc.build(elements)
    return buffer.getvalue()
