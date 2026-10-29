"use client";

import {
  ArrowDown,
  ArrowUp,
  Award,
  BriefcaseBusiness,
  Camera,
  FolderKanban,
  GraduationCap,
  Languages,
  ListTree,
  ListChecks,
  Plus,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";
import { createContext, useContext, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type {
  EditorResumeData,
  ResumeSectionKey,
  RepeatableResumeSection,
} from "@/modules/resume/types";
import { createResumeEntry } from "@/modules/resume/editorDocument";

const SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: "Summary",
  experience: "Work experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certificates: "Certifications",
  languages: "Languages",
  social_links: "Links",
};
const ActiveFormSection = createContext<string | null>(null);

export function ResumeForm({
  resume,
  onChange,
  photoSupported,
  onChoosePhoto,
  photoError,
  activeSection = null,
}: {
  resume: EditorResumeData;
  onChange: (resume: EditorResumeData) => void;
  photoSupported: boolean;
  onChoosePhoto: (file: File) => void;
  photoError: string;
  activeSection?: string | null;
}) {
  const [newSkill, setNewSkill] = useState("");
  const updatePersonal = (field: keyof EditorResumeData, value: string) => {
    onChange({ ...resume, [field]: value });
  };
  const addEntry = (section: RepeatableResumeSection) => {
    onChange(createResumeEntry(resume, section));
  };

  return (
    <ActiveFormSection.Provider value={activeSection}>
      <form
        className="resume-workspace-resume-form"
        onSubmit={(event) => event.preventDefault()}
      >
        <FormSection
          icon={<UserRound size={18} />}
          title="Personal information"
          defaultOpen
        >
          {photoSupported && (
            <div className="resume-workspace-photo-control">
              <div className="resume-workspace-photo-thumb">
                {resume.avatarUrl ? (
                  <img src={resume.avatarUrl} alt="Current profile crop" />
                ) : (
                  <Camera size={22} aria-hidden="true" />
                )}
              </div>
              <div>
                <label
                  className="button button-secondary button-sm"
                  htmlFor="resume-workspace-profile-photo"
                >
                  <Camera size={15} aria-hidden="true" />{" "}
                  {resume.avatarUrl ? "Replace photo" : "Add photo"}
                </label>
                <input
                  id="resume-workspace-profile-photo"
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onChoosePhoto(file);
                    event.currentTarget.value = "";
                  }}
                />
                {resume.avatarUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updatePersonal("avatarUrl", "")}
                  >
                    Remove
                  </Button>
                )}
                <p className="field-hint">
                  JPG, PNG, or WebP up to 5 MB. Cropped locally.
                </p>
                {photoError && (
                  <p className="field-error" role="alert">
                    {photoError}
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="resume-workspace-field-grid">
            <Input
              label="Full name"
              autoComplete="name"
              maxLength={100}
              value={resume.fullName}
              onChange={(event) =>
                updatePersonal("fullName", event.target.value)
              }
            />
            <Input
              label="Professional title"
              maxLength={100}
              value={resume.jobTitle}
              onChange={(event) =>
                updatePersonal("jobTitle", event.target.value)
              }
            />
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={resume.email}
              onChange={(event) => updatePersonal("email", event.target.value)}
            />
            <Input
              label="Phone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
              value={resume.phone}
              onChange={(event) => updatePersonal("phone", event.target.value)}
            />
            <Input
              label="Address / location"
              autoComplete="address-level2"
              maxLength={120}
              value={resume.location}
              onChange={(event) =>
                updatePersonal("location", event.target.value)
              }
            />
          </div>
        </FormSection>

        <FormSection
          icon={<ListChecks size={18} />}
          title="Professional summary"
          defaultOpen
        >
          <Textarea
            label="Summary"
            rows={5}
            maxLength={1200}
            showCount
            value={resume.summary}
            onChange={(event) =>
              onChange({ ...resume, summary: event.target.value })
            }
            placeholder="Summarize your experience, strengths, and the value you bring."
          />
        </FormSection>

        <FormSection
          icon={<BriefcaseBusiness size={18} />}
          title="Work experience"
          count={resume.experience.length}
        >
          <EntryListEmpty visible={resume.experience.length === 0}>
            Add your latest role first.
          </EntryListEmpty>
          {resume.experience.map((item, index) => (
            <EntryCard
              key={item.id}
              title={item.role || item.company || `Experience ${index + 1}`}
              index={index}
              total={resume.experience.length}
              onMove={(direction) =>
                onChange({
                  ...resume,
                  experience: moveItem(resume.experience, index, direction),
                })
              }
              onRemove={() =>
                onChange({
                  ...resume,
                  experience: removeItem(resume.experience, index),
                })
              }
            >
              <div className="resume-workspace-field-grid">
                <Input
                  label="Job title"
                  maxLength={100}
                  value={item.role}
                  onChange={(event) =>
                    onChange({
                      ...resume,
                      experience: updateItem(resume.experience, index, {
                        role: event.target.value,
                      }),
                    })
                  }
                />
                <Input
                  label="Period"
                  value={item.period}
                  onChange={(event) =>
                    onChange({
                      ...resume,
                      experience: updateItem(resume.experience, index, {
                        period: event.target.value,
                      }),
                    })
                  }
                />
                <Input
                  label="Company"
                  maxLength={120}
                  value={item.company}
                  onChange={(event) =>
                    onChange({
                      ...resume,
                      experience: updateItem(resume.experience, index, {
                        company: event.target.value,
                      }),
                    })
                  }
                />
              </div>
              <Textarea
                label="Description / achievements"
                rows={4}
                maxLength={1600}
                showCount
                value={item.details}
                onChange={(event) =>
                  onChange({
                    ...resume,
                    experience: updateItem(resume.experience, index, {
                      details: event.target.value,
                    }),
                  })
                }
              />
            </EntryCard>
          ))}
          <AddButton
            label="Add experience"
            onClick={() => addEntry("experience")}
          />
        </FormSection>

        <FormSection
          icon={<GraduationCap size={18} />}
          title="Education"
          count={resume.education.length}
        >
          <EntryListEmpty visible={resume.education.length === 0}>
            Add a degree, diploma, or other qualification.
          </EntryListEmpty>
          {resume.education.map((item, index) => (
            <EntryCard
              key={item.id}
              title={
                item.degree || item.institution || `Education ${index + 1}`
              }
              index={index}
              total={resume.education.length}
              onMove={(direction) =>
                onChange({
                  ...resume,
                  education: moveItem(resume.education, index, direction),
                })
              }
              onRemove={() =>
                onChange({
                  ...resume,
                  education: removeItem(resume.education, index),
                })
              }
            >
              <div className="resume-workspace-field-grid">
                <Input
                  label="Degree"
                  maxLength={140}
                  value={item.degree}
                  onChange={(event) =>
                    onChange({
                      ...resume,
                      education: updateItem(resume.education, index, {
                        degree: event.target.value,
                      }),
                    })
                  }
                />
                <Input
                  label="Period"
                  value={item.period}
                  onChange={(event) =>
                    onChange({
                      ...resume,
                      education: updateItem(resume.education, index, {
                        period: event.target.value,
                      }),
                    })
                  }
                />
                <Input
                  label="Institution"
                  maxLength={140}
                  value={item.institution}
                  onChange={(event) =>
                    onChange({
                      ...resume,
                      education: updateItem(resume.education, index, {
                        institution: event.target.value,
                      }),
                    })
                  }
                />
              </div>
              <Textarea
                label="Description"
                rows={3}
                maxLength={800}
                showCount
                value={item.grade || ""}
                onChange={(event) =>
                  onChange({
                    ...resume,
                    education: updateItem(resume.education, index, {
                      grade: event.target.value,
                    }),
                  })
                }
              />
            </EntryCard>
          ))}
          <AddButton
            label="Add education"
            onClick={() => addEntry("education")}
          />
        </FormSection>

        <FormSection
          icon={<Wrench size={18} />}
          title="Skills"
          count={resume.skills.length}
        >
          <div className="resume-workspace-inline-add">
            <Input
              label="New skill"
              maxLength={80}
              value={newSkill}
              onChange={(event) => setNewSkill(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                addSkill(newSkill, resume, onChange, setNewSkill);
              }}
            />
            <Button
              size="sm"
              onClick={() => addSkill(newSkill, resume, onChange, setNewSkill)}
            >
              <Plus size={15} /> Add
            </Button>
          </div>
          <div className="resume-workspace-skill-list">
            {resume.skills.map((skill, index) => (
              <div
                className="resume-workspace-skill-item"
                key={`${skill}-${index}`}
              >
                <span>{skill}</span>
                <EntryActions
                  index={index}
                  total={resume.skills.length}
                  label={skill}
                  onMove={(direction) =>
                    onChange({
                      ...resume,
                      skills: moveItem(resume.skills, index, direction),
                    })
                  }
                  onRemove={() =>
                    onChange({
                      ...resume,
                      skills: removeItem(resume.skills, index),
                    })
                  }
                />
              </div>
            ))}
          </div>
        </FormSection>

        <FormSection
          icon={<FolderKanban size={18} />}
          title="Projects"
          count={resume.projects.length}
        >
          <EntryListEmpty visible={resume.projects.length === 0}>
            Add relevant work, personal, or open-source projects.
          </EntryListEmpty>
          {resume.projects.map((item, index) => (
            <EntryCard
              key={item.id}
              title={item.name || `Project ${index + 1}`}
              index={index}
              total={resume.projects.length}
              onMove={(direction) =>
                onChange({
                  ...resume,
                  projects: moveItem(resume.projects, index, direction),
                })
              }
              onRemove={() =>
                onChange({
                  ...resume,
                  projects: removeItem(resume.projects, index),
                })
              }
            >
              <Input
                label="Project title"
                maxLength={140}
                value={item.name}
                onChange={(event) =>
                  onChange({
                    ...resume,
                    projects: updateItem(resume.projects, index, {
                      name: event.target.value,
                    }),
                  })
                }
              />
              <Textarea
                label="Description"
                rows={3}
                maxLength={1000}
                showCount
                value={item.description}
                onChange={(event) =>
                  onChange({
                    ...resume,
                    projects: updateItem(resume.projects, index, {
                      description: event.target.value,
                    }),
                  })
                }
              />
              <div className="resume-workspace-field-grid">
                <Input
                  label="Technologies"
                  hint="Separate with commas"
                  maxLength={300}
                  value={item.technologies.join(", ")}
                  onChange={(event) =>
                    onChange({
                      ...resume,
                      projects: updateItem(resume.projects, index, {
                        technologies: event.target.value
                          .split(",")
                          .map((value) => value.trim())
                          .filter(Boolean),
                      }),
                    })
                  }
                />
                <Input
                  label="Project link"
                  type="url"
                  inputMode="url"
                  maxLength={300}
                  value={item.url || ""}
                  onChange={(event) =>
                    onChange({
                      ...resume,
                      projects: updateItem(resume.projects, index, {
                        url: event.target.value,
                      }),
                    })
                  }
                />
              </div>
            </EntryCard>
          ))}
          <AddButton label="Add project" onClick={() => addEntry("projects")} />
        </FormSection>

        <FormSection
          icon={<Award size={18} />}
          title="Certifications"
          count={resume.certificates.length}
        >
          <EntryListEmpty visible={resume.certificates.length === 0}>
            Add professional certifications and credentials.
          </EntryListEmpty>
          {resume.certificates.map((item, index) => (
            <EntryCard
              key={item.id}
              title={item.title || `Certification ${index + 1}`}
              index={index}
              total={resume.certificates.length}
              onMove={(direction) =>
                onChange({
                  ...resume,
                  certificates: moveItem(resume.certificates, index, direction),
                })
              }
              onRemove={() =>
                onChange({
                  ...resume,
                  certificates: removeItem(resume.certificates, index),
                })
              }
            >
              <div className="resume-workspace-field-grid">
                <Input
                  label="Certification name"
                  maxLength={160}
                  value={item.title}
                  onChange={(event) =>
                    onChange({
                      ...resume,
                      certificates: updateItem(resume.certificates, index, {
                        title: event.target.value,
                      }),
                    })
                  }
                />
                <Input
                  label="Issuing organization"
                  maxLength={160}
                  value={item.issuer}
                  onChange={(event) =>
                    onChange({
                      ...resume,
                      certificates: updateItem(resume.certificates, index, {
                        issuer: event.target.value,
                      }),
                    })
                  }
                />
                <Input
                  label="Date"
                  value={item.date}
                  onChange={(event) =>
                    onChange({
                      ...resume,
                      certificates: updateItem(resume.certificates, index, {
                        date: event.target.value,
                      }),
                    })
                  }
                />
              </div>
            </EntryCard>
          ))}
          <AddButton
            label="Add certification"
            onClick={() => addEntry("certificates")}
          />
        </FormSection>

        <FormSection
          icon={<Languages size={18} />}
          title="Languages"
          count={resume.languages.length}
        >
          <Textarea
            label="Languages (one per line)"
            value={resume.languages.join("\n")}
            onChange={(event) =>
              onChange({ ...resume, languages: event.target.value.split("\n") })
            }
          />
        </FormSection>
        <FormSection icon={<ListTree size={18} />} title="Links">
          {resume.socialLinks.map((link, index) => (
            <div className="resume-workspace-field-grid" key={index}>
              <Input
                label="Link label"
                value={link.platform}
                onChange={(event) =>
                  onChange({
                    ...resume,
                    socialLinks: updateItem(resume.socialLinks, index, {
                      platform: event.target.value,
                    }),
                  })
                }
              />
              <Input
                label="Link URL"
                type="url"
                value={link.url}
                onChange={(event) =>
                  onChange({
                    ...resume,
                    socialLinks: updateItem(resume.socialLinks, index, {
                      url: event.target.value,
                    }),
                  })
                }
              />
              <Button
                variant="ghost"
                onClick={() =>
                  onChange({
                    ...resume,
                    socialLinks: removeItem(resume.socialLinks, index),
                  })
                }
              >
                Remove link
              </Button>
            </div>
          ))}
          <AddButton
            label="Add link"
            onClick={() =>
              onChange({
                ...resume,
                socialLinks: [
                  ...resume.socialLinks,
                  { platform: "Website", url: "" },
                ],
              })
            }
          />
        </FormSection>
        <FormSection icon={<ListTree size={18} />} title="Section order">
          <p className="resume-workspace-section-note">
            The template keeps its designed columns. This order controls how
            content flows when the resume spans additional pages.
          </p>
          <select
            aria-label="Add section"
            value=""
            onChange={(event) => {
              if (event.target.value)
                onChange({
                  ...resume,
                  sectionOrder: [
                    ...resume.sectionOrder,
                    event.target.value as ResumeSectionKey,
                  ],
                  hiddenSections: (resume.hiddenSections || []).filter(
                    (key) => key !== event.target.value,
                  ),
                });
            }}
          >
            <option value="">Add section</option>
            {Object.entries(SECTION_LABELS)
              .filter(
                ([key]) =>
                  !resume.sectionOrder.includes(key as ResumeSectionKey),
              )
              .map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
          </select>
          <div className="resume-workspace-section-order">
            {resume.sectionOrder.map((section, index) => (
              <div
                key={section}
                className="resume-workspace-section-order-item"
              >
                <span>{SECTION_LABELS[section]}</span>
                <EntryActions
                  index={index}
                  total={resume.sectionOrder.length}
                  onRemove={() =>
                    onChange({
                      ...resume,
                      sectionOrder: removeItem(resume.sectionOrder, index),
                      hiddenSections: [
                        ...(resume.hiddenSections || []),
                        section,
                      ],
                    })
                  }
                  label={SECTION_LABELS[section]}
                  onMove={(direction) =>
                    onChange({
                      ...resume,
                      sectionOrder: moveItem(
                        resume.sectionOrder,
                        index,
                        direction,
                      ),
                    })
                  }
                />
              </div>
            ))}
          </div>
        </FormSection>
      </form>
    </ActiveFormSection.Provider>
  );
}

function FormSection({
  icon,
  title,
  count,
  defaultOpen = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const activeSection = useContext(ActiveFormSection);
  if (activeSection && activeSection !== title) return null;
  return (
    <details
      className="resume-workspace-form-section"
      open={Boolean(activeSection) || defaultOpen || undefined}
    >
      <summary>
        <span className="resume-workspace-form-section-title">
          {icon}
          {title}
        </span>
        {count !== undefined && (
          <span className="resume-workspace-form-count">{count}</span>
        )}
      </summary>
      <div className="resume-workspace-form-section-body">{children}</div>
    </details>
  );
}

function EntryCard({
  title,
  index,
  total,
  onMove,
  onRemove,
  children,
}: {
  title: string;
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="resume-workspace-entry-card">
      <legend className="sr-only">{title}</legend>
      <div className="resume-workspace-entry-heading">
        <strong>{title}</strong>
        <EntryActions
          index={index}
          total={total}
          label={title}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>
      <div className="resume-workspace-entry-fields">{children}</div>
    </fieldset>
  );
}

function EntryActions({
  index,
  total,
  label,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  label: string;
  onMove: (direction: -1 | 1) => void;
  onRemove?: () => void;
}) {
  return (
    <span className="resume-workspace-entry-actions">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label={`Move ${label} up`}
      >
        <ArrowUp size={14} />
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === total - 1}
        aria-label={`Move ${label} down`}
      >
        <ArrowDown size={14} />
      </button>
      {onRemove && (
        <button
          type="button"
          className="is-danger"
          onClick={onRemove}
          aria-label={`Remove ${label}`}
        >
          <Trash2 size={14} />
        </button>
      )}
    </span>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="secondary" size="sm" onClick={onClick}>
      <Plus size={15} /> {label}
    </Button>
  );
}

function EntryListEmpty({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return visible ? (
    <p className="resume-workspace-entry-empty">{children}</p>
  ) : null;
}

function updateItem<T>(items: T[], index: number, patch: Partial<T>): T[] {
  return items.map((item, itemIndex) =>
    itemIndex === index ? { ...item, ...patch } : item,
  );
}

function removeItem<T>(items: T[], index: number): T[] {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const destination = index + direction;
  if (destination < 0 || destination >= items.length) return items;
  const next = [...items];
  [next[index], next[destination]] = [next[destination] as T, next[index] as T];
  return next;
}

function addSkill(
  value: string,
  resume: EditorResumeData,
  onChange: (resume: EditorResumeData) => void,
  reset: (value: string) => void,
) {
  const skill = value.trim();
  if (
    !skill ||
    resume.skills.some(
      (existing) => existing.toLowerCase() === skill.toLowerCase(),
    )
  )
    return;
  onChange({ ...resume, skills: [...resume.skills, skill] });
  reset("");
}
