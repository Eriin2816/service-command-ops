"use client";

export async function downloadReportAsPDF(
  htmlContent: string,
  filename: string
): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "0";
  container.style.left = "0";
  container.style.zIndex = "-9999";
  container.style.pointerEvents = "none";
  container.style.opacity = "0";
  container.style.width = "794px"; // A4 at 96 dpi
  container.style.backgroundColor = "white";
  container.style.padding = "0";
  container.style.margin = "0";
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  // Give fonts/layout time to settle
  await new Promise((resolve) => setTimeout(resolve, 800));

  try {
    // Hide the "Print / Save as PDF" button that's only for standalone HTML view
    const printBtn = container.querySelector(".no-print") as HTMLElement | null;
    if (printBtn) printBtn.style.display = "none";

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: 794,
      height: container.scrollHeight,
      windowWidth: 794,
      windowHeight: container.scrollHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    const imgData = canvas.toDataURL("image/png", 1.0);

    let heightLeft = imgHeight;
    let position = 0;
    let pageNumber = 0;

    while (heightLeft > 0) {
      if (pageNumber > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;
      position -= pdfHeight;
      pageNumber++;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
