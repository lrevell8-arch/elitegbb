"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import { supabaseClient } from "@/lib/supabaseClient";

type TrainingContent = {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  level: string | null;
};

const trainingCategories = [
  "Ball Handling",
  "Shooting",
  "IQ / Film Study",
  "Strength & Conditioning",
  "Recruiting Education",
];

export default function DashboardTrainingPage() {
  const [content, setContent] = useState<TrainingContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      const { data } = await supabaseClient
        .from("training_content")
        .select("id, title, description, content_type, level")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(6);

      setContent(data || []);
      setLoading(false);
    };

    loadContent();
  }, []);

  return (
    <PageLayout
      title="Training Hub"
      subtitle="Access curated video lessons, drills, clinics, and PDFs tailored to your level and position."
      eyebrow="Training"
    >
      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-lg font-semibold text-white">Latest training drops</h2>
        {loading ? (
          <p className="mt-3 text-sm text-white/70">Loading training content...</p>
        ) : null}
        {!loading && content.length === 0 ? (
          <p className="mt-3 text-sm text-white/70">
            No published training content yet. Add drills and videos in the admin dashboard.
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {content.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs text-white/60">
                {item.content_type.toUpperCase()} · {item.level || "All levels"}
              </p>
              {item.description ? (
                <p className="mt-2 text-xs text-white/60">{item.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {trainingCategories.map((category) => (
          <div key={category} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold text-white">{category}</p>
            <p className="mt-2 text-xs text-white/60">Filtered playlists + progress tracking</p>
          </div>
        ))}
      </section>
    </PageLayout>
  );
}
