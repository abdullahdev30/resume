"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Plus, Search, Users } from "lucide-react";
import { Alert } from "@/components/feedback/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/common/LoadingState";
import { personaApi } from "../api";
import type { Persona } from "../types";
import { useApiQuery } from "@/lib/use-api-query";
import { MetadataDialog } from "./MetadataDialog";
import styles from "../persona.module.css";

export function PersonaGallery() {
  const router = useRouter();
  const queryResult = useApiQuery<Persona[]>("/personas");
  const items = queryResult.data || [];
  const loading = queryResult.isPending;
  const error = queryResult.data ? "" : queryResult.error?.message || "";
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const filtered = items.filter((item) =>
    `${item.name} ${item.description}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <div className={styles.root}>
      <section className={styles.hero} aria-labelledby="persona-heading">
        <div className={styles.heroTop}>
          <span className={styles.eyebrow}>YOUR PROFESSIONAL IDENTITIES</span>
          <span className={styles.count}>
            {items.length} {items.length === 1 ? "persona" : "personas"}
          </span>
        </div>
        <div className={styles.heroContent}>
          <div>
            <h1 id="persona-heading">A persona for every direction.</h1>
            <p>Different details for each role. Your account stays separate.</p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus size={17} aria-hidden="true" />
            Create a persona
          </Button>
        </div>
        <label className={styles.search}>
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search personas</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search personas by name or description"
          />
        </label>
      </section>
      <div className={styles.listHeading}>
        <h2>Your personas</h2>
        <p>Separate details. Clear possibilities.</p>
      </div>
      {loading ? (
        <LoadingState label="Loading personas..." cards={3} />
      ) : error ? (
        <Alert variant="error">
          {error}{" "}
          <Button
            variant="secondary"
            onClick={() => void queryResult.refetch()}
          >
            Retry
          </Button>
        </Alert>
      ) : filtered.length ? (
        <div className={styles.grid}>
          {filtered.map((persona) => (
            <Link
              key={persona.id}
              href={`/persona/${persona.id}`}
              className={styles.personaCard}
              aria-label={`Open ${persona.name}`}
            >
              <div className={styles.cardBody}>
                <Avatar
                  src={persona.avatar_url || undefined}
                  alt=""
                  fallback={persona.name.slice(0, 1)}
                  size={80}
                />
                <div className={styles.cardCopy}>
                  <h3>{persona.name}</h3>
                  <p>
                    {persona.description ||
                      "Add your details and give this persona a direction."}
                  </p>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.progressLabel}>
                  <span>Profile completeness</span>
                  <strong>{persona.completion}%</strong>
                </div>
                <progress
                  value={persona.completion}
                  max={100}
                  aria-label={`${persona.name} completeness`}
                />
                <span className={styles.openLabel}>
                  Open persona <ArrowRight size={15} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <section className={styles.empty}>
          <Users size={30} aria-hidden="true" />
          <h3>
            {query ? "No matching personas" : "Start with your first persona"}
          </h3>
          <p>
            {query
              ? "Try another name or description."
              : "Give your experience a home. You can add every detail at your own pace."}
          </p>
          {query ? (
            <Button variant="secondary" onClick={() => setQuery("")}>
              Clear search
            </Button>
          ) : (
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} />
              Create a persona
            </Button>
          )}
        </section>
      )}
      {creating && (
        <MetadataDialog
          onClose={() => setCreating(false)}
          onSave={async (value) => {
            const persona = await personaApi.create(value);
            router.push(`/persona/${persona.id}`);
          }}
        />
      )}
    </div>
  );
}
