import { StatCard } from "@/components/ui/StatCard";
import { ProgressCard } from "@/components/ui/ProgressCard";

const summary = [
  { label: "Lessons Completed", value: "38", delta: "+4 this week" },
  { label: "Drills Done", value: "112", delta: "+9 this week" },
  { label: "Hours Logged", value: "41", delta: "+2.5 this week" },
  { label: "Streak", value: "12 days", delta: "Best: 18 days" },
];

const milestones = [
  { label: "Starter", unlocked: true },
  { label: "Film Room", unlocked: true },
  { label: "Recruiting Ready", unlocked: false },
  { label: "All-Access", unlocked: false },
];

const goals = [
  { label: "Complete 3 shooting lessons", progress: 67 },
  { label: "Upload one new highlight", progress: 30 },
  { label: "Reach 15-day streak", progress: 80 },
];

export default function DashboardProgressPage() {
  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} delta={item.delta} />
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="bg-[var(--surface)] border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
          Weekly Activity Chart
        </h2>
        <div className="h-64 bg-[var(--surface-muted)] rounded-lg flex items-center justify-center">
          <p className="text-[var(--foreground)]/60">Chart visualization coming soon</p>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-[var(--surface)] border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
          Milestones
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {milestones.map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-4 border border-white/10 rounded-lg bg-[var(--surface-muted)]">
              <div className={`text-2xl ${item.unlocked ? 'text-yellow-400' : 'text-gray-400'}`}>
                {item.unlocked ? '🏅' : '🔒'}
              </div>
              <div>
                <p className="font-medium text-[var(--foreground)]">{item.label}</p>
                <p className="text-sm text-[var(--foreground)]/60">
                  {item.unlocked ? 'Unlocked' : 'Locked'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div className="bg-[var(--surface)] border border-white/10 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
          Current Goals
        </h2>
        <div className="space-y-4">
          {goals.map((goal) => (
            <ProgressCard
              key={goal.label}
              label={goal.label}
              value={goal.progress}
              maxValue={100}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
