"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { openReportInBrowser } from "@/lib/printHelper";

interface Sample {
  id: number;
  sample_number: string;
  sample_type?: string;
}

interface SavedAnalysis {
  food_register_id: number;
  sample_number: string;
  sample_type: string;
  updated_at: string;
  analysis_complete?: boolean | number;
  moist_m1_i?: number;
  moist_m2_i?: number;
  moist_m3_i?: number;
  moist_m1_ii?: number;
  moist_m2_ii?: number;
  moist_m3_ii?: number;
  ash_m1_i?: number;
  ash_m2_i?: number;
  ash_m3_i?: number;
  ash_m1_ii?: number;
  ash_m2_ii?: number;
  ash_m3_ii?: number;
  acid_m1_i?: number;
  acid_m2_i?: number;
  acid_m1_ii?: number;
  acid_m2_ii?: number;
  [key: string]: any;
}

export default function LabAnalystDashboard() {
  const router = useRouter();

  const [sampleType, setSampleType] = useState("");
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [savedList, setSavedList] = useState<SavedAnalysis[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const [searchSample, setSearchSample] = useState("");

  const initialForm = {
    moist_m1_i: 0,
    moist_m2_i: 0,
    moist_m3_i: 0,
    moist_m1_ii: 0,
    moist_m2_ii: 0,
    moist_m3_ii: 0,
    ash_m1_i: 0,
    ash_m2_i: 0,
    ash_m3_i: 0,
    ash_m1_ii: 0,
    ash_m2_ii: 0,
    ash_m3_ii: 0,
    acid_m1_i: 0,
    acid_m2_i: 0,
    acid_m1_ii: 0,
    acid_m2_ii: 0,
    microscope_notes: "",
    analyzed_by: "",
    analyzed_date: "",
    checked_by: "",
    checked_date: "",
    analysis_complete: false,
    sample_number: "",
    sample_type: "",
    reference_number: "",
    phi_area: "",
    moh_area: "",
    collection_time: "",
    sample_date: "",
    handed_over_by: "",
    analysis_details: "",
  };

  const [form, setForm] = useState(initialForm);

  const [printSettings, setPrintSettings] = useState({
    revisionNo: "03",
    issueNo: "01",
    dateOfRevision: "01/01/2024",
    dateOfIssue: "23/01/2019",
  });

  // ── Calculations ──────────────────────────────────────────────────────────
  const calcMoisture = (m1: number, m2: number, m3: number) => {
    const sw = m2 - m1;
    if (sw <= 0) return 0;
    return ((m2 - m3) * 100) / sw;
  };
  const calcAsh = (m1: number, m2: number, m3: number) => {
    const sw = m2 - m1;
    if (sw <= 0) return 0;
    return ((m3 - m1) * 100) / sw;
  };
  const calcAcidAsh = (m4: number, m1: number, sw: number) => {
    if (sw <= 0) return 0;
    return ((m4 - m1) * 100) / sw;
  };

  const moistI = calcMoisture(
    form.moist_m1_i,
    form.moist_m2_i,
    form.moist_m3_i,
  );
  const moistII = calcMoisture(
    form.moist_m1_ii,
    form.moist_m2_ii,
    form.moist_m3_ii,
  );
  const moistAvg = (moistI + moistII) / 2;

  const ashI = calcAsh(form.ash_m1_i, form.ash_m2_i, form.ash_m3_i);
  const ashII = calcAsh(form.ash_m1_ii, form.ash_m2_ii, form.ash_m3_ii);
  const ashAvg = (ashI + ashII) / 2;

  const acidI = calcAcidAsh(
    form.acid_m2_i,
    form.acid_m1_i,
    form.ash_m2_i - form.ash_m1_i,
  );
  const acidII = calcAcidAsh(
    form.acid_m2_ii,
    form.acid_m1_ii,
    form.ash_m2_ii - form.ash_m1_ii,
  );
  const acidAvg = (acidI + acidII) / 2;

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchSavedList = async () => {
    try {
      const res = await fetch("/api/analyst?list=true");
      const data = await res.json();
      if (Array.isArray(data)) setSavedList(data);
    } catch (err) {
      console.error("Failed to fetch saved list", err);
    }
  };

  useEffect(() => {
    fetchSavedList();
    const role = localStorage.getItem("role");
    setIsAdmin(role === "Admin");
    setUserRole(role || "");
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get("id");
      const queryType = params.get("type");
      if (queryType) setSampleType(queryType);
      if (queryId) setSelectedSampleId(queryId);
    }
  }, []);

  useEffect(() => {
    if (sampleType === "Spices") {
      setPrintSettings({
        revisionNo: "03",
        issueNo: "01",
        dateOfRevision: "01/01/2024",
        dateOfIssue: "23/01/2019",
      });
    } else if (sampleType === "Water" || sampleType === "Salt") {
      setPrintSettings({
        revisionNo: "01",
        issueNo: "01",
        dateOfRevision: "",
        dateOfIssue: "",
      });
    }
  }, [sampleType]);

  useEffect(() => {
    if (searchSample.trim().length > 0) {
      const t = setTimeout(() => {
        fetch(`/api/analyst?search=${encodeURIComponent(searchSample)}`)
          .then((r) => r.json())
          .then((d) => setSamples(d));
      }, 300);
      return () => clearTimeout(t);
    } else if (sampleType) {
      fetch(`/api/analyst?type=${sampleType}`)
        .then((r) => r.json())
        .then((d) => setSamples(d));
    } else {
      setSamples([]);
    }
  }, [sampleType, searchSample]);

  useEffect(() => {
    if (selectedSampleId) {
      setIsLoading(true);
      setIsSaved(false);
      fetch(`/api/analyst?id=${selectedSampleId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data) {
            const hasExisting = data.id != null;
            setIsSaved(hasExisting);
            const sanitized: any = { ...data };
            Object.keys(initialForm).forEach((key) => {
              if (
                typeof initialForm[key as keyof typeof initialForm] === "number"
              ) {
                sanitized[key] = Number(data[key] ?? 0);
              } else if (
                typeof initialForm[key as keyof typeof initialForm] === "string"
              ) {
                sanitized[key] = data[key] ?? "";
              }
            });
            setForm({
              ...initialForm,
              ...sanitized,
              analyzed_date: data.analyzed_date
                ? new Date(data.analyzed_date).toISOString().split("T")[0]
                : "",
              checked_date: data.checked_date
                ? new Date(data.checked_date).toISOString().split("T")[0]
                : "",
              analysis_complete:
                data.analysis_complete === 1 || data.analysis_complete === true,
            });
            if (data.revision_no || data.issue_no) {
              setPrintSettings({
                revisionNo: data.revision_no || "03",
                issueNo: data.issue_no || "01",
                dateOfRevision: data.date_of_revision || "01/01/2024",
                dateOfIssue: data.date_of_issue || "23/01/2019",
              });
            }
          } else {
            setIsSaved(false);
            setForm(initialForm);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsSaved(false);
    }
  }, [selectedSampleId]);

  const handleSave = async () => {
    if (!selectedSampleId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          revision_no: printSettings.revisionNo,
          issue_no: printSettings.issueNo,
          date_of_revision: printSettings.dateOfRevision,
          date_of_issue: printSettings.dateOfIssue,
          food_register_id: selectedSampleId,
          sample_type: sampleType,
        }),
      });
      const data = await res.json();
      showMessage(data.message || data.error);
      setIsSaved(true);
      fetchSavedList();
    } catch {
      showMessage("Failed to save analysis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this analysis?")) return;
    try {
      const res = await fetch("/api/analyst", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food_register_id: id }),
      });
      const data = await res.json();
      showMessage(data.message || data.error);
      if (Number(selectedSampleId) === id) {
        setSelectedSampleId("");
        setForm(initialForm);
      }
      fetchSavedList();
    } catch {
      showMessage("Failed to delete analysis");
    }
  };

  // ── Print helpers ─────────────────────────────────────────────────────────
  const formatDate = (d: string) => {
    if (!d) return "—";
    try {
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
    } catch {
      return d;
    }
  };

  const handlePrint = () => {
    let sampleNo =
      samples.find((s) => s.id === Number(selectedSampleId))?.sample_number ||
      savedList.find((s) => s.food_register_id === Number(selectedSampleId))
        ?.sample_number ||
      "";
    let displaySampleNo = sampleNo.startsWith("PFLF/")
      ? sampleNo
      : "PFLF/" + sampleNo;
    displaySampleNo = displaySampleNo.replace(
      /^(PFLF\/[a-zA-Z]+)(\d+.*)$/,
      "$1/$2",
    );
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const mI = calcMoisture(form.moist_m1_i, form.moist_m2_i, form.moist_m3_i);
    const mII = calcMoisture(
      form.moist_m1_ii,
      form.moist_m2_ii,
      form.moist_m3_ii,
    );
    const mAvg = (mI + mII) / 2;
    const aI = calcAsh(form.ash_m1_i, form.ash_m2_i, form.ash_m3_i);
    const aII = calcAsh(form.ash_m1_ii, form.ash_m2_ii, form.ash_m3_ii);
    const aAvg = (aI + aII) / 2;
    const acI = calcAcidAsh(
      form.acid_m2_i,
      form.acid_m1_i,
      form.ash_m2_i - form.ash_m1_i,
    );
    const acII = calcAcidAsh(
      form.acid_m2_ii,
      form.acid_m1_ii,
      form.ash_m2_ii - form.ash_m1_ii,
    );
    const acAvg = (acI + acII) / 2;

    const html = `<!DOCTYPE html><html><head><title>Analysis Report - ${displaySampleNo}</title>
<style>
@page{size:A4;margin:0}body{font-family:Arial,sans-serif;padding:0;margin:0;color:#000;background:#fff}
.page{width:210mm;min-height:296.5mm;padding:10mm 15mm;box-sizing:border-box;position:relative}
.header{display:grid;grid-template-columns:80px 1fr 80px;align-items:center;border:1.5px solid #000;padding:10px}
.header .logo img{width:65px;object-fit:contain}
.header .title-block{text-align:center}
.header .title-block h1{font-size:18px;margin:0;text-transform:uppercase}
.header .title-block .sinhala{font-size:18px;font-weight:bold;margin-top:4px}
.calc-grid{display:flex;justify-content:space-between;gap:30px;margin-top:30px}
.calc-col{width:48%;display:flex;flex-direction:column}
.calc-table{width:100%;border-collapse:collapse}
.calc-table td,.calc-table th{border:1.5px solid #000;padding:10px 8px;font-size:12px}
.calc-table td:nth-child(2),.calc-table td:nth-child(3){text-align:center;width:65px}
.calc-table th{text-align:center;background:#fff}
.fraction{display:inline-block;text-align:center;vertical-align:middle}
.fraction .numerator{border-bottom:1.5px solid #000;padding:0 5px;font-weight:bold}
.fraction .denominator{padding:0 5px;font-weight:bold}
.sign-box{border:1.5px solid #000;padding:12px;font-weight:bold;margin-bottom:-1.5px;display:flex;justify-content:space-between;font-size:13px}
.micro-box{border:1.5px solid #000;padding:15px;min-height:250px;font-size:13px}
.watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 55px; color: rgba(0, 0, 0, 0.08); white-space: nowrap; pointer-events: none; z-index: 10; font-weight: bold; }
</style></head><body>
<div class="page"><div class="watermark">Provincial Food Laboratory (NWP)</div>
<div class="header">
  <div class="logo"><img src="${origin}/logo.png"/></div>
  <div class="title-block"><h1>PROVINCIAL FOOD LABORATORY(NWP)</h1><div class="sinhala">පළාත් ආහාර රසායනාගාරය (වයඹ පළාත)</div></div>
  <div></div>
</div>
<div style="text-align:center;font-weight:bold;font-size:18px;margin:25px 0;">ANALYSIS WORKSHEET - ${displaySampleNo}</div>
<div class="calc-grid">
  <div class="calc-col">
    <div style="font-weight:bold;padding:10px;border:1.5px solid #000;border-bottom:none;font-size:14px;">Moisture Content</div>
    <table class="calc-table">
      <tr><th>Parameter</th><th>I</th><th>II</th></tr>
      <tr><td>Mass of dish (m₁)</td><td>${form.moist_m1_i}</td><td>${form.moist_m1_ii}</td></tr>
      <tr><td>Dish + sample (m₂)</td><td>${form.moist_m2_i}</td><td>${form.moist_m2_ii}</td></tr>
      <tr><td>Drying m₃</td><td>${form.moist_m3_i}</td><td>${form.moist_m3_ii}</td></tr>
      <tr><td style="height:80px;">Moisture %<br><div class="fraction" style="margin-top:5px;"><div class="numerator">(m₂-m₃)x100</div><div class="denominator">(m₂-m₁)</div></div></td><td>${mI.toFixed(2)}</td><td>${mII.toFixed(2)}</td></tr>
      <tr style="font-weight:bold;font-size:14px;"><td colspan="3" style="text-align:center;padding:15px;">Average: ${mAvg.toFixed(2)}%</td></tr>
    </table>
    <div class="micro-box" style="margin-top:25px;"><b style="font-size:14px;">Microscope Examination:</b><br><br><div style="line-height:1.6;">${form.microscope_notes || "No notes provided."}</div></div>
    <div style="margin-top:30px;">
      <div class="sign-box"><span>Analyzed: ${form.analyzed_by}</span><span>Date: ${formatDate(form.analyzed_date)}</span></div>
      <div class="sign-box"><span>Checked: ${form.checked_by}</span><span>Date: ${formatDate(form.checked_date)}</span></div>
    </div>
  </div>
  <div class="calc-col">
    <div style="font-weight:bold;padding:10px;border:1.5px solid #000;border-bottom:none;font-size:14px;">Total Ash</div>
    <table class="calc-table">
      <tr><th>Parameter</th><th>I</th><th>II</th></tr>
      <tr><td>Mass of dish (m₁)</td><td>${form.ash_m1_i}</td><td>${form.ash_m1_ii}</td></tr>
      <tr><td>Dish + sample (m₂)</td><td>${form.ash_m2_i}</td><td>${form.ash_m2_ii}</td></tr>
      <tr><td>After ash m₃</td><td>${form.ash_m3_i}</td><td>${form.ash_m3_ii}</td></tr>
      <tr><td style="height:60px;">Ash %</td><td>${aI.toFixed(2)}</td><td>${aII.toFixed(2)}</td></tr>
      <tr style="font-weight:bold;font-size:14px;"><td colspan="3" style="text-align:center;padding:15px;">Average: ${aAvg.toFixed(2)}%</td></tr>
    </table>
    <div style="font-weight:bold;padding:10px;border:1.5px solid #000;border-bottom:none;margin-top:25px;font-size:14px;">Acid Insoluble Ash (AIA)</div>
    <table class="calc-table">
      <tr><td>AIA + dish (m₄)</td><td>${form.acid_m2_i}</td><td>${form.acid_m2_ii}</td></tr>
      <tr><td style="height:50px;">m₄ – m₁</td><td>${(Number(form.acid_m2_i) - Number(form.ash_m1_i)).toFixed(4)}</td><td>${(Number(form.acid_m2_ii) - Number(form.ash_m1_ii)).toFixed(4)}</td></tr>
      <tr><td style="height:80px;">AIA %<br><div class="fraction" style="margin-top:5px;"><div class="numerator">(m₄-m₁)x100</div><div class="denominator">(m₂-m₁)</div></div></td><td>${acI.toFixed(2)}</td><td>${acII.toFixed(2)}</td></tr>
      <tr style="font-weight:bold;font-size:14px;"><td colspan="3" style="text-align:center;padding:15px;">Average AIA: ${acAvg.toFixed(2)}%</td></tr>
    </table>
  </div>
</div>
</div>
<script>window.onload=()=>{setTimeout(()=>{window.print();window.close();},700);}</script>
</body></html>`;
    openReportInBrowser(html);
  };

  const handlePrintFullReport = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const currentDateTime = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    let displaySampleNo = form.sample_number.startsWith("PFLF/")
      ? form.sample_number
      : "PFLF/" + form.sample_number;
    displaySampleNo = displaySampleNo.replace(
      /^(PFLF\/[a-zA-Z]+)(\d+.*)$/,
      "$1/$2",
    );

    const mI = calcMoisture(form.moist_m1_i, form.moist_m2_i, form.moist_m3_i);
    const mII = calcMoisture(
      form.moist_m1_ii,
      form.moist_m2_ii,
      form.moist_m3_ii,
    );
    const mAvg = (mI + mII) / 2;
    const aI = calcAsh(form.ash_m1_i, form.ash_m2_i, form.ash_m3_i);
    const aII = calcAsh(form.ash_m1_ii, form.ash_m2_ii, form.ash_m3_ii);
    const aAvg = (aI + aII) / 2;
    const acI = calcAcidAsh(
      form.acid_m2_i,
      form.acid_m1_i,
      form.ash_m2_i - form.ash_m1_i,
    );
    const acII = calcAcidAsh(
      form.acid_m2_ii,
      form.acid_m1_ii,
      form.ash_m2_ii - form.ash_m1_ii,
    );
    const acAvg = (acI + acII) / 2;

    const html = `<!DOCTYPE html><html><head><title>Full Report - ${displaySampleNo}</title>
<style>
@page{size:A4;margin:0}body{font-family:Arial,sans-serif;padding:0;margin:0;color:#000;background:#fff}
.page{width:210mm;height:296.5mm;padding:10mm 15mm;box-sizing:border-box;page-break-after:always;position:relative;overflow:hidden}
.page:last-child{page-break-after:auto}
.header{display:grid;grid-template-columns:80px 1fr 80px;align-items:center;border:1.5px solid #000;padding:10px}
.header .logo img{width:65px;object-fit:contain}
.header .title-block{text-align:center}
.header .title-block h1{font-size:18px;margin:0;text-transform:uppercase}
.header .title-block .sinhala{font-size:18px;font-weight:bold;margin-top:4px}
.reg-table{width:100%;border-collapse:collapse;margin-top:-1.5px}
.reg-table td{border:1.5px solid #000;padding:6px 12px;font-size:12px}
.sample-num-box{border:1.5px solid #000;border-top:none;display:flex;font-size:16px;font-weight:bold}
.sample-num-label{width:35%;padding:12px;border-right:1.5px solid #000}
.sample-num-value{padding:12px;flex:1}
.calc-grid{display:flex;justify-content:space-between;gap:30px;margin-top:30px}
.calc-col{width:48%}
.calc-table{width:100%;border-collapse:collapse}
.calc-table td,.calc-table th{border:1.5px solid #000;padding:10px 8px;font-size:14px}
.calc-table td:nth-child(2),.calc-table td:nth-child(3){text-align:center;width:65px}
.calc-table th{text-align:center;background:#f8f8f8}
.fraction{display:inline-block;text-align:center;vertical-align:middle}
.fraction .numerator{border-bottom:1.5px solid #000;padding:0 5px;font-weight:bold}
.fraction .denominator{padding:0 5px;font-weight:bold}
.sign-box{border:1.5px solid #000;padding:12px;font-weight:bold;margin-bottom:-1.5px;display:flex;justify-content:space-between;font-size:14px}
.micro-box{border:1.5px solid #000;padding:15px;min-height:250px;margin-top:25px;font-size:14px}
.footer-note{position:absolute;bottom:10mm;left:15mm;right:15mm;text-align:center;font-size:10px;color:#666}
.watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 55px; color: rgba(0, 0, 0, 0.08); white-space: nowrap; pointer-events: none; z-index: 10; font-weight: bold; }
</style></head><body>
<div class="page"><div class="watermark">Provincial Food Laboratory (NWP)</div>
  <div class="header">
    <div class="logo"><img src="${origin}/logo.png"/></div>
    <div class="title-block"><h1>Provincial Food Laboratory(NWP)</h1><div class="sinhala">පළාත් ආහාර රසායනාගාරය (වයඹ පළාත)</div></div>
    <div></div>
  </div>
  <table class="reg-table" style="margin-top:10px;">
    <colgroup><col style="width:50%;"><col style="width:50%;"></colgroup>
    <tr><td style="font-size:14px;padding:10px;">Work Sheet (${form.sample_type})</td><td style="font-size:14px;padding:10px;">PFL/7.5/F/24</td></tr>
    <tr><td style="font-size:14px;padding:10px;">Revision no: ${printSettings.revisionNo}</td><td style="font-size:14px;padding:10px;">Issue no: ${printSettings.issueNo}</td></tr>
    <tr><td style="font-size:14px;padding:10px;">Date of Revision: ${printSettings.dateOfRevision}</td><td style="font-size:14px;padding:10px;">Date of issue: ${currentDateTime}</td></tr>
    <tr><td style="font-size:14px;padding:10px;">Reviewed by: C</td><td style="font-size:14px;padding:10px;">Approved by: AAA</td></tr>
  </table>
  <div class="sample-num-box" style="font-size:18px;">
    <div class="sample-num-label" style="padding:15px;">Sample Number</div>
    <div class="sample-num-value" style="padding:15px;">${displaySampleNo}</div>
  </div>
  <table class="reg-table" style="margin-top:25px;">
    <tr><td style="width:35%;font-weight:bold;font-size:14px;padding:12px;">Type of Sample</td><td style="font-size:14px;padding:12px;">${form.sample_type}</td></tr>
    <tr><td style="font-weight:bold;font-size:14px;padding:12px;">Reference Number</td><td style="font-size:14px;padding:12px;">${form.reference_number || "—"}</td></tr>
    <tr><td style="font-weight:bold;font-size:14px;padding:12px;">PHI Area</td><td style="font-size:14px;padding:12px;">${form.phi_area || "—"}</td></tr>
    <tr><td style="font-weight:bold;font-size:14px;padding:12px;">MOH Area</td><td style="font-size:14px;padding:12px;">${form.moh_area || "—"}</td></tr>
    <tr><td style="font-weight:bold;font-size:14px;padding:12px;">Time and Date of collection</td><td style="font-size:14px;padding:12px;">Time: ${form.collection_time || "—"} &nbsp;&nbsp;&nbsp; Date: ${formatDate(form.sample_date)}</td></tr>
    <tr><td style="font-weight:bold;font-size:14px;padding:12px;">Handed Over By</td><td style="font-size:14px;padding:12px;">${form.handed_over_by || "—"}</td></tr>
    <tr><td style="font-weight:bold;font-size:14px;padding:12px;">Analysis Details</td><td style="height:150px;vertical-align:top;font-size:14px;padding:12px;">${form.analysis_details || "—"}</td></tr>
  </table>
  <div style="margin-top:50px;padding:30px;border:1.5px dashed #000;font-size:15px;">
    <b>Office Remarks:</b><br><br>
    Quantity received: ........................................................................................<br><br>
    Sample Packing: ...........................................................................................<br><br>
    Outer/Inner seals: .........................................................................................
  </div>
  <div class="footer-note">Provincial Food Laboratory (NWP) | Registration Details | Page 1 of 2</div>
</div>
<div class="page"><div class="watermark">Provincial Food Laboratory (NWP)</div>
  <div class="header">
    <div class="logo"><img src="${origin}/logo.png"/></div>
    <div class="title-block"><h1>Provincial Food Laboratory(NWP)</h1><div class="sinhala">පළාත් ආහාර රසායනාගාරය (වයඹ පළාත)</div></div>
    <div></div>
  </div>
  <div style="text-align:center;font-weight:bold;font-size:18px;margin:25px 0;">ANALYSIS WORKSHEET - ${displaySampleNo}</div>
  <div class="calc-grid">
    <div class="calc-col">
      <div style="font-weight:bold;background:#eee;padding:10px;border:1.5px solid #000;border-bottom:none;font-size:15px;">Moisture Content</div>
      <table class="calc-table">
        <tr><th>Parameter</th><th>I</th><th>II</th></tr>
        <tr><td>Mass of dish (m₁)</td><td>${form.moist_m1_i}</td><td>${form.moist_m1_ii}</td></tr>
        <tr><td>Dish + sample (m₂)</td><td>${form.moist_m2_i}</td><td>${form.moist_m2_ii}</td></tr>
        <tr><td>Drying m₃</td><td>${form.moist_m3_i}</td><td>${form.moist_m3_ii}</td></tr>
        <tr><td style="height:80px;">Moisture %<br><div class="fraction" style="margin-top:5px;"><div class="numerator">(m₂-m₃)x100</div><div class="denominator">(m₂-m₁)</div></div></td><td>${mI.toFixed(2)}</td><td>${mII.toFixed(2)}</td></tr>
        <tr style="font-weight:bold;background:#f1f1f1;font-size:16px;"><td colspan="3" style="text-align:center;padding:15px;">Average: ${mAvg.toFixed(2)}%</td></tr>
      </table>
      <div class="micro-box"><b style="font-size:16px;">Microscope Examination:</b><br><br><div style="line-height:1.6;">${form.microscope_notes || "No notes provided."}</div></div>
      <div style="margin-top:30px;">
        <div class="sign-box"><span>Analyzed: ${form.analyzed_by}</span><span>Date: ${formatDate(form.analyzed_date)}</span></div>
        <div class="sign-box"><span>Checked: ${form.checked_by}</span><span>Date: ${formatDate(form.checked_date)}</span></div>
      </div>
    </div>
    <div class="calc-col">
      <div style="font-weight:bold;background:#eee;padding:10px;border:1.5px solid #000;border-bottom:none;font-size:15px;">Total Ash</div>
      <table class="calc-table">
        <tr><th>Parameter</th><th>I</th><th>II</th></tr>
        <tr><td>Mass of dish (m₁)</td><td>${form.ash_m1_i}</td><td>${form.ash_m1_ii}</td></tr>
        <tr><td>Dish + sample (m₂)</td><td>${form.ash_m2_i}</td><td>${form.ash_m2_ii}</td></tr>
        <tr><td>After ash m₃</td><td>${form.ash_m3_i}</td><td>${form.ash_m3_ii}</td></tr>
        <tr><td style="height:60px;">Ash %</td><td>${aI.toFixed(2)}</td><td>${aII.toFixed(2)}</td></tr>
        <tr style="font-weight:bold;background:#f1f1f1;font-size:16px;"><td colspan="3" style="text-align:center;padding:15px;">Average: ${aAvg.toFixed(2)}%</td></tr>
      </table>
      <div style="font-weight:bold;background:#eee;padding:10px;border:1.5px solid #000;border-bottom:none;margin-top:25px;font-size:15px;">Acid Insoluble Ash (AIA)</div>
      <table class="calc-table">
        <tr><td>AIA + dish (m₄)</td><td>${form.acid_m2_i}</td><td>${form.acid_m2_ii}</td></tr>
        <tr><td style="height:50px;">m₄ – m₁</td><td>${(form.acid_m2_i - form.acid_m1_i).toFixed(4)}</td><td>${(form.acid_m2_ii - form.acid_m1_ii).toFixed(4)}</td></tr>
        <tr><td style="height:80px;">AIA %<br><div class="fraction" style="margin-top:5px;"><div class="numerator">(m₄-m₁)x100</div><div class="denominator">(m₂-m₁)</div></div></td><td>${acI.toFixed(2)}</td><td>${acII.toFixed(2)}</td></tr>
        <tr style="font-weight:bold;background:#f1f1f1;font-size:16px;"><td colspan="3" style="text-align:center;padding:15px;">Average AIA: ${acAvg.toFixed(2)}%</td></tr>
      </table>
    </div>
  </div>
  <div class="footer-note">Provincial Food Laboratory (NWP) | Calculation Details | Page 2 of 2</div>
</div>
<script>window.onload=()=>{setTimeout(()=>{window.print();window.close();},700);}</script>
</body></html>`;
    openReportInBrowser(html);
  };

  // ── Read-only display components ──────────────────────────────────────────
  const ROInput = ({ value }: { value: string | number }) => (
    <div
      style={{
        width: "100%",
        padding: "0.25rem 0.5rem",
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        borderRadius: "0.375rem",
        fontSize: "0.875rem",
        color: "#1e293b",
        minHeight: "2rem",
        display: "flex",
        alignItems: "center",
      }}
    >
      {value}
    </div>
  );

  const ROTextarea = ({ value }: { value: string }) => (
    <div
      style={{
        width: "100%",
        padding: "0.75rem",
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        borderRadius: "0.5rem",
        fontSize: "0.875rem",
        color: "#1e293b",
        minHeight: "8rem",
        lineHeight: "1.6",
        whiteSpace: "pre-wrap",
      }}
    >
      {value || (
        <span style={{ color: "#94a3b8" }}>No observations entered.</span>
      )}
    </div>
  );

  return (
    <div style={{ position: "relative" }}>
      {/* ── Toast ── */}
      {message && (
        <div
          className="alert fade-in"
          style={{
            position: "fixed",
            top: "2rem",
            right: "2rem",
            zIndex: 9999,
            background:
              message.toLowerCase().includes("fail") ||
              message.toLowerCase().includes("error")
                ? "var(--danger)"
                : "var(--success)",
            color: "#fff",
            padding: "1rem 1.5rem",
            borderRadius: "0.75rem",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            border: "none",
          }}
        >
          {message.toLowerCase().includes("fail") ? "❌" : "✅"} {message}
        </div>
      )}

      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="topbar-brand">
          <span style={{ fontSize: "1.25rem" }}>🧪</span>
          <span style={{ color: "var(--primary)", fontWeight: 800 }}>
            Lab Analyst
          </span>
          <span>Dashboard</span>
        </div>
        <div className="topbar-actions">
          {isAdmin && (
            <>
              <button
                onClick={() => router.push("/admin-dashboard")}
                className="btn btn-ghost btn-sm"
              >
                🛡️ Admin Panel
              </button>
            </>
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

      <div className="page-wrapper" style={{ maxWidth: "1400px" }}>
        <div className="space-y-6">
          {/* ── Sample Selection Card ── */}
          <div className="card">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: "1.5rem",
              }}
            >
              <div>
                <label className="form-label">Sample Type</label>
                <select
                  className="form-select"
                  value={sampleType}
                  onChange={(e) => {
                    setSampleType(e.target.value);
                    setSelectedSampleId("");
                  }}
                >
                  <option value="">Select Type...</option>
                  <option value="Water">Water</option>
                  <option value="Spices">Spices</option>
                  <option value="Salt">Salt</option>
                </select>
              </div>
              <div>
                <label className="form-label">Select Sample Number</label>
                <div style={{ display: "flex", gap: "0.625rem" }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <input
                      type="text"
                      placeholder="🔍 Search Sample Number..."
                      className="form-input"
                      style={{ width: "100%" }}
                      value={searchSample}
                      onChange={(e) => setSearchSample(e.target.value)}
                      disabled={!sampleType}
                    />
                    {searchSample.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 100,
                          background: "#fff",
                          border: "1px solid var(--border)",
                          borderRadius: "0.5rem",
                          marginTop: "0.25rem",
                          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                          maxHeight: "200px",
                          overflowY: "auto",
                        }}
                      >
                        {samples.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              if (s.sample_type) setSampleType(s.sample_type);
                              setSelectedSampleId(String(s.id));
                              setSearchSample("");
                            }}
                            style={{
                              padding: "0.75rem 1rem",
                              cursor: "pointer",
                              borderBottom: "1px solid #f1f5f9",
                              fontSize: "0.875rem",
                            }}
                          >
                            <div
                              style={{ fontWeight: 600, color: "var(--text)" }}
                            >
                              {s.sample_number}
                            </div>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--muted)",
                              }}
                            >
                              Type: {s.sample_type || "N/A"}
                            </div>
                          </div>
                        ))}
                        {samples.length === 0 && (
                          <div
                            style={{
                              padding: "1rem",
                              textAlign: "center",
                              color: "var(--muted)",
                              fontSize: "0.875rem",
                            }}
                          >
                            No matches found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <select
                    className="form-select"
                    style={{ flex: 1.5 }}
                    value={selectedSampleId}
                    onChange={(e) => setSelectedSampleId(e.target.value)}
                    disabled={!sampleType}
                  >
                    <option value="">Select Sample</option>
                    {samples.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.sample_number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main Form ── */}
          {selectedSampleId && (
            <div className="animation-fade-in space-y-8">
              {/* View-only banner */}
              {isSaved && (
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #3b82f6",
                    borderRadius: "0.625rem",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    color: "#1e40af",
                    fontWeight: 600,
                  }}
                >
                  👁️ This record has already been saved and is shown in view-only
                  mode. Use the print buttons below to generate reports.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ── LEFT: Moisture & Microscope ── */}
                <div className="space-y-8">
                  <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-indigo-700">
                      Moisture Content
                    </h2>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-2 text-left">Measurement</th>
                          <th className="p-2 w-24">Run I</th>
                          <th className="p-2 w-24">Run II</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="p-2">Mass of empty dish (m1)</td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.moist_m1_i} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.moist_m1_i}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    moist_m1_i: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.moist_m1_ii} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.moist_m1_ii}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    moist_m1_ii: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">Mass of dish + sample (m2)</td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.moist_m2_i} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.moist_m2_i}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    moist_m2_i: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.moist_m2_ii} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.moist_m2_ii}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    moist_m2_ii: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                        </tr>
                        <tr className="bg-gray-50 text-indigo-900 font-medium border-y">
                          <td className="p-2">Mass of sample (m2 - m1)</td>
                          <td className="text-center">
                            {(form.moist_m2_i - form.moist_m1_i).toFixed(4)}
                          </td>
                          <td className="text-center">
                            {(form.moist_m2_ii - form.moist_m1_ii).toFixed(4)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">
                            Mass of dish after drying (m3)
                          </td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.moist_m3_i} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.moist_m3_i}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    moist_m3_i: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.moist_m3_ii} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.moist_m3_ii}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    moist_m3_ii: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                        </tr>
                        <tr className="bg-indigo-50 font-bold">
                          <td className="p-2">Percentage of moisture</td>
                          <td className="text-center">{moistI.toFixed(2)}%</td>
                          <td className="text-center">{moistII.toFixed(2)}%</td>
                        </tr>
                        <tr className="bg-indigo-100 font-bold">
                          <td className="p-2" colSpan={2}>
                            Average Moisture
                          </td>
                          <td className="text-center">
                            {moistAvg.toFixed(2)}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </section>

                  <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-indigo-700">
                      Microscope Observations
                    </h2>
                    {isSaved ? (
                      <ROTextarea value={form.microscope_notes || ""} />
                    ) : (
                      <textarea
                        className="w-full border p-3 rounded-lg h-32 outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="Enter observations..."
                        value={form.microscope_notes || ""}
                        onChange={(e) =>
                          setForm({ ...form, microscope_notes: e.target.value })
                        }
                      />
                    )}
                  </section>
                </div>

                {/* ── RIGHT: Ash & AIA ── */}
                <div className="space-y-8">
                  <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-indigo-700">
                      Total Ash
                    </h2>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-2 text-left">Measurement</th>
                          <th className="p-2 w-24">Run I</th>
                          <th className="p-2 w-24">Run II</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="p-2">Mass of dish (m1)</td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.ash_m1_i} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.ash_m1_i}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    ash_m1_i: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.ash_m1_ii} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.ash_m1_ii}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    ash_m1_ii: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">Mass of dish + sample (m2)</td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.ash_m2_i} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.ash_m2_i}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    ash_m2_i: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.ash_m2_ii} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.ash_m2_ii}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    ash_m2_ii: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                        </tr>
                        <tr className="bg-gray-50 text-indigo-900 font-medium border-y">
                          <td className="p-2">Sample weight (m2 - m1)</td>
                          <td className="text-center">
                            {(form.ash_m2_i - form.ash_m1_i).toFixed(4)}
                          </td>
                          <td className="text-center">
                            {(form.ash_m2_ii - form.ash_m1_ii).toFixed(4)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">Mass of dish after ash (m3)</td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.ash_m3_i} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.ash_m3_i}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    ash_m3_i: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.ash_m3_ii} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.ash_m3_ii}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    ash_m3_ii: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                        </tr>
                        <tr className="bg-indigo-50 font-bold">
                          <td className="p-2">Percentage of Ash</td>
                          <td className="text-center">{ashI.toFixed(2)}%</td>
                          <td className="text-center">{ashII.toFixed(2)}%</td>
                        </tr>
                        <tr className="bg-indigo-100 font-bold">
                          <td className="p-2" colSpan={2}>
                            Average Ash
                          </td>
                          <td className="text-center">{ashAvg.toFixed(2)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </section>

                  <section className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-indigo-700">
                      Acid Insoluble Ash
                    </h2>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-2 text-left">Measurement</th>
                          <th className="p-2 w-24">Run I</th>
                          <th className="p-2 w-24">Run II</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="p-2">Mass of empty dish (m1)</td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.acid_m1_i} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.acid_m1_i}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    acid_m1_i: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.acid_m1_ii} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.acid_m1_ii}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    acid_m1_ii: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2">
                            Mass of acid insoluble ash + dish (m4)
                          </td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.acid_m2_i} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.acid_m2_i}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    acid_m2_i: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                          <td className="p-1">
                            {isSaved ? (
                              <ROInput value={form.acid_m2_ii} />
                            ) : (
                              <input
                                type="number"
                                className="w-full p-1 border rounded"
                                value={form.acid_m2_ii}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    acid_m2_ii: Number(e.target.value),
                                  })
                                }
                              />
                            )}
                          </td>
                        </tr>
                        <tr className="bg-gray-50 text-indigo-900 font-medium border-y">
                          <td className="p-2">m4 - m1</td>
                          <td className="text-center">
                            {(form.acid_m2_i - form.acid_m1_i).toFixed(4)}
                          </td>
                          <td className="text-center">
                            {(form.acid_m2_ii - form.acid_m1_ii).toFixed(4)}
                          </td>
                        </tr>
                        <tr className="bg-indigo-50 font-bold">
                          <td className="p-2">Percentage of AIA</td>
                          <td className="text-center">{acidI.toFixed(2)}%</td>
                          <td className="text-center">{acidII.toFixed(2)}%</td>
                        </tr>
                        <tr className="bg-indigo-100 font-bold">
                          <td className="p-2" colSpan={2}>
                            Average AIA
                          </td>
                          <td className="text-center">{acidAvg.toFixed(2)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </section>
                </div>
              </div>

              {/* ── Sign-off & Print Settings ── */}
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 space-y-8">
                {/* Sign-off */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-indigo-700 border-b pb-2">
                    Analysis Sign-off
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase font-bold">
                        Analyzed By
                      </label>
                      {isSaved ? (
                        <ROInput value={form.analyzed_by} />
                      ) : (
                        <input
                          className="w-full border p-2 rounded"
                          value={form.analyzed_by}
                          onChange={(e) =>
                            setForm({ ...form, analyzed_by: e.target.value })
                          }
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase font-bold">
                        Analyzed Date
                      </label>
                      {isSaved ? (
                        <ROInput value={form.analyzed_date} />
                      ) : (
                        <input
                          type="date"
                          className="w-full border p-2 rounded"
                          value={form.analyzed_date}
                          onChange={(e) =>
                            setForm({ ...form, analyzed_date: e.target.value })
                          }
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase font-bold">
                        Checked By
                      </label>
                      {isSaved ? (
                        <ROInput value={form.checked_by} />
                      ) : (
                        <input
                          className="w-full border p-2 rounded"
                          value={form.checked_by}
                          onChange={(e) =>
                            setForm({ ...form, checked_by: e.target.value })
                          }
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase font-bold">
                        Checked Date
                      </label>
                      {isSaved ? (
                        <ROInput value={form.checked_date} />
                      ) : (
                        <input
                          type="date"
                          className="w-full border p-2 rounded"
                          value={form.checked_date}
                          onChange={(e) =>
                            setForm({ ...form, checked_date: e.target.value })
                          }
                        />
                      )}
                    </div>
                  </div>

                  {/* Analysis Complete */}
                  <div className="mt-4 flex items-center gap-3">
                    {isSaved ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.5rem 1rem",
                          borderRadius: "0.5rem",
                          background: form.analysis_complete
                            ? "#f0fdf4"
                            : "#f9fafb",
                          border: `1px solid ${form.analysis_complete ? "#22c55e" : "#d1d5db"}`,
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: form.analysis_complete ? "#15803d" : "#6b7280",
                        }}
                      >
                        <span>{form.analysis_complete ? "✅" : "⬜"}</span>
                        <span>
                          {form.analysis_complete
                            ? "Analysis Complete"
                            : "Not Marked Complete"}
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            analysis_complete: !form.analysis_complete,
                          })
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${form.analysis_complete ? "bg-green-50 border-green-500 text-green-700 shadow-sm" : "bg-gray-50 border-gray-300 text-gray-500 hover:border-green-300 hover:text-green-600"}`}
                      >
                        <span className="text-lg leading-none">
                          {form.analysis_complete ? "✅" : "⬜"}
                        </span>
                        <span>
                          {form.analysis_complete
                            ? "Analysis Complete"
                            : "Mark as Complete"}
                        </span>
                      </button>
                    )}
                    {form.analysis_complete && !isSaved && (
                      <span className="text-xs text-green-600 font-medium italic">
                        This analysis has been marked as complete.
                      </span>
                    )}
                  </div>
                </div>

                {/* Print Settings */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-emerald-700 border-b pb-2">
                    Print Header Configurations
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase font-bold">
                        Revision No
                      </label>
                      {isSaved ? (
                        <ROInput value={printSettings.revisionNo} />
                      ) : (
                        <input
                          className="w-full border p-2 rounded border-emerald-200"
                          value={printSettings.revisionNo}
                          onChange={(e) =>
                            setPrintSettings({
                              ...printSettings,
                              revisionNo: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase font-bold">
                        Date of Revision
                      </label>
                      {isSaved ? (
                        <ROInput value={printSettings.dateOfRevision} />
                      ) : (
                        <input
                          className="w-full border p-2 rounded border-emerald-200"
                          placeholder="DD/MM/YYYY"
                          value={printSettings.dateOfRevision}
                          onChange={(e) =>
                            setPrintSettings({
                              ...printSettings,
                              dateOfRevision: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase font-bold">
                        Issue No
                      </label>
                      {isSaved ? (
                        <ROInput value={printSettings.issueNo} />
                      ) : (
                        <input
                          className="w-full border p-2 rounded border-emerald-200"
                          value={printSettings.issueNo}
                          onChange={(e) =>
                            setPrintSettings({
                              ...printSettings,
                              issueNo: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 uppercase font-bold">
                        Date of Issue
                      </label>
                      {isSaved ? (
                        <ROInput value={printSettings.dateOfIssue} />
                      ) : (
                        <input
                          className="w-full border p-2 rounded border-emerald-200"
                          placeholder="DD/MM/YYYY"
                          value={printSettings.dateOfIssue}
                          onChange={(e) =>
                            setPrintSettings({
                              ...printSettings,
                              dateOfIssue: e.target.value,
                            })
                          }
                        />
                      )}
                    </div>
                  </div>
                  {!isSaved && (
                    <p className="text-xs text-gray-400 mt-2 italic">
                      * These print configurations are only for generating the
                      PDF and will not be saved into the analytical database
                      record.
                    </p>
                  )}
                </div>
              </div>

              {/* ── Action Buttons ── */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                {/* Save button is completely hidden once saved — for ALL roles including Admin */}
                {!isSaved && (
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="btn btn-primary btn-lg"
                  >
                    {isLoading ? "Saving…" : "💾 Save Analysis"}
                  </button>
                )}
                {/*<button onClick={handlePrint} className="btn btn-outline-primary btn-lg">
                                    🖨️ Single Calculation PDF
                                </button>
                                <button
                                    onClick={handlePrintFullReport}
                                    className="btn btn-outline-primary btn-lg"
                                    style={{ borderColor: "var(--primary)", color: "var(--primary)", background: "var(--primary-lt)" }}
                                >
                                    📜 Generate Two-Page Report
                                </button>*/}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
