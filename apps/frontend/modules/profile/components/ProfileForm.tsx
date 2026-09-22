"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { User } from "../../auth/types";
import { profileApi } from "../api";

interface ProfileSettingsFormProps {
  user: User;
}

function splitName(name?: string | null) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

export function ProfileForm({ user }: ProfileSettingsFormProps) {
  const name = splitName(user.name);
  const [form, setForm] = useState({
    first_name: name.firstName,
    last_name: name.lastName,
    email: user.email,
    phone: user.number || "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    profileApi
      .getProfile()
      .then((profile) => {
        if (mounted) {
          setForm({
            first_name: profile.personal.first_name,
            last_name: profile.personal.last_name,
            email: profile.personal.email,
            phone: profile.personal.phone,
            address: profile.personal.address,
          });
        }
      })
      .catch(() => {
        setMessage("No resume profile yet. Save this form to create one.");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await profileApi.upsertPersonal(form);
      setMessage("Profile settings updated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="work-surface settings-form" onSubmit={saveProfile}>
      <div className="section-heading">
        <p className="eyebrow">Profile</p>
        <h2>Edit your resume profile</h2>
        <p>These details are used to prepare your resume content.</p>
      </div>

      {(error || message) && (
        <div className={error ? "notice is-error" : "notice is-success"}>
          {error || message}
        </div>
      )}

      <div className="form-grid">
        <Input
          label="First name"
          value={form.first_name}
          onChange={(event) =>
            setForm({ ...form, first_name: event.target.value })
          }
          disabled={loading}
        />
        <Input
          label="Last name"
          value={form.last_name}
          onChange={(event) =>
            setForm({ ...form, last_name: event.target.value })
          }
          disabled={loading}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          disabled={loading}
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          disabled={loading}
        />
        <Input
          label="Address"
          value={form.address}
          onChange={(event) =>
            setForm({ ...form, address: event.target.value })
          }
          disabled={loading}
          style={{ gridColumn: "1 / -1" }}
        />
      </div>

      <div className="action-row">
        <Button type="submit" disabled={saving || loading}>
          {saving ? "Saving" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
