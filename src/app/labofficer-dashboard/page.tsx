"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { openReportInBrowser } from "@/lib/printHelper";

interface FoodRegister {
  id: number;
  sample_date: string;
  collection_time: string;
  sample_number: string;
  reference_number: string;
  sample_type: string;
  phi_area: string;
  moh_area: string;
  analysis_details: string;
  handed_over_by: string;
  analyzed_by?: string;
  created_at: string;
  updated_at: string;
}

export default function LabOfficerDashboard() {
  const router = useRouter();

  const [rows, setRows] = useState<FoodRegister[]>([]);
  const [search, setSearch] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    sample_date: "",
    collection_time: "",
    reference_number: "",
    sample_type: "",
    phi_area: "",
    moh_area: "",
    analysis_details: "",
    handed_over_by: "",
    analyzed_by: "",
  });

  const [newForm, setNewForm] = useState({
    sample_date: "",
    collection_time: "",
    reference_number: "",
    sample_type: "",
    phi_area: "",
    moh_area: "",
    analysis_details: "",
    handed_over_by: "",
    analyzed_by: "",
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const emptyForm = {
    sample_date: "",
    collection_time: "",
    reference_number: "",
    sample_type: "",
    phi_area: "",
    moh_area: "",
    analysis_details: "",
    handed_over_by: "",
    analyzed_by: "",
  };

  const formatDateLong = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const fetchRows = async (q = "") => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/labofficer?search=${encodeURIComponent(q)}`,
      );
      const data = await res.json();
      if (Array.isArray(data)) setRows(data);
      else
        showMessage("Error loading data: " + (data.error || "Unknown error"));
    } catch {
      showMessage("Network error. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    setIsAdmin(localStorage.getItem("role") === "Admin");
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const createRow = async () => {
    const res = await fetch("/api/labofficer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    const data = await res.json();
    showMessage(data.message || data.error);
    if (!data.error) {
      setNewForm(emptyForm);
      fetchRows(search);
    }
  };

  const startEdit = (row: FoodRegister) => {
    setEditingId(row.id);
    setEditForm({
      sample_date: row.sample_date || "",
      collection_time: row.collection_time || "",
      reference_number: row.reference_number || "",
      sample_type: row.sample_type || "",
      phi_area: row.phi_area || "",
      moh_area: row.moh_area || "",
      analysis_details: row.analysis_details || "",
      handed_over_by: row.handed_over_by || "",
      analyzed_by: row.analyzed_by || "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await fetch("/api/labofficer", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, ...editForm }),
    });
    const data = await res.json();
    showMessage(data.message || data.error);
    setEditingId(null);
    fetchRows(search);
  };

  const deleteRow = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    const res = await fetch("/api/labofficer", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    showMessage(data.message || data.error);
    fetchRows(search);
  };

  const handlePrint = (row: FoodRegister) => {
    const displaySampleNumber = row.sample_number || "";
    const sampleDateFormatted = formatDateLong(row.sample_date);
    const currentDateTime = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const html = `<!DOCTYPE html><html><head><title>Food Lab Worksheet</title>
<style>* { box-sizing: border-box; margin: 0; padding: 0; } @page { size: A4 portrait; margin: 0; } html, body { width: 210mm; height: 297mm; font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; } .page { width: 210mm; height: 297mm; padding: 10mm 15mm; display: flex; flex-direction: column; overflow: hidden; page-break-after: always; position: relative; } .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 55px; color: rgba(0, 0, 0, 0.08); white-space: nowrap; pointer-events: none; z-index: 10; font-weight: bold; } .header { display: grid; grid-template-columns: 80px 1fr 80px; align-items: center; border: 1px solid #000; padding: 10px; } .header .logo img { width: 65px; height: 65px; object-fit: contain; } .header .title-block { text-align: center; } .header .title-block h1 { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0; } .header .title-block .sinhala { font-size: 18px; font-weight: bold; margin-top: 4px; } table { width: 100%; border-collapse: collapse; table-layout: fixed; } td { border: 1px solid #000; padding: 4px 10px; vertical-align: middle; overflow: hidden; } .doc-table td { font-size: 11px; height: 24px; } .sample-num-row { display: flex; border: 1px solid #000; border-top: none; align-items: stretch; } .sample-num-label { font-size: 15px; font-weight: bold; padding: 12px 15px; width: 35%; border-right: 1px solid #000; display: flex; align-items: center; } .sample-num-value { font-size: 15px; font-weight: bold; padding: 12px 15px; flex: 1; display: flex; align-items: center; } .detail-table td { height: 36px; font-size: 12px; } .lbl { font-weight: normal; } .two-col { display: flex; border-left: 1px solid #000; border-right: 1px solid #000; flex: 1; min-height: 200px; } .two-col .col-left { width: 50%; border-right: 1px solid #000; padding: 10px; display: flex; flex-direction: column; } .two-col .col-right { width: 50%; padding: 10px; } .col-header { font-weight: bold; font-size: 12px; margin: -10px -10px 8px -10px; padding: 10px; border-bottom: 1px solid #000; } .remarks { margin-top: auto; padding-top: 10px; font-size: 11px; font-weight: bold; } .bottom-table td { height: 42px; font-size: 12px; } .footer { margin-top: auto; padding: 5px 0; font-size: 9px; text-align: center; border-top: 1px solid #ccc; color: #555; } @media print { html, body { width: 210mm; } .page { height: 297mm; } }</style>
</head><body><div class="page"><div class="watermark">Provincial Food Laboratory (NWP)</div>
<div class="header"><div class="logo"><img src="${window.location.origin}/logo.png" alt="Logo" /></div><div class="title-block"><h1>Provincial Food Laboratory(NWP)</h1><div class="sinhala">පළාත් ආහාර රසායනාගාරය (වයඹ පළාත)</div></div><div></div></div>
<table class="doc-table" style="border-top:none;"><colgroup><col style="width:50%;"><col style="width:50%;"></colgroup><tr><td>Work Sheet (${row.sample_type || "Spices"})</td><td>PFL/7.5/F/24</td></tr><tr><td>Revision no:03</td><td>Issue no:01</td></tr><tr><td>Date of Revision: 01/01/2024</td><td>Date of issue: ${currentDateTime}</td></tr><tr><td>Reviewed by: C</td><td>Approved by: AAA</td></tr></table>
<div class="sample-num-row"><div class="sample-num-label">Sample Number</div><div class="sample-num-value">&nbsp;${displaySampleNumber}</div></div>
<table class="detail-table" style="border-top:none;"><colgroup><col style="width:35%;"><col style="width:25%;"><col style="width:15%;"><col style="width:25%;"></colgroup>
<tr><td class="lbl">Type of Sample</td><td colspan="3">${row.sample_type || ""}</td></tr>
<tr><td class="lbl">Reference Number</td><td colspan="3">${row.reference_number || ""}</td></tr>
<tr><td class="lbl">PHI Area</td><td>${row.phi_area || ""}</td><td style="text-align:right;">MOH Area</td><td>${row.moh_area || ""}</td></tr>
<tr><td class="lbl">Handed Over By</td><td>${row.handed_over_by || ""}</td><td style="text-align:right;">Analyst</td><td>${row.analyzed_by || "—"}</td></tr>
<tr><td class="lbl">Time and Date of collection</td><td>Time: ${row.collection_time || ""}</td><td style="text-align:right;">Date:</td><td>${sampleDateFormatted}</td></tr>
<tr><td class="lbl">Area of address</td><td colspan="3"></td></tr>
<tr><td class="lbl">Quantity of sample received</td><td></td><td colspan="2">Sufficient for duplicate analysis: <strong>Yes / No</strong></td></tr>
<tr><td class="lbl">Nature of Sample</td><td colspan="3"><strong>Formal &nbsp;&nbsp; / &nbsp;&nbsp; Informal</strong></td></tr>
<tr><td class="lbl">Date sent to public analyst</td><td colspan="3"></td></tr>
<tr><td class="lbl">Starting date of Analysis</td><td></td><td style="text-align:right;">End date</td><td></td></tr>
<tr><td class="lbl">Date/s of Analysis</td><td colspan="3"></td></tr>
</table>
<div class="two-col"><div class="col-left"><div class="col-header">Outer label/Pack</div><div class="remarks">Remarks:</div></div><div class="col-right"><div class="col-header">Inner label/ Sample</div></div></div>
<table class="bottom-table" style="border-top:none;"><colgroup><col style="width:35%;"><col style="width:65%;"></colgroup><tr><td class="lbl">Physical appearance:</td><td><strong>Powder / cores / grains / other</strong></td></tr><tr><td class="lbl">Sample Preparation:</td><td></td></tr></table>
<div class="footer">Provincial Food Laboratory (NWP) &nbsp;|&nbsp; This document is computer generated &nbsp;|&nbsp; Page 1 of 1</div>
</div><script>window.onload = function() { window.print(); };</script></body></html>`;

    openReportInBrowser(html);
  };

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) return alert("Please select samples first");
    const selectedRows = rows.filter((r) => selectedIds.includes(r.id));
    const currentDateTime = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    let pagesHtml = "";
    selectedRows.forEach((row) => {
      const sampleDateFormatted = formatDateLong(row.sample_date);
      pagesHtml += `
            <div class="page"><div class="watermark">Provincial Food Laboratory (NWP)</div>
                <div class="header"><div class="logo"><img src="${window.location.origin}/logo.png" alt="Logo" /></div><div class="title-block"><h1>Provincial Food Laboratory(NWP)</h1><div class="sinhala">පළාත් ආහාර රසායනාගාරය (වයඹ පළාත)</div></div><div></div></div>
                <table class="doc-table" style="border-top:none;"><colgroup><col style="width:50%;"><col style="width:50%;"></colgroup><tr><td>Work Sheet (${row.sample_type || "Spices"})</td><td>PFL/7.5/F/24</td></tr><tr><td>Revision no:03</td><td>Issue no:01</td></tr><tr><td>Date of Revision: 01/01/2024</td><td>Date of issue: ${currentDateTime}</td></tr><tr><td>Reviewed by: C</td><td>Approved by: AAA</td></tr></table>
                <div class="sample-num-row"><div class="sample-num-label">Sample Number</div><div class="sample-num-value">PFLF/&nbsp;${row.sample_number}</div></div>
                <table class="detail-table" style="border-top:none;"><colgroup><col style="width:35%;"><col style="width:25%;"><col style="width:15%;"><col style="width:25%;"></colgroup>
                <tr><td class="lbl">Type of Sample</td><td colspan="3">${row.sample_type || ""}</td></tr>
                <tr><td class="lbl">Reference Number</td><td colspan="3">${row.reference_number || ""}</td></tr>
                <tr><td class="lbl">PHI Area</td><td>${row.phi_area || ""}</td><td style="text-align:right;">MOH Area</td><td>${row.moh_area || ""}</td></tr>
                <tr><td class="lbl">Handed Over By</td><td>${row.handed_over_by || ""}</td><td style="text-align:right;">Analyst</td><td>${row.analyzed_by || "—"}</td></tr>
                <tr><td class="lbl">Time and Date of collection</td><td>Time: ${row.collection_time || ""}</td><td style="text-align:right;">Date:</td><td>${sampleDateFormatted}</td></tr>
                <tr><td class="lbl">Area of address</td><td colspan="3"></td></tr>
                <tr><td class="lbl">Quantity of sample received</td><td></td><td colspan="2">Sufficient for duplicate analysis: <strong>Yes / No</strong></td></tr>
                <tr><td class="lbl">Nature of Sample</td><td colspan="3"><strong>Formal &nbsp;&nbsp; / &nbsp;&nbsp; Informal</strong></td></tr>
                <tr><td class="lbl">Date sent to public analyst</td><td colspan="3"></td></tr>
                <tr><td class="lbl">Starting date of Analysis</td><td></td><td style="text-align:right;">End date</td><td></td></tr>
                <tr><td class="lbl">Date/s of Analysis</td><td colspan="3"></td></tr>
                </table>
                <div class="two-col"><div class="col-left"><div class="col-header">Outer label/Pack</div><div class="remarks">Remarks:</div></div><div class="col-right"><div class="col-header">Inner label/ Sample</div></div></div>
                <table class="bottom-table" style="border-top:none;"><colgroup><col style="width:35%;"><col style="width:65%;"></colgroup><tr><td class="lbl">Physical appearance:</td><td><strong>Powder / cores / grains / other</strong></td></tr><tr><td class="lbl">Sample Preparation:</td><td></td></tr></table>
                <div class="footer">Provincial Food Laboratory (NWP) &nbsp;|&nbsp; Page 1 of 1</div>
            </div>`;
    });

    const html = `<!DOCTYPE html><html><head><title>Bulk Food Lab Worksheets</title>
<style>* { box-sizing: border-box; margin: 0; padding: 0; } @page { size: A4 portrait; margin: 0; } html, body { width: 210mm; font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; } .page { width: 210mm; height: 297mm; padding: 10mm 15mm; display: flex; flex-direction: column; overflow: hidden; page-break-after: always; } .header { display: grid; grid-template-columns: 80px 1fr 80px; align-items: center; border: 1px solid #000; padding: 10px; } .header .logo img { width: 65px; height: 65px; object-fit: contain; } .header .title-block { text-align: center; } .header .title-block h1 { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0; } .header .title-block .sinhala { font-size: 18px; font-weight: bold; margin-top: 4px; } table { width: 100%; border-collapse: collapse; table-layout: fixed; } td { border: 1px solid #000; padding: 4px 10px; vertical-align: middle; } .doc-table td { height: 24px; } .sample-num-row { display: flex; border: 1px solid #000; border-top: none; } .sample-num-label, .sample-num-value { font-size: 15px; font-weight: bold; padding: 12px 15px; display: flex; align-items: center; } .sample-num-label { width: 35%; border-right: 1px solid #000; } .sample-num-value { flex: 1; } .detail-table td { height: 36px; font-size: 12px; } .two-col { display: flex; border-left: 1px solid #000; border-right: 1px solid #000; flex: 1; min-height: 200px; } .col-left { width: 50%; border-right: 1px solid #000; padding: 10px; display: flex; flex-direction: column; } .col-right { width: 50%; padding: 10px; } .col-header { font-weight: bold; margin: -10px -10px 8px -10px; padding: 10px; border-bottom: 1px solid #000; } .remarks { margin-top: auto; font-weight: bold; } .bottom-table td { height: 42px; font-size: 12px; } .footer { margin-top: auto; padding: 5px 0; font-size: 9px; text-align: center; border-top: 1px solid #ccc; color: #555; } .page { position: relative; } .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 55px; color: rgba(0, 0, 0, 0.08); white-space: nowrap; pointer-events: none; z-index: 10; font-weight: bold; }</style>
</head><body>${pagesHtml}<script>window.onload = function() { window.print(); };</script></body></html>`;

    openReportInBrowser(html);
  };

  const handleBulkSummaryReport = (insertDate: boolean = true) => {
    if (selectedIds.length === 0) return alert("Please select samples first");
    const selectedRows = rows.filter((r) => selectedIds.includes(r.id));
    generateSummaryReportHtml(selectedRows, insertDate);
  };

  const handleSingleSummaryReport = (row: FoodRegister) => {
    generateSummaryReportHtml([row], true);
  };

  const generateSummaryReportHtml = (
    selectedRows: FoodRegister[],
    insertDate: boolean = true,
    title: string = "Summary Report of Selected Food Samples",
  ) => {
    const html = `<!DOCTYPE html><html><head><title>Selected Samples Form</title>
<style>
    body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
    h1 { text-align: center; color: #333; margin-bottom: 20px; }
    .header-info { text-align: center; margin-bottom: 30px; font-style: italic; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #444; padding: 10px 8px; text-align: left; }
    th { background: #f4f4f4; font-weight: bold; text-transform: uppercase; font-size: 11px; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    @page { margin: 15mm; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 60px; color: rgba(0, 0, 0, 0.08); white-space: nowrap; pointer-events: none; z-index: 10; font-weight: bold; }
</style>
</head><body>
    <div class="watermark">Provincial Food Laboratory (NWP)</div>
    <h1>Provincial Food Laboratory (NWP)</h1>
    <div class="header-info">${title}</div>
    <table>
        <thead>
            <tr>
                <th style="width: 100px;">Date</th>
                <th style="width: 120px;">Sample Number</th>
                <th>Reference Number</th>
                <th>Sample Type</th>
                <th>PHI Area</th>
                <th>MOH Area</th>
                <th>Analyst</th>
                <th>Handed Over By</th>
            </tr>
        </thead>
        <tbody>
            ${selectedRows
              .map(
                (r) => `
                <tr>
                    <td style="height: 30px;">${insertDate && r.sample_date ? formatDateLong(r.sample_date) : ""}</td>
                    <td style="font-weight: bold;">${r.sample_number || ""}</td>
                    <td>${r.reference_number || ""}</td>
                    <td>${r.sample_type || ""}</td>
                    <td>${r.phi_area || ""}</td>
                    <td>${r.moh_area || ""}</td>
                    <td style="font-weight: 600; color: #1e40af;">${r.analyzed_by || "—"}</td>
                    <td>${r.handed_over_by || ""}</td>
                </tr>
            `,
              )
              .join("")}
        </tbody>
    </table>
    <div style="margin-top: 40px; text-align: right;">
        <div style="border-top: 1px solid #000; display: inline-block; width: 200px; text-align: center; padding-top: 5px;">
            Authorized Signature
        </div>
    </div>
    <script>window.onload = function() { window.print(); };</script>
</body></html>`;

    openReportInBrowser(html);
  };

  const handleDateRangeReport = () => {
    if (!dateRange.start || !dateRange.end)
      return alert("Please select both start and end dates");
    const filtered = rows.filter((r) => {
      const date = new Date(r.sample_date);
      return (
        date >= new Date(dateRange.start) && date <= new Date(dateRange.end)
      );
    });

    if (filtered.length === 0)
      return alert("No records found in this date range");

    const html = `<!DOCTYPE html><html><head><title>Date Range Report</title>
<style>
    body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
    h1 { text-align: center; color: #333; margin-bottom: 20px; }
    .header-info { text-align: center; margin-bottom: 30px; font-style: italic; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #444; padding: 10px 8px; text-align: left; }
    th { background: #f4f4f4; font-weight: bold; text-transform: uppercase; font-size: 11px; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    @page { margin: 15mm; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 60px; color: rgba(0, 0, 0, 0.08); white-space: nowrap; pointer-events: none; z-index: 10; font-weight: bold; }
</style>
</head><body>
    <div class="watermark">Provincial Food Laboratory (NWP)</div>
    <h1>Provincial Food Laboratory (NWP)</h1>
    <div class="header-info">Summary Report of Food Samples from ${formatDateLong(dateRange.start)} to ${formatDateLong(dateRange.end)}</div>
    <table>
        <thead>
            <tr>
                <th style="width: 50px;">ID</th>
                <th style="width: 100px;">Sample Date</th>
                <th style="width: 120px;">Sample No.</th>
                <th>Type</th>
                <th>PHI Area</th>
                <th>MOH Area</th>
                <th>Ref No.</th>
                <th>Analyst</th>
                <th>Handed Over By</th>
            </tr>
        </thead>
        <tbody>
            ${filtered
              .map(
                (r) => `
                <tr>
                    <td>${r.id}</td>
                    <td>${formatDateLong(r.sample_date)}</td>
                    <td style="font-weight: bold;">${r.sample_number}</td>
                    <td>${r.sample_type}</td>
                    <td>${r.phi_area || "—"}</td>
                    <td>${r.moh_area || "—"}</td>
                    <td>${r.reference_number || "—"}</td>
                    <td style="font-weight: 600;">${r.analyzed_by || "—"}</td>
                    <td>${r.handed_over_by || "—"}</td>
                </tr>
            `,
              )
              .join("")}
        </tbody>
    </table>
    <div style="margin-top: 40px; text-align: right;">
        <div style="border-top: 1px solid #000; display: inline-block; width: 200px; text-align: center; padding-top: 5px;">
            Authorized Signature
        </div>
    </div>
    <script>window.onload = function() { window.print(); };</script>
</body></html>`;

    openReportInBrowser(html);
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === rows.length) setSelectedIds([]);
    else setSelectedIds(rows.map((r) => r.id));
  };

  const TYPE_BADGE: Record<string, string> = {
    Water: "badge badge-primary",
    Spices: "badge badge-warn",
    Salt: "badge badge-success",
  };

  return (
    <div>
      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="topbar-brand">
          <span style={{ fontSize: "1.25rem" }}>📋</span>
          <span style={{ color: "var(--primary)", fontWeight: 800 }}>
            Lab Officer
          </span>
          <span>Dashboard</span>
        </div>
        <div className="topbar-actions">
          {isAdmin && (
            <button
              onClick={() => router.push("/admin-dashboard")}
              className="btn btn-ghost btn-sm"
            >
              🛡️ Admin Panel
            </button>
          )}

          <button
            onClick={() => {
              localStorage.removeItem("role");
              router.push("/user-login");
            }}
            className="btn btn-danger btn-sm"
          >
            🔑 Logout
          </button>
        </div>
      </div>

      <div className="page-wrapper">
        {message && (
          <div className="alert alert-success fade-in">✅ {message}</div>
        )}

        {/* ── Register Form ── */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-title">➕ Register New Food Sample</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1rem",
            }}
          >
            <div>
              <label className="form-label">Sample Date</label>
              <input
                type="date"
                className="form-input"
                value={newForm.sample_date}
                onChange={(e) =>
                  setNewForm({ ...newForm, sample_date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="form-label">Collection Time</label>
              <input
                type="time"
                className="form-input"
                value={newForm.collection_time}
                onChange={(e) =>
                  setNewForm({ ...newForm, collection_time: e.target.value })
                }
              />
            </div>
            <div>
              <label className="form-label">Reference Number</label>
              <input
                className="form-input"
                placeholder="e.g. REF-001"
                value={newForm.reference_number}
                onChange={(e) =>
                  setNewForm({ ...newForm, reference_number: e.target.value })
                }
              />
            </div>
            <div>
              <label className="form-label">Sample Type</label>
              <select
                className="form-select"
                value={newForm.sample_type}
                onChange={(e) =>
                  setNewForm({ ...newForm, sample_type: e.target.value })
                }
              >
                <option value="">Select type…</option>
                <option value="Water">Water</option>
                <option value="Spices">Spices</option>
                <option value="Salt">Salt</option>
              </select>
            </div>
            <div>
              <label className="form-label">PHI Area</label>
              <input
                className="form-input"
                placeholder="PHI Area"
                value={newForm.phi_area}
                onChange={(e) =>
                  setNewForm({ ...newForm, phi_area: e.target.value })
                }
              />
            </div>
            <div>
              <label className="form-label">MOH Area</label>
              <input
                className="form-input"
                placeholder="MOH Area"
                value={newForm.moh_area}
                onChange={(e) =>
                  setNewForm({ ...newForm, moh_area: e.target.value })
                }
              />
            </div>
            <div>
              <label className="form-label">Handed Over By</label>
              <input
                className="form-input"
                placeholder="Name"
                value={newForm.handed_over_by}
                onChange={(e) =>
                  setNewForm({ ...newForm, handed_over_by: e.target.value })
                }
              />
            </div>
            <div>
              <label className="form-label">Assign Analyst</label>
              <input
                className="form-input"
                placeholder="Analyst Name"
                value={newForm.analyzed_by}
                onChange={(e) =>
                  setNewForm({ ...newForm, analyzed_by: e.target.value })
                }
              />
            </div>
            <div>
              <label className="form-label">Analysis Details</label>
              <input
                className="form-input"
                placeholder="Details"
                value={newForm.analysis_details}
                onChange={(e) =>
                  setNewForm({ ...newForm, analysis_details: e.target.value })
                }
              />
            </div>
          </div>
          <div
            style={{
              marginTop: "1.25rem",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button onClick={createRow} className="btn btn-primary">
              ✓ Register Sample
            </button>
          </div>
        </div>

        {/* ── Bulk Actions & Date Range Reporting ── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            gap: "1.25rem",
            marginBottom: "1.5rem",
            background: "#f8fafc",
            padding: "1.5rem",
            borderRadius: "0.75rem",
            border: "1px dashed var(--border)",
          }}
        >
          <div style={{ flex: 1, minWidth: "300px" }}>
            <div
              style={{
                marginBottom: "0.75rem",
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              📜 Date Range Summary Report
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                />
              </div>
              <button
                onClick={handleDateRangeReport}
                className="btn btn-primary"
                style={{ height: "42px", marginTop: "1.6rem" }}
              >
                📑 Generate Report
              </button>
            </div>
          </div>

          <div
            style={{
              borderLeft: "1px solid #e2e8f0",
              paddingLeft: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              📦 Bulk Actions ({selectedIds.length} selected)
            </div>
            <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
              <button
                onClick={handleBulkPrint}
                disabled={selectedIds.length === 0}
                className="btn btn-outline-primary"
              >
                🖨️ Print Selected Sheets
              </button>
              <button
                onClick={() => handleBulkSummaryReport(true)}
                disabled={selectedIds.length === 0}
                className="btn btn-outline-primary"
              >
                📋 Generate Summary Form
              </button>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setSelectedIds([])}
                  className="btn btn-ghost"
                >
                  Deselect All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Search ── */}
        <div style={{ display: "flex", gap: "0.625rem", marginBottom: "1rem" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              className="form-input"
              placeholder="🔍 Search by sample number, ref. no, or area…"
              style={{ width: "100%" }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                // Real-time search with debounce
                const q = e.target.value;
                if (searchTimeout.current) clearTimeout(searchTimeout.current);
                searchTimeout.current = setTimeout(() => {
                  fetchRows(q);
                }, 300);
              }}
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {isLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4rem",
                gap: "0.75rem",
                color: "var(--muted)",
              }}
            >
              <svg
                style={{
                  width: "1.25rem",
                  height: "1.25rem",
                  animation: "spin 1s linear infinite",
                }}
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeOpacity="0.25"
                />
                <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Loading records…
            </div>
          ) : (
            <div style={{ overflowX: "auto", transform: "rotateX(180deg)" }}>
              <table
                className="data-table"
                style={{ transform: "rotateX(180deg)" }}
              >
                <thead>
                  <tr>
                    <th style={{ paddingLeft: "1.25rem", width: "40px" }}>
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length === rows.length && rows.length > 0
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Sample No.</th>
                    <th>Ref No.</th>
                    <th>Type</th>
                    <th>PHI Area</th>
                    <th>MOH Area</th>
                    <th>Analyst</th>
                    <th>Handed Over By</th>
                    <th style={{ textAlign: "right", paddingRight: "1.25rem" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      style={{
                        background: selectedIds.includes(row.id)
                          ? "#f1f5f9"
                          : "transparent",
                      }}
                    >
                      <td style={{ paddingLeft: "1.25rem" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleSelection(row.id)}
                        />
                      </td>
                      <td style={{ color: "var(--muted)", fontWeight: 600 }}>
                        {row.id}
                      </td>
                      <td>
                        {editingId === row.id ? (
                          <input
                            type="date"
                            value={editForm.sample_date.slice(0, 10)}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                sample_date: e.target.value,
                              })
                            }
                          />
                        ) : (
                          formatDateLong(row.sample_date)
                        )}
                      </td>
                      <td>
                        {editingId === row.id ? (
                          <input
                            type="time"
                            value={editForm.collection_time}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                collection_time: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "0.8rem",
                            }}
                          >
                            {row.collection_time || "—"}
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {row.sample_number}
                        </span>
                      </td>
                      <td>
                        {editingId === row.id ? (
                          <input
                            value={editForm.reference_number}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                reference_number: e.target.value,
                              })
                            }
                          />
                        ) : (
                          row.reference_number
                        )}
                      </td>
                      <td>
                        {editingId === row.id ? (
                          <select
                            value={editForm.sample_type}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                sample_type: e.target.value,
                              })
                            }
                          >
                            <option value="Water">Water</option>
                            <option value="Spices">Spices</option>
                            <option value="Salt">Salt</option>
                          </select>
                        ) : (
                          <span
                            className={
                              TYPE_BADGE[row.sample_type] ||
                              "badge badge-primary"
                            }
                          >
                            {row.sample_type}
                          </span>
                        )}
                      </td>
                      <td title={row.phi_area}>
                        {editingId === row.id ? (
                          <input
                            value={editForm.phi_area}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                phi_area: e.target.value,
                              })
                            }
                          />
                        ) : (
                          row.phi_area
                        )}
                      </td>
                      <td title={row.moh_area}>
                        {editingId === row.id ? (
                          <input
                            value={editForm.moh_area}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                moh_area: e.target.value,
                              })
                            }
                          />
                        ) : (
                          row.moh_area
                        )}
                      </td>
                      <td title={row.analyzed_by || "No Analyst Assigned"}>
                        {editingId === row.id ? (
                          <input
                            value={editForm.analyzed_by}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                analyzed_by: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <span
                            style={{ fontWeight: 600, color: "var(--text)" }}
                          >
                            {row.analyzed_by || "—"}
                          </span>
                        )}
                      </td>
                      <td title={row.handed_over_by}>
                        {editingId === row.id ? (
                          <input
                            value={editForm.handed_over_by}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                handed_over_by: e.target.value,
                              })
                            }
                          />
                        ) : (
                          row.handed_over_by
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          paddingRight: "1.25rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "0.375rem",
                            justifyContent: "flex-end",
                            flexWrap: "nowrap",
                          }}
                        >
                          {editingId === row.id ? (
                            <>
                              <button
                                onClick={saveEdit}
                                className="btn btn-success btn-sm"
                              >
                                ✓ Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="btn btn-ghost btn-sm"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(row)}
                                className="btn btn-warn btn-sm"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => deleteRow(row.id)}
                                className="btn btn-danger btn-sm"
                              >
                                🗑
                              </button>
                              <button
                                onClick={() => handlePrint(row)}
                                className="btn btn-outline-primary btn-sm"
                                title="Print Work Sheet"
                              >
                                🖨️
                              </button>
                              <button
                                onClick={() => handleSingleSummaryReport(row)}
                                className="btn btn-outline-primary btn-sm"
                                title="Print Summary Info"
                              >
                                📋
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={12}
                        style={{
                          textAlign: "center",
                          padding: "3rem",
                          color: "var(--muted)",
                        }}
                      >
                        No records found. Register a sample above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
