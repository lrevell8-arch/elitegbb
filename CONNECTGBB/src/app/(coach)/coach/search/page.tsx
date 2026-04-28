import PageLayout from "@/components/PageLayout";
import { EmptyState, ErrorState } from "@/components/ui";
import { getPublicPlayers } from "@/lib/adapters/players";
import { SearchWorkspaceClient } from "@/app/(coach)/coach/_components/SearchWorkspaceClient";

export default async function CoachSearchPage() {
  const players = await getPublicPlayers();

  return (
    <PageLayout title="Search Players" subtitle="Filter and evaluate prospects efficiently." eyebrow="Coach Search">
      {players.length === 0 ? (
        <EmptyState title="No players available" description="Player directory is currently empty." />
      ) : (
        <SearchWorkspaceClient players={players} />
      )}
    </PageLayout>
  );
}
