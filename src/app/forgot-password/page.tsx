"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [roleType, setRoleType] = useState("Admin");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (resetSuccess) {
      const timer = setTimeout(() => router.push("/user-login"), 3000);
      return () => clearTimeout(timer);
    }
  }, [resetSuccess, router]);

  const handleSendOTP = async (e?: FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, roleType }),
      });
      const data = await res.json();
      setMessage(data.message);
      setMessageType(data.success ? "success" : "error");
      if (data.success) {
        setOtpSent(true);
        setResendCooldown(60);
      }
    } catch {
      setMessage("Server error. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, roleType, otp, newPassword }),
      });
      const data = await res.json();
      setMessage(data.message);
      setMessageType(data.success ? "success" : "error");
      if (data.success) {
        setResetSuccess(true);
        setOtpSent(false);
      }
    } catch {
      setMessage("Server error. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = `${((60 - resendCooldown) / 60) * 100}%`;

  const roles = [
    { value: "Admin", label: "Admin", icon: "🔵" },
    { value: "Lab Officer", label: "Lab Officer", icon: "📋" },
    { value: "Lab Analyst", label: "Lab Analyst", icon: "🧪" },
    { value: "Approving Officer", label: "Approving Officer", icon: "✅" },
  ];

  const step = resetSuccess ? 3 : otpSent ? 2 : 1;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fp-root {
          min-height: 100vh;
          background: #eef0f8;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          padding: 24px 16px;
        }

        /* Top branding — matches login page */
        .fp-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 28px;
        }
        .fp-brand-icon {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, #6c63ff 0%, #4f46e5 100%);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px;
          margin-bottom: 14px;
          box-shadow: 0 4px 20px rgba(108,99,255,0.35);
        }
        .fp-brand-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: #1a1a2e;
          letter-spacing: -0.3px;
        }
        .fp-brand-sub {
          font-size: 0.82rem;
          color: #8b92a8;
          margin-top: 3px;
          font-weight: 400;
        }

        /* Card */
        .fp-card {
          background: #ffffff;
          border-radius: 16px;
          padding: 32px 32px 28px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.05);
        }

        .fp-card-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 22px;
        }

        /* Step indicator */
        .fp-steps {
          display: flex;
          align-items: center;
          margin-bottom: 24px;
        }
        .fp-step-item {
          display: flex;
          align-items: center;
          gap: 7px;
          flex: 1;
        }
        .fp-step-circle {
          width: 26px; height: 26px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        .fp-step-circle.pending {
          background: #f0f1f5;
          color: #9ca3af;
          border: 2px solid #e5e7eb;
        }
        .fp-step-circle.active {
          background: #4f46e5;
          color: #fff;
          border: 2px solid #4f46e5;
          box-shadow: 0 0 0 3px rgba(79,70,229,0.15);
        }
        .fp-step-circle.done {
          background: #10b981;
          color: #fff;
          border: 2px solid #10b981;
        }
        .fp-step-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #9ca3af;
          white-space: nowrap;
        }
        .fp-step-label.active { color: #4f46e5; }
        .fp-step-label.done   { color: #10b981; }
        .fp-step-connector {
          flex: 1;
          height: 2px;
          background: #e5e7eb;
          margin: 0 8px;
          border-radius: 2px;
          transition: background 0.3s;
        }
        .fp-step-connector.done { background: #10b981; }

        /* Role selector grid — same as login page */
        .fp-role-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #6b7280;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .fp-role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 20px;
        }
        .fp-role-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          background: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
        }
        .fp-role-btn:hover:not(:disabled) {
          border-color: #c7d2fe;
          background: #f5f3ff;
          color: #4f46e5;
        }
        .fp-role-btn.selected {
          border-color: #4f46e5;
          background: #f5f3ff;
          color: #4f46e5;
          font-weight: 600;
        }
        .fp-role-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .fp-role-icon { font-size: 0.95rem; }

        /* Labels */
        .fp-field { margin-bottom: 16px; }
        .fp-field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 7px;
        }
        .fp-field-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #6b7280;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Inputs — matches login page style */
        .fp-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          color: #1a1a2e;
          background: #fff;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .fp-input::placeholder { color: #b0b7c3; }
        .fp-input:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
        }
        .fp-input:disabled {
          background: #f9fafb;
          color: #9ca3af;
          cursor: not-allowed;
        }
        .fp-input.otp-input {
          letter-spacing: 0.3em;
          font-size: 1.1rem;
          font-weight: 600;
          text-align: center;
        }

        /* Password wrapper */
        .fp-pw-wrap { position: relative; }
        .fp-pw-toggle {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: #9ca3af; cursor: pointer;
          font-size: 1rem; padding: 0; line-height: 1;
          transition: color 0.2s;
        }
        .fp-pw-toggle:hover { color: #4f46e5; }

        /* OTP sent notice */
        .fp-otp-notice {
          display: flex; align-items: center; gap: 9px;
          padding: 10px 13px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 9px;
          font-size: 0.82rem;
          color: #166534;
          font-weight: 500;
          margin-bottom: 18px;
        }
        .fp-pulse-dot {
          width: 8px; height: 8px;
          background: #22c55e;
          border-radius: 50%;
          flex-shrink: 0;
          animation: dotpulse 1.5s ease-in-out infinite;
        }
        @keyframes dotpulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(0.75); }
        }

        /* Primary button — matches login Sign In button */
        .fp-btn-primary {
          width: 100%;
          padding: 13px;
          background: #4f46e5;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-bottom: 10px;
          box-shadow: 0 2px 12px rgba(79,70,229,0.25);
        }
        .fp-btn-primary:hover:not(:disabled) {
          background: #4338ca;
          box-shadow: 0 4px 20px rgba(79,70,229,0.35);
          transform: translateY(-1px);
        }
        .fp-btn-primary:active:not(:disabled) { transform: translateY(0); }
        .fp-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Resend button */
        .fp-btn-resend {
          width: 100%;
          padding: 11px;
          background: #fff;
          color: #d97706;
          border: 1.5px solid #fde68a;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          margin-bottom: 10px;
          position: relative;
          overflow: hidden;
        }
        .fp-btn-resend:hover:not(:disabled) {
          background: #fffbeb;
          border-color: #fbbf24;
        }
        .fp-btn-resend:disabled { color: #d1d5db; border-color: #f3f4f6; cursor: not-allowed; }
        .fp-resend-progress {
          position: absolute; left: 0; bottom: 0;
          height: 3px;
          background: linear-gradient(90deg, #10b981, #f59e0b);
          transition: width 1s linear;
        }

        /* Ghost button */
        .fp-btn-ghost {
          width: 100%;
          padding: 11px;
          background: transparent;
          color: #6b7280;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s;
          margin-bottom: 10px;
        }
        .fp-btn-ghost:hover { background: #f9fafb; color: #374151; border-color: #d1d5db; }

        /* Message */
        .fp-msg {
          padding: 10px 13px;
          border-radius: 9px;
          font-size: 0.82rem;
          font-weight: 500;
          margin-top: 12px;
          display: flex; align-items: center; gap: 7px;
        }
        .fp-msg.error   { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }
        .fp-msg.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
        .fp-msg.info    { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; }

        /* Spinner */
        .fp-spin {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .fp-divider {
          height: 1px;
          background: #f0f1f5;
          margin: 18px 0 16px;
        }

        /* Back to login */
        .fp-back-link {
          display: flex; align-items: center; justify-content: center;
          gap: 5px;
          font-size: 0.82rem;
          color: #9ca3af;
          cursor: pointer;
          background: none; border: none;
          font-family: 'Inter', sans-serif;
          width: 100%;
          transition: color 0.18s;
          padding: 0;
        }
        .fp-back-link:hover { color: #4f46e5; }

        /* Success state */
        .fp-success {
          text-align: center;
          padding: 10px 0;
        }
        .fp-success-icon { font-size: 3rem; display: block; margin-bottom: 12px; }
        .fp-success-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #1a1a2e;
          margin-bottom: 8px;
        }
        .fp-success-sub {
          font-size: 0.83rem;
          color: #6b7280;
          margin-bottom: 22px;
          line-height: 1.6;
        }
        .fp-success-btn {
          width: 100%;
          padding: 13px;
          background: #10b981;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'Inter', sans-serif;
          font-size: 0.925rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s;
          box-shadow: 0 2px 12px rgba(16,185,129,0.25);
        }
        .fp-success-btn:hover { background: #059669; }
        .fp-redirect-note {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 10px;
        }

        /* Footer */
        .fp-footer {
          margin-top: 24px;
          font-size: 0.75rem;
          color: #9ca3af;
          text-align: center;
        }
      `}</style>

      <div className="fp-root">

        {/* ── Branding (matches login page top) ── */}
        <div className="fp-brand">
          <div className="fp-brand-icon">🧬</div>
          <div className="fp-brand-title">Food Lab System</div>
          <div className="fp-brand-sub">Provincial Food Laboratory (NWP)</div>
        </div>

        {/* ── Card ── */}
        <div className="fp-card">

          <div className="fp-card-title">
            {resetSuccess ? "Password Reset Complete" : otpSent ? "Verify & Set New Password" : "Reset your password"}
          </div>

          {/* Step indicators */}
          <div className="fp-steps">
            <div className="fp-step-item">
              <div className={`fp-step-circle ${step > 1 ? "done" : step === 1 ? "active" : "pending"}`}>
                {step > 1 ? "✓" : "1"}
              </div>
              <span className={`fp-step-label ${step > 1 ? "done" : step === 1 ? "active" : ""}`}>Email</span>
            </div>
            <div className={`fp-step-connector ${step > 1 ? "done" : ""}`} />
            <div className="fp-step-item">
              <div className={`fp-step-circle ${step > 2 ? "done" : step === 2 ? "active" : "pending"}`}>
                {step > 2 ? "✓" : "2"}
              </div>
              <span className={`fp-step-label ${step > 2 ? "done" : step === 2 ? "active" : ""}`}>Verify OTP</span>
            </div>
            <div className={`fp-step-connector ${step > 2 ? "done" : ""}`} />
            <div className="fp-step-item">
              <div className={`fp-step-circle ${step === 3 ? "done" : "pending"}`}>
                {step === 3 ? "✓" : "3"}
              </div>
              <span className={`fp-step-label ${step === 3 ? "done" : ""}`}>Done</span>
            </div>
          </div>

          {/* ── SUCCESS STATE ── */}
          {resetSuccess ? (
            <div className="fp-success">
              <span className="fp-success-icon">🎉</span>
              <div className="fp-success-title">Password Reset!</div>
              <div className="fp-success-sub">
                Your password has been changed successfully.<br />
                You can now sign in with your new password.
              </div>
              <button className="fp-success-btn" onClick={() => router.push("/user-login")}>
                🔑 Go to Login
              </button>
              <div className="fp-redirect-note">Redirecting automatically in 3 seconds…</div>
            </div>
          ) : (
            <>
              {/* ── ROLE SELECTOR ── */}
              <div className="fp-role-label">Select Role</div>
              <div className="fp-role-grid">
                {roles.map(r => (
                  <button
                    key={r.value}
                    className={`fp-role-btn ${roleType === r.value ? "selected" : ""}`}
                    onClick={() => setRoleType(r.value)}
                    disabled={otpSent}
                    type="button"
                  >
                    <span className="fp-role-icon">{r.icon}</span>
                    {r.label}
                  </button>
                ))}
              </div>

              {/* ── EMAIL ── */}
              <div className="fp-field">
                <div className="fp-field-header">
                  <label className="fp-field-label">Email Address</label>
                </div>
                <input
                  type="email"
                  className="fp-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpSent}
                />
              </div>

              {/* ── STEP 2: OTP + New Password ── */}
              {otpSent && (
                <>
                  <div className="fp-otp-notice">
                    <div className="fp-pulse-dot" />
                    OTP sent to <strong style={{ marginLeft: 3 }}>{email}</strong>
                  </div>

                  <div className="fp-field">
                    <div className="fp-field-header">
                      <label className="fp-field-label">One-Time Password</label>
                    </div>
                    <input
                      type="text"
                      className="fp-input otp-input"
                      placeholder="· · · · · ·"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                    />
                  </div>

                  <div className="fp-field">
                    <div className="fp-field-header">
                      <label className="fp-field-label">New Password</label>
                    </div>
                    <div className="fp-pw-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="fp-input"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ paddingRight: "42px" }}
                      />
                      <button
                        type="button"
                        className="fp-pw-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── ACTION BUTTONS ── */}
              {!otpSent ? (
                <button
                  className="fp-btn-primary"
                  onClick={handleSendOTP}
                  disabled={loading || !email}
                  type="button"
                >
                  {loading ? <><div className="fp-spin" /> Sending OTP…</> : <>Send OTP →</>}
                </button>
              ) : (
                <>
                  <button
                    className="fp-btn-primary"
                    onClick={handleResetPassword}
                    disabled={loading || !otp || !newPassword}
                    type="button"
                  >
                    {loading ? <><div className="fp-spin" /> Resetting…</> : <>Reset Password →</>}
                  </button>

                  <button
                    className="fp-btn-resend"
                    onClick={handleSendOTP}
                    disabled={resendCooldown > 0 || loading}
                    type="button"
                  >
                    {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : "🔄 Resend OTP"}
                    {resendCooldown > 0 && (
                      <div className="fp-resend-progress" style={{ width: progressWidth }} />
                    )}
                  </button>
                </>
              )}

              {/* Message */}
              {message && (
                <div className={`fp-msg ${messageType}`}>
                  <span>{messageType === "error" ? "⚠️" : messageType === "success" ? "✅" : "ℹ️"}</span>
                  {message}
                </div>
              )}

              <div className="fp-divider" />

              <button className="fp-back-link" onClick={() => router.push("/user-login")} type="button">
                ← Back to Login
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="fp-footer">© 2024 Provincial Food Laboratory (NWP)</div>
      </div>
    </>
  );
}