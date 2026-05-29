export async function openReportInBrowser(htmlContent: string) {
  try {
    const response = await fetch("/api/print-temp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ html: htmlContent }),
    });
    const data = await response.json();
    if (data.url) {
      window.open(data.url, "_blank");
    } else {
      console.error("Failed to get temp report URL:", data.error);
      fallbackPrint(htmlContent);
    }
  } catch (err) {
    console.error("Error sending report to server:", err);
    fallbackPrint(htmlContent);
  }
}

function fallbackPrint(htmlContent: string) {
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(htmlContent);
    w.document.close();
  }
}
