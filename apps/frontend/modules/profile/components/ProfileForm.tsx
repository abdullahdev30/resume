"use client";

import type { FormEvent, ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { Camera, Upload, Trash2, FileText, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { User as UserType } from "../../auth/types";
import { profileApi } from "../api";

interface ProfileSettingsFormProps {
  user: UserType;
}

interface UploadedDocument {
  id: string;
  name: string;
  url: string;
  size: string;
  uploadedAt: string;
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
  const [activeTab, setActiveTab] = useState<"profile" | "avatar" | "documents">("profile");

  const [form, setForm] = useState({
    first_name: name.firstName,
    last_name: name.lastName,
    email: user.email,
    phone: user.number || "",
    address: "New York, USA",
    job_title: "Product Designer",
    summary: "Creative product designer crafting intuitive user interfaces and modern web applications.",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  useEffect(() => {
    let mounted = true;

    if (typeof window !== "undefined") {
      const savedAvatar = localStorage.getItem("user_avatar");
      if (savedAvatar) setAvatarUrl(savedAvatar);
      
      profileApi.getDocuments().then(setDocuments).catch(() => setDocuments([]));
    }

    profileApi
      .getProfile()
      .then((profile) => {
        if (mounted && profile?.personal) {
          setForm({
            first_name: profile.personal.first_name || name.firstName,
            last_name: profile.personal.last_name || name.lastName,
            email: profile.personal.email || user.email,
            phone: profile.personal.phone || user.number || "",
            address: profile.personal.address || "New York, USA",
            job_title: "Product Designer",
            summary: "Creative product designer crafting intuitive user interfaces and modern web applications.",
          });
        }
      })
      .catch(() => {
        setMessage("Manage your resume profile and details below.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user.email, user.number]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await profileApi.upsertPersonal({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      });
      setMessage("Profile details saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError("");
    setMessage("");

    try {
      const result = await profileApi.uploadAvatar(file);
      setAvatarUrl(result.url);
      setMessage("Profile avatar updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDocumentChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    setError("");
    setMessage("");

    try {
      const newDoc = await profileApi.uploadDocument(file);
      setDocuments((prev) => [newDoc, ...prev]);
      setMessage(`Document "${file.name}" uploaded successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const deleteDocument = (id: string) => {
    const updated = documents.filter((doc) => doc.id !== id);
    setDocuments(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("user_documents", JSON.stringify(updated));
    }
    setMessage("Document removed.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#E3E8EE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#0E7C7B] bg-[#E3F4F3] text-[#0E7C7B] flex items-center justify-center text-xl font-extrabold shadow-xs">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{(form.first_name[0] || "U").toUpperCase()}</span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-[#0E7C7B] text-white p-1.5 rounded-full cursor-pointer shadow-md hover:bg-[#0A6463]">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-[#0F1B2D]">
              {form.first_name} {form.last_name}
            </h1>
            <p className="text-[#5B6B7F] text-xs mt-0.5">
              {form.email} • {form.phone || "No phone set"}
            </p>
          </div>
        </div>

        {/* Settings Tab Selector */}
        <div className="flex gap-2 border-t md:border-t-0 border-[#E3E8EE] pt-3 md:pt-0">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition ${
              activeTab === "profile"
                ? "bg-[#0E7C7B] text-white shadow-xs"
                : "bg-[#F7F9FB] text-[#5B6B7F] hover:bg-[#E3F4F3] border border-[#E3E8EE]"
            }`}
          >
            Profile & Details
          </button>
          <button
            onClick={() => setActiveTab("avatar")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition ${
              activeTab === "avatar"
                ? "bg-[#0E7C7B] text-white shadow-xs"
                : "bg-[#F7F9FB] text-[#5B6B7F] hover:bg-[#E3F4F3] border border-[#E3E8EE]"
            }`}
          >
            Avatar Photo
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition ${
              activeTab === "documents"
                ? "bg-[#0E7C7B] text-white shadow-xs"
                : "bg-[#F7F9FB] text-[#5B6B7F] hover:bg-[#E3F4F3] border border-[#E3E8EE]"
            }`}
          >
            Documents ({documents.length})
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="bg-[#E3F4F3] border-l-4 border-[#0E7C7B] p-4 rounded-xl flex items-center gap-3 text-[#0E7C7B] text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Profile & Onboarding Details */}
      {activeTab === "profile" && (
        <form onSubmit={saveProfile} className="bg-white rounded-2xl p-6 md:p-8 border border-[#E3E8EE] shadow-xs space-y-6">
          <div className="border-b border-[#E3E8EE] pb-4">
            <h2 className="text-lg font-bold text-[#0F1B2D]">Profile Details</h2>
            <p className="text-[#5B6B7F] text-xs mt-0.5">
              Data entered during onboarding displayed here. Updating this updates your resume info.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              disabled={loading}
            />
            <Input
              label="Last Name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              disabled={loading}
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={loading}
            />
            <Input
              label="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={loading}
            />
            <Input
              label="Job Title / Headline"
              value={form.job_title}
              onChange={(e) => setForm({ ...form, job_title: e.target.value })}
              disabled={loading}
            />
            <Input
              label="Address / Location"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-[#E3E8EE]">
            <Button type="submit" disabled={saving || loading}>
              {saving ? "Saving..." : "Save Profile Details"}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Avatar Photo */}
      {activeTab === "avatar" && (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#E3E8EE] shadow-xs space-y-6">
          <div className="border-b border-[#E3E8EE] pb-4">
            <h2 className="text-lg font-bold text-[#0F1B2D]">Profile Avatar</h2>
            <p className="text-[#5B6B7F] text-xs mt-0.5">
              Upload a headshot photo for templates that support candidate profile images.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-[#F7F9FB] rounded-xl border border-dashed border-[#E3E8EE]">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#0E7C7B] bg-white flex items-center justify-center shadow-xs">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-[#5B6B7F]" />
              )}
            </div>

            <div className="space-y-3 text-center sm:text-left">
              <h3 className="font-bold text-sm text-[#0F1B2D]">Upload Avatar Image</h3>
              <p className="text-xs text-[#5B6B7F]">Supports JPG, PNG, WEBP files up to 5MB.</p>
              <div className="flex gap-3 justify-center sm:justify-start">
                <label className="bg-[#0E7C7B] hover:bg-[#0A6463] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition flex items-center space-x-1.5">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingAvatar ? "Uploading..." : "Browse Photo"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                </label>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl("");
                      localStorage.removeItem("user_avatar");
                      setMessage("Avatar removed.");
                    }}
                    className="bg-[#F7F9FB] border border-[#E3E8EE] text-[#5B6B7F] hover:text-[#0F1B2D] text-xs font-semibold px-3 py-2 rounded-xl"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Documents Upload */}
      {activeTab === "documents" && (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#E3E8EE] shadow-xs space-y-6">
          <div className="border-b border-[#E3E8EE] pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-[#0F1B2D]">Uploaded Resumes & Attachments</h2>
              <p className="text-[#5B6B7F] text-xs mt-0.5">Upload external resumes or portfolio PDFs.</p>
            </div>
            <label className="bg-[#0E7C7B] hover:bg-[#0A6463] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition flex items-center space-x-1.5">
              <Upload className="w-4 h-4" />
              <span>{uploadingDoc ? "Uploading..." : "+ Upload File"}</span>
              <input type="file" accept=".pdf,.doc,.docx,.png,.jpg" className="hidden" onChange={handleDocumentChange} disabled={uploadingDoc} />
            </label>
          </div>

          {documents.length === 0 ? (
            <div className="border border-dashed border-[#E3E8EE] rounded-2xl p-10 text-center bg-[#F7F9FB]">
              <FileText className="w-10 h-10 text-[#5B6B7F] mx-auto mb-2" />
              <h4 className="font-bold text-[#0F1B2D] text-sm">No files uploaded</h4>
              <p className="text-xs text-[#5B6B7F] mt-1 mb-4">Upload existing PDFs or documents to keep them in your profile.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 rounded-xl border border-[#E3E8EE] bg-[#F7F9FB] flex items-center justify-between">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileText className="w-5 h-5 text-[#0E7C7B] flex-shrink-0" />
                    <div className="truncate">
                      <h4 className="font-bold text-xs text-[#0F1B2D] truncate">{doc.name}</h4>
                      <p className="text-[11px] text-[#5B6B7F]">{doc.size} • {doc.uploadedAt}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="p-1.5 text-[#5B6B7F] hover:text-rose-600 rounded-lg"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
