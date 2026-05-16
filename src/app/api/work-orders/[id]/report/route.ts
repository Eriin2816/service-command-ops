import { type NextRequest, NextResponse } from "next/server";
import { requireApiAuth, getTenantId } from "@/lib/auth/api-auth";
import { getWorkOrderById } from "@/lib/db/queries/work-orders";
import { listVisits } from "@/lib/db/queries/visits";
import { db } from "@/lib/db/client";
import PDFDocument from "pdfkit";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/work-orders/[id]/report
//
// Server-side PDF generation using pdfkit (Node.js native CJS).
// Returns binary PDF directly — no browser rendering required.
// pdfkit is listed in serverExternalPackages so webpack does not bundle it,
// preserving its internal require() calls for built-in font data.
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireApiAuth();
    if (!auth.ok) return auth.response;
    const tenantId = getTenantId(auth.session);

    const { id } = await params;

    // Fetch work order (already has joined property_customer_name / property_address)
    const workOrder = await getWorkOrderById(id, tenantId);
    if (!workOrder) {
      return NextResponse.json({ error: `Work order "${id}" not found` }, { status: 404 });
    }

    // Fetch visits (non-fatal)
    let visits: Awaited<ReturnType<typeof listVisits>> = [];
    try {
      visits = await listVisits({ work_order_id: id, tenant_id: tenantId });
    } catch (err) {
      console.error("[report] visits fetch:", err);
    }

    // Fetch tenant name (non-fatal)
    let companyName = "ServiceOps";
    try {
      const { data: tenant } = await db.from("tenants").select("name").eq("id", tenantId).maybeSingle();
      if (tenant?.name) companyName = tenant.name;
    } catch { /* use default */ }

    // Fetch property access notes if property is linked (non-fatal)
    let accessNotes: string | null = null;
    if (workOrder.property_id) {
      try {
        const { data: prop } = await db
          .from("properties")
          .select("access_notes")
          .eq("id", workOrder.property_id)
          .maybeSingle();
        accessNotes = prop?.access_notes ?? null;
      } catch { /* non-fatal */ }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    const fmtDate = (d: string | null | undefined) => {
      if (!d) return "N/A";
      return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    };

    const fmtLabel = (s: string) =>
      s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const statusColors: Record<string, string> = {
      new:             "#3B82F6",
      assigned:        "#8B5CF6",
      in_progress:     "#F59E0B",
      completed:       "#10B981",
      estimate_needed: "#F59E0B",
      cancelled:       "#6B7280",
    };

    // -------------------------------------------------------------------------
    // Build PDF
    // -------------------------------------------------------------------------
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 60, left: 50, right: 50 },
      info: {
        Title:   `Work Order Report — ${workOrder.wo_number}`,
        Author:  companyName,
        Subject: workOrder.title ?? "Work Order Completion Report",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const W = doc.page.width;   // 595.28
    const H = doc.page.height;  // 841.89
    const L = 50;               // left margin
    const R = W - 50;           // right edge
    const CONTENT_W = R - L;    // 495.28

    // Top accent bar
    doc.rect(0, 0, W, 5).fill("#06B6D4");

    // ── HEADER ──────────────────────────────────────────────────────────────
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#0F172A")
       .text(companyName, L, 22);

    doc.fontSize(8).font("Helvetica").fillColor("#94A3B8")
       .text("WORK ORDER COMPLETION REPORT", L, 47);

    // WO number top-right
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#06B6D4")
       .text(workOrder.wo_number, L, 22, { align: "right", width: CONTENT_W });

    // Status pill
    const statusBg = statusColors[workOrder.status] ?? "#6B7280";
    const statusText = fmtLabel(workOrder.status).toUpperCase();
    const pillW = 90;
    const pillX = R - pillW;
    doc.roundedRect(pillX, 42, pillW, 16, 4).fill(statusBg);
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#FFFFFF")
       .text(statusText, pillX, 47, { width: pillW, align: "center" });

    // Divider
    doc.moveTo(L, 72).lineTo(R, 72).strokeColor("#E2E8F0").lineWidth(1).stroke();

    // ── JOB TITLE + SUBTITLE ────────────────────────────────────────────────
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#0F172A")
       .text(workOrder.title ?? "Untitled Work Order", L, 82, { width: CONTENT_W });

    const titleBottom = doc.y;

    const hasProperty = !!(workOrder.property_customer_name || workOrder.property_address);
    const subtitle = hasProperty
      ? `${workOrder.property_customer_name ?? ""} · ${workOrder.property_address ?? ""}`.trim().replace(/^·\s*/, "")
      : "Property not linked";

    doc.fontSize(10).font("Helvetica").fillColor("#64748B")
       .text(subtitle, L, titleBottom + 4, { width: CONTENT_W });

    let yPos = doc.y + 18;

    // ── SECTION / FIELD HELPERS ─────────────────────────────────────────────
    function newPageIfNeeded(needed = 80) {
      if (yPos > H - needed) {
        doc.addPage();
        yPos = 50;
      }
    }

    function sectionLabel(label: string) {
      newPageIfNeeded(60);
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#94A3B8")
         .text(label, L, yPos);
      yPos = doc.y + 2;
      doc.moveTo(L, yPos).lineTo(R, yPos).strokeColor("#F1F5F9").lineWidth(0.5).stroke();
      yPos += 10;
    }

    // Two-column field row
    function fieldRow(
      label1: string, val1: string,
      label2?: string, val2?: string
    ) {
      const col2X = L + CONTENT_W / 2 + 10;
      doc.fontSize(8).font("Helvetica").fillColor("#94A3B8").text(label1, L, yPos);
      if (label2) doc.text(label2, col2X, yPos);
      yPos = doc.y + 2;
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#1E293B")
         .text(val1 || "N/A", L, yPos, { width: CONTENT_W / 2 - 10 });
      if (label2) {
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#1E293B")
           .text(val2 || "N/A", col2X, yPos, { width: CONTENT_W / 2 - 10 });
      }
      yPos = doc.y + 12;
    }

    // ── JOB INFORMATION ─────────────────────────────────────────────────────
    sectionLabel("JOB INFORMATION");
    fieldRow(
      "SERVICE CATEGORY", fmtLabel(workOrder.service_category ?? "N/A"),
      "PRIORITY",         fmtLabel(workOrder.priority ?? "N/A")
    );
    fieldRow(
      "SCHEDULED DATE", fmtDate(workOrder.scheduled_date),
      "COMPLETED DATE",  fmtDate(workOrder.completed_at)
    );
    fieldRow("CREATED", fmtDate(workOrder.created_at));
    yPos += 6;

    // ── DESCRIPTION ─────────────────────────────────────────────────────────
    if (workOrder.description) {
      sectionLabel("DESCRIPTION");
      doc.fontSize(10).font("Helvetica").fillColor("#374151")
         .text(workOrder.description, L, yPos, { width: CONTENT_W, lineGap: 3 });
      yPos = doc.y + 16;
    }

    // ── PROPERTY ────────────────────────────────────────────────────────────
    if (hasProperty) {
      sectionLabel("PROPERTY DETAILS");
      fieldRow(
        "CUSTOMER NAME",   workOrder.property_customer_name ?? "N/A",
        "SERVICE ADDRESS", workOrder.property_address ?? "N/A"
      );
      if (accessNotes) {
        doc.fontSize(8).font("Helvetica").fillColor("#94A3B8").text("ACCESS NOTES", L, yPos);
        yPos = doc.y + 2;
        // Amber note block
        const noteLines = Math.max(1, Math.ceil(accessNotes.length / 85));
        const noteH = 10 + noteLines * 14 + 8;
        doc.roundedRect(L, yPos, CONTENT_W, noteH, 4).fill("#FFFBEB");
        doc.fontSize(10).font("Helvetica").fillColor("#92400E")
           .text(accessNotes, L + 8, yPos + 8, { width: CONTENT_W - 16, lineGap: 3 });
        yPos = doc.y + 16;
      }
      yPos += 6;
    }

    // ── VISITS & CHECKLISTS ──────────────────────────────────────────────────
    sectionLabel("VISIT RECORDS & CHECKLISTS");

    if (visits.length === 0) {
      doc.fontSize(10).font("Helvetica").fillColor("#94A3B8")
         .text("No visits recorded for this work order.", L, yPos);
      yPos = doc.y + 16;
    } else {
      for (const visit of visits) {
        const items = Array.isArray(visit.checklist) ? visit.checklist : [];
        const completedCount = items.filter((i) => i.completed).length;

        // Estimate block height to decide if new page needed
        const blockH = 28 + (items.length > 0 ? 16 + items.length * 18 : 18)
          + (visit.technician_notes ? 50 : 0);
        newPageIfNeeded(blockH + 20);

        // Visit header bar
        doc.roundedRect(L, yPos, CONTENT_W, 22, 4).fill("#F1F5F9");
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#0F172A")
           .text(`Visit — ${fmtDate(visit.scheduled_date)}`, L + 8, yPos + 6);
        doc.fontSize(8).font("Helvetica").fillColor("#64748B")
           .text(fmtLabel(visit.status ?? "unknown").toUpperCase(), L, yPos + 7,
             { width: CONTENT_W - 8, align: "right" });
        yPos += 28;

        // Checklist progress
        if (items.length > 0) {
          doc.fontSize(8).font("Helvetica").fillColor("#64748B")
             .text(`${completedCount} of ${items.length} items completed`, L + 8, yPos);
          yPos = doc.y + 8;

          for (const item of items) {
            newPageIfNeeded(30);
            if (item.completed) {
              doc.roundedRect(L + 8, yPos, 12, 12, 2).fill("#ECFDF5");
              doc.fillColor("#059669").fontSize(9).font("Helvetica-Bold")
                 .text("✓", L + 11, yPos + 1);
            } else {
              doc.roundedRect(L + 8, yPos, 12, 12, 2).fillAndStroke("#F8FAFC", "#E2E8F0");
              doc.fillColor("#CBD5E1").fontSize(9).font("Helvetica")
                 .text("○", L + 12, yPos + 1);
            }
            doc.fontSize(10).font("Helvetica")
               .fillColor(item.completed ? "#374151" : "#94A3B8")
               .text(item.label ?? "", L + 26, yPos + 1, { width: CONTENT_W - 34 });
            yPos = doc.y + 6;
          }
        } else {
          doc.fontSize(10).font("Helvetica").fillColor("#94A3B8")
             .text("No checklist items recorded.", L + 8, yPos);
          yPos = doc.y + 10;
        }

        // Technician notes
        if (visit.technician_notes) {
          newPageIfNeeded(60);
          yPos += 4;
          const noteLines = Math.max(1, Math.ceil(visit.technician_notes.length / 85));
          const noteBlockH = 14 + noteLines * 14 + 10;
          doc.roundedRect(L + 8, yPos, CONTENT_W - 8, noteBlockH, 4).fill("#FFFBEB");
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#92400E")
             .text("TECHNICIAN NOTES", L + 16, yPos + 6);
          yPos = doc.y + 4;
          doc.fontSize(10).font("Helvetica").fillColor("#78350F")
             .text(visit.technician_notes, L + 16, yPos, { width: CONTENT_W - 32, lineGap: 3 });
          yPos = doc.y + 12;
        }

        yPos += 14;
      }
    }

    // ── FOOTER (fixed to bottom of last page) ────────────────────────────────
    const footerY = H - 45;
    doc.moveTo(L, footerY).lineTo(R, footerY).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
    doc.fontSize(8).font("Helvetica").fillColor("#94A3B8")
       .text(`Generated by ${companyName} via ServiceOps`, L, footerY + 8);
    doc.text(new Date().toLocaleString("en-US"), L, footerY + 8, { align: "center", width: CONTENT_W });
    doc.text(workOrder.wo_number, L, footerY + 8, { align: "right", width: CONTENT_W });

    // ── Finalize ─────────────────────────────────────────────────────────────
    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    const filename = `ServiceOps-${workOrder.wo_number}-Report.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length":      String(pdfBuffer.length),
        "Cache-Control":       "private, no-cache",
      },
    });

  } catch (error) {
    console.error("[PDF Report] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate report", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
