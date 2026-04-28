import { ProfileHero } from "@/components/ui/ProfileHero";
import { ProfileCompletionCard } from "@/components/ui/ProfileCompletionCard";
import { PlayerInfoGrid } from "@/components/ui/PlayerInfoGrid";
import { ProfileEditorClient, type ProfileEditorValues } from "@/app/(member)/dashboard/_components/ProfileEditorClient";

const defaultProfileValues: ProfileEditorValues = {
  height: "5'10\"",
  weight: "155 lbs",
  wingspan: "6'1\"",
  school: "Northview High",
  gpaRange: "3.6 - 3.8",
  testRange: "SAT 1220",
  intendedMajor: "Sports Management",
  graduationYear: "2027",
  visibility: "members_only",
};

const playerInfo = {
  height: "5'10\"",
  weight: "155 lbs",
  wingspan: "6'1\"",
  position: "PG",
  school: "Northview High",
  gpa: "3.7",
  gradYear: 2027,
};

export default function DashboardProfilePage() {
  return (
    <div className="space-y-8">
      {/* Profile Hero */}
      <ProfileHero
        name="Jordan Athlete"
        position="PG"
        gradYear={2027}
        location="Atlanta, GA"
        verified={false}
      />

      {/* Profile Completion */}
      <ProfileCompletionCard
        completionPercentage={65}
        missingFields={["Academic scores", "Highlight videos", "Coach endorsements"]}
      />

      {/* Player Info Grid */}
      <PlayerInfoGrid {...playerInfo} />

      {/* Profile Editor */}
      <div className="bg-[var(--surface)] border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
          Edit Profile Details
        </h2>
        <ProfileEditorClient initialValues={defaultProfileValues} />
      </div>
    </div>
  );
}
