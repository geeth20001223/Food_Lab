"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  employee_name: string;
  employee_id: string;
  email: string;
  role: string;
  created_at: string;
}

const ROLE_BADGE: Record<string, string> = {
  Admin: "badge badge-danger",
  "Lab Officer": "badge badge-primary",
  "Lab Analyst": "badge badge-success",
  "Approving Officer": "badge badge-warn",
};

export default function AdminDashboard() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "danger";
  } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [editForm, setEditForm] = useState({
    employee_name: "",
    employee_id: "",
    email: "",
    role: "",
    password: "",
  });
  const [newUser, setNewUser] = useState({
    employee_name: "",
    employee_id: "",
    email: "",
    role: "",
    password: "",
  });

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showMessage = (
    text: string,
    type: "success" | "danger" = "success",
  ) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const createUser = async () => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    const data = await res.json();
    showMessage(data.message, data.success ? "success" : "danger");
    if (data.success) {
      setNewUser({
        employee_name: "",
        employee_id: "",
        email: "",
        role: "",
        password: "",
      });
      setShowCreate(false);
      fetchUsers();
    }
  };

  const startEdit = (u: User) => {
    setEditingId(u.id);
    setResetPassword(false);
    setEditForm({
      employee_name: u.employee_name,
      employee_id: u.employee_id,
      email: u.email,
      role: u.role,
      password: "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await fetch(`/api/admin/users?id=${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        password: resetPassword ? editForm.password : "",
      }),
    });
    const data = await res.json();
    showMessage(data.message, "success");
    setEditingId(null);
    setResetPassword(false);
    fetchUsers();
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    showMessage(data.message, "danger");
    fetchUsers();
  };

  const logout = () => {
    localStorage.removeItem("role");
    router.push("/user-login");
  };

  return (
    <div>
      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="topbar-brand">
          <span style={{ fontSize: "1.25rem" }}>🛡️</span>
          <span style={{ color: "var(--primary)", fontWeight: 800 }}>
            Admin
          </span>
          <span>Dashboard</span>
        </div>
        <div className="topbar-actions">
          <button
            onClick={() => router.push("/labofficer-dashboard")}
            className="btn btn-ghost btn-sm"
          >
            📋 Lab Officer
          </button>
          <button
            onClick={() => router.push("/labanalysist-dashboard")}
            className="btn btn-outline-primary btn-sm"
          >
            🧪 Analyst Panel
          </button>
          <button
            onClick={() => router.push("/approver-dashboard")}
            className="btn btn-outline-primary btn-sm"
          >
            🎖️ Approver Panel
          </button>
          <button onClick={logout} className="btn btn-danger btn-sm">
            🔑 Logout
          </button>
        </div>
      </div>

      <div className="page-wrapper">
        {/* ── Alert ── */}
        {message && (
          <div className={`alert alert-${message.type} fade-in`}>
            {message.type === "success" ? "✅" : "⚠️"} {message.text}
          </div>
        )}

        {/* ── Default Credentials Info ── */}
        <div
          className="alert alert-info fade-in"
          style={{
            marginBottom: "1.5rem",
            alignItems: "flex-start",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>
            🔑 Default Login Credentials
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1.5rem",
              fontSize: "0.80rem",
            }}
          >
            <div>
              <strong>Admin:</strong> username&nbsp;=&nbsp;
              <code
                style={{
                  background: "#c7d2fe",
                  padding: "0.1rem 0.4rem",
                  borderRadius: "0.3rem",
                }}
              >
                admin
              </code>
              &nbsp; password&nbsp;=&nbsp;
              <code
                style={{
                  background: "#c7d2fe",
                  padding: "0.1rem 0.4rem",
                  borderRadius: "0.3rem",
                }}
              >
                admin123
              </code>
            </div>
            <div>
              <strong>Users:</strong> Employee ID as username,
              password&nbsp;=&nbsp;
              <code
                style={{
                  background: "#c7d2fe",
                  padding: "0.1rem 0.4rem",
                  borderRadius: "0.3rem",
                }}
              >
                1234
              </code>
            </div>
          </div>
        </div>

        {/* ── Page Title + Add Button ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.375rem",
                fontWeight: 800,
                color: "var(--text)",
                margin: 0,
              }}
            >
              User Management
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--muted)",
                marginTop: "0.25rem",
              }}
            >
              {users.length} registered user{users.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="btn btn-primary"
          >
            {showCreate ? "✕ Cancel" : "+ Add User"}
          </button>
        </div>

        {/* ── Create Form ── */}
        {showCreate && (
          <div className="card fade-in" style={{ marginBottom: "1.5rem" }}>
            <div className="card-title">➕ Create New User</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              {[
                {
                  label: "Employee Name",
                  key: "employee_name",
                  placeholder: "Full name",
                },
                {
                  label: "Employee ID",
                  key: "employee_id",
                  placeholder: "e.g. EMP001",
                },
                {
                  label: "Email",
                  key: "email",
                  placeholder: "email@example.com",
                },
              ].map((f) => (
                <div key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <input
                    className="form-input"
                    placeholder={f.placeholder}
                    value={newUser[f.key as keyof typeof newUser]}
                    onChange={(e) =>
                      setNewUser({ ...newUser, [f.key]: e.target.value })
                    }
                  />
                </div>
              ))}
              <div>
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                >
                  <option value="">Select role…</option>
                  <option value="Lab Officer">Lab Officer</option>
                  <option value="Lab Analyst">Lab Analyst</option>
                  <option value="Approving Officer">Approving Officer</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Set initial password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
              </div>
            </div>
            <div
              style={{
                marginTop: "1.25rem",
                display: "flex",
                gap: "0.625rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowCreate(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button onClick={createUser} className="btn btn-success">
                ✓ Create User
              </button>
            </div>
          </div>
        )}

        {/* ── User Table ── */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: "1.25rem" }}>#</th>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Password</th>
                  <th style={{ textAlign: "right", paddingRight: "1.25rem" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className={editingId === u.id ? "fade-in" : ""}
                  >
                    <td
                      style={{
                        paddingLeft: "1.25rem",
                        color: "var(--muted)",
                        fontWeight: 600,
                      }}
                    >
                      {u.id}
                    </td>

                    <td>
                      {editingId === u.id ? (
                        <input
                          value={editForm.employee_name}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              employee_name: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <span style={{ fontWeight: 600 }}>
                          {u.employee_name}
                        </span>
                      )}
                    </td>

                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                          color: "var(--muted)",
                        }}
                      >
                        {u.employee_id}
                      </span>
                    </td>

                    <td style={{ color: "var(--muted)" }}>{u.email}</td>

                    <td>
                      {editingId === u.id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm({ ...editForm, role: e.target.value })
                          }
                        >
                          <option value="">Select role…</option>
                          <option value="Lab Officer">Lab Officer</option>
                          <option value="Lab Analyst">Lab Analyst</option>
                          <option value="Approving Officer">
                            Approving Officer
                          </option>
                        </select>
                      ) : (
                        <span
                          className={
                            ROLE_BADGE[u.role] || "badge badge-primary"
                          }
                        >
                          {u.role}
                        </span>
                      )}
                    </td>

                    <td>
                      {editingId === u.id ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.35rem",
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={resetPassword}
                              onChange={(e) =>
                                setResetPassword(e.target.checked)
                              }
                            />
                            Reset password
                          </label>
                          {resetPassword && (
                            <input
                              type="password"
                              placeholder="New password"
                              value={editForm.password}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  password: e.target.value,
                                })
                              }
                            />
                          )}
                        </div>
                      ) : (
                        <span
                          style={{
                            color: "var(--muted)",
                            letterSpacing: "0.1em",
                          }}
                        >
                          ••••••••
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: "right", paddingRight: "1.25rem" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.375rem",
                          justifyContent: "flex-end",
                        }}
                      >
                        {editingId === u.id ? (
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
                              onClick={() => startEdit(u)}
                              className="btn btn-warn btn-sm"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="btn btn-danger btn-sm"
                            >
                              🗑 Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: "3rem",
                        color: "var(--muted)",
                      }}
                    >
                      No users found. Add one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
