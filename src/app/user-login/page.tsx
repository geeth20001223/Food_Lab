"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [usernameOrId, setUsernameOrId] = useState("");
  const [password, setPassword] = useState("");
  const [roleType, setRoleType] = useState("Admin");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/user-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          roleType,
          usernameOrId,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(data.message || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("role", data.user.role);
      localStorage.setItem("usernameOrId", usernameOrId);

      switch (data.user.role) {
        case "Admin":
          router.push("/admin-dashboard");
          break;
        case "Lab Officer":
          router.push("/labofficer-dashboard");
          break;
        case "Lab Analyst":
          router.push("/labanalysist-dashboard");
          break;
        case "Approving Officer":
          router.push("/approver-dashboard");
          break;
        default:
          setMessage("Unauthorized role");
      }
    } catch {
      setMessage("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: "Admin", label: "Admin", icon: "🛡️" },
    { value: "Lab Officer", label: "Lab Officer", icon: "📋" },
    { value: "Lab Analyst", label: "Lab Analyst", icon: "🧪" },
    { value: "Approving Officer", label: "Approving Officer", icon: "✅" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #eef2ff 0%, #f1f5f9 60%, #faf5ff 100%)",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            left: "-10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      <div
        className="fade-in"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "420px",
          padding: "1rem",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "1rem",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              margin: "0 auto 1rem",
              boxShadow: "0 8px 24px rgba(79,70,229,0.3)",
            }}
          >
            🧬
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0,
            }}
          >
            Food Lab System
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#64748b",
              marginTop: "0.375rem",
            }}
          >
            Provincial Food Laboratory (NWP)
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "2rem" }}>
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: "1.5rem",
            }}
          >
            Sign in to your account
          </h2>

          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {/* Role picker */}
            <div>
              <label className="form-label">Select Role</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                }}
              >
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRoleType(r.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      border:
                        roleType === r.value
                          ? "2px solid #4f46e5"
                          : "2px solid #e2e8f0",
                      background: roleType === r.value ? "#eef2ff" : "#fff",
                      color: roleType === r.value ? "#4f46e5" : "#64748b",
                    }}
                  >
                    <span>{r.icon}</span>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Username / ID */}
            <div>
              <label className="form-label">
                {roleType === "Admin" ? "Username" : "Employee ID"}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={
                  roleType === "Admin" ? "Enter username" : "Enter employee ID"
                }
                value={usernameOrId}
                onChange={(e) => setUsernameOrId(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.35rem",
                }}
              >
                <label className="form-label" style={{ margin: 0 }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  style={{
                    fontSize: "0.75rem",
                    color: "#4f46e5",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Error */}
            {message && (
              <div className="alert alert-danger" style={{ margin: 0 }}>
                <span>⚠️</span> {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg btn-full"
              style={{ marginTop: "0.25rem" }}
            >
              {loading ? (
                <>
                  <svg
                    style={{
                      width: "1rem",
                      height: "1rem",
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
                  Signing in…
                </>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "#94a3b8",
            marginTop: "1.5rem",
          }}
        >
          © 2024 Provincial Food Laboratory (NWP)
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
