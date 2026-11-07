"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { useCallback, useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { apiClient } from "@/lib/api-client";
import type { ManagedUser, Membership, Package } from "./types";
import styles from "./billing.module.css";

const emptyForm = {
  name: "",
  description: "",
  persona_limit: 1,
  monthly_price: "0.00",
  currency: "USD",
  stripe_price_id: "",
};

export function AdminClient() {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [offset, setOffset] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    label: string;
    endpoint: string;
    method: string;
    body?: unknown;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const current = await apiClient<Membership>("/billing/me", {
        queryCache: false,
      });
      setMembership(current);
      if (current.role === "user") return;
      const [accounts, plans] = await Promise.all([
        apiClient<ManagedUser[]>(`/admin/users?limit=50&offset=${offset}`, {
          queryCache: false,
        }),
        apiClient<Package[]>("/billing/packages", { queryCache: false }),
      ]);
      setUsers(accounts);
      setPackages(plans);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load administration.",
      );
    } finally {
      setLoading(false);
    }
  }, [offset]);
  useEffect(() => {
    void load();
  }, [load]);

  async function mutate(endpoint: string, method: string, body?: unknown) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await apiClient(endpoint, { method, body });
      setConfirmation(null);
      setEditing(null);
      setForm(emptyForm);
      setMessage("Changes applied successfully.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to apply changes.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="Account administration"
        title={
          membership?.role === "super_admin"
            ? "Super admin panel"
            : "Admin panel"
        }
        description="Manage account access, personas, and subscription status."
      />
      {error && (
        <div className={styles.error} role="alert">
          {error} <button onClick={() => void load()}>Retry</button>
        </div>
      )}
      {message && (
        <div className={styles.success} role="status">
          {message}
        </div>
      )}
      {loading ? (
        <p role="status">Loading administration…</p>
      ) : membership?.role === "user" ? (
        <div className={styles.notice}>Administrator access is required.</div>
      ) : (
        membership && (
          <>
            <h2>Users</h2>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th scope="col">User</th>
                    <th scope="col">Role / status</th>
                    <th scope="col">Personas</th>
                    <th scope="col">Package / expiration</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        {user.name || "Unnamed user"}
                        <br />
                        <span className={styles.muted}>{user.email}</span>
                      </td>
                      <td>
                        {user.role.replaceAll("_", " ")}
                        <br />
                        {user.active ? "Active" : "Deactivated"}
                      </td>
                      <td>
                        {user.personas.length
                          ? user.personas.map((p) => (
                              <div key={p.id}>{p.name}</div>
                            ))
                          : "No personas"}
                      </td>
                      <td>
                        {user.package_name || "No package"}
                        <br />
                        {user.subscription_status}
                        <br />
                        {user.expires_at &&
                          new Date(user.expires_at).toLocaleString()}
                      </td>
                      <td>
                        {user.role !== "super_admin" &&
                          (membership.role === "super_admin" ||
                            user.role === "user") && (
                            <>
                              <button
                                disabled={busy}
                                onClick={() =>
                                  setConfirmation({
                                    label: `${user.active ? "Deactivate" : "Activate"} ${user.email}?`,
                                    endpoint: `/admin/users/${user.id}/status`,
                                    method: "PATCH",
                                    body: { active: !user.active },
                                  })
                                }
                              >
                                {user.active ? "Deactivate" : "Activate"}
                              </button>
                              {membership.role === "super_admin" && (
                                <button
                                  disabled={busy}
                                  onClick={() =>
                                    setConfirmation({
                                      label: `Change ${user.email} to ${user.role === "admin" ? "user" : "admin"}?`,
                                      endpoint: `/admin/users/${user.id}/role`,
                                      method: "PATCH",
                                      body: {
                                        role:
                                          user.role === "admin"
                                            ? "user"
                                            : "admin",
                                      },
                                    })
                                  }
                                >
                                  {user.role === "admin"
                                    ? "Remove admin role"
                                    : "Make admin"}
                                </button>
                              )}
                            </>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!users.length && <p>No users on this page.</p>}
            <button
              disabled={!offset || busy}
              onClick={() => setOffset(Math.max(0, offset - 50))}
            >
              Previous
            </button>
            <span> Page {offset / 50 + 1} </span>
            <button
              disabled={users.length < 50 || busy}
              onClick={() => setOffset(offset + 50)}
            >
              Next
            </button>
            {membership.role === "super_admin" && (
              <>
                <h2>Packages</h2>
                <p>
                  Changes apply to new subscriptions. Existing terms remain
                  valid until expiration. Deleting a package removes it from
                  selection.
                </p>
                <form
                  className={styles.form}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void mutate(
                      editing
                        ? `/admin/packages/${editing}`
                        : "/admin/packages",
                      editing ? "PUT" : "POST",
                      form,
                    );
                  }}
                >
                  <label>
                    Name
                    <input
                      required
                      maxLength={100}
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      maxLength={1000}
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Persona limit
                    <input
                      required
                      type="number"
                      min={1}
                      max={10000}
                      step={1}
                      value={form.persona_limit}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          persona_limit: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Monthly price
                    <input
                      required
                      type="number"
                      min={0}
                      max={9999999999.99}
                      step="0.01"
                      value={form.monthly_price}
                      onChange={(e) =>
                        setForm({ ...form, monthly_price: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Currency code
                    <input
                      required
                      pattern="[A-Z]{3}"
                      maxLength={3}
                      value={form.currency}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          currency: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </label>
                  <label>
                    Stripe Price ID (required for paid packages)
                    <input
                      value={form.stripe_price_id}
                      placeholder="price_..."
                      pattern="price_[A-Za-z0-9]+"
                      onChange={(e) => setForm({ ...form, stripe_price_id: e.target.value })}
                    />
                  </label>
                  <div>
                    <button className={styles.primary} disabled={busy}>
                      {busy
                        ? "Saving…"
                        : editing
                          ? "Save package"
                          : "Create package"}
                    </button>
                    {editing && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditing(null);
                          setForm(emptyForm);
                        }}
                      >
                        Cancel edit
                      </button>
                    )}
                  </div>
                </form>
                <div className={styles.grid}>
                  {packages.map((plan) => (
                    <article key={plan.id} className={styles.card}>
                      <h2>{plan.name}</h2>
                      <p>{plan.description}</p>
                      <p>
                        {plan.currency} {plan.monthly_price} / month ·{" "}
                        {plan.persona_limit} personas
                      </p>
                      <button
                        disabled={busy}
                        onClick={() => {
                          setEditing(plan.id);
                          setForm({
                            name: plan.name,
                            description: plan.description,
                            persona_limit: plan.persona_limit,
                            monthly_price: String(plan.monthly_price),
                            currency: plan.currency,
                            stripe_price_id: plan.stripe_price_id || "",
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          setConfirmation({
                            label: `Delete package “${plan.name}” from the catalog? Existing subscriptions are preserved.`,
                            endpoint: `/admin/packages/${plan.id}`,
                            method: "DELETE",
                          })
                        }
                      >
                        Delete
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}
            {confirmation && (
              <Dialog
                open
                title="Confirm administration action"
                preventClose={busy}
                onClose={() => setConfirmation(null)}
              >
                <div>
                  {error && (
                    <p className={styles.error} role="alert">
                      {error}
                    </p>
                  )}
                  <h2>Confirm change</h2>
                  <p>{confirmation.label}</p>
                  <button
                    className={styles.primary}
                    disabled={busy}
                    onClick={() =>
                      void mutate(
                        confirmation.endpoint,
                        confirmation.method,
                        confirmation.body,
                      )
                    }
                  >
                    {busy ? "Applying…" : "Confirm"}
                  </button>
                  <button disabled={busy} onClick={() => setConfirmation(null)}>
                    Cancel
                  </button>
                </div>
              </Dialog>
            )}
          </>
        )
      )}
    </main>
  );
}
