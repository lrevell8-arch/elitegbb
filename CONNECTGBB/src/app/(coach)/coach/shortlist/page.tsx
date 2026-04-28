import PageLayout from "@/components/PageLayout";
import { EmptyState, ErrorState } from "@/components/ui";
import { getPublicPlayers } from "@/lib/adapters/players";
import { ShortlistManagerClient } from "@/app/(coach)/coach/_components/ShortlistManagerClient";

export default async function CoachShortlistPage() {
  const players = await getPublicPlayers();

  const shortlist = players.slice(0, 5).map((player) => ({
    id: player.id,
    player_name: player.name,
    grad_class: player.gradYear,
    primary_position: player.position,
    state: player.state,
    verified: player.verified,
  }));

  return (
    <PageLayout title="Shortlist" subtitle="Organize priority prospects and track recruiting workflow." eyebrow="Coach Shortlist">
      {shortlist.length === 0 ? <EmptyState title="Your shortlist is empty. Start searching for prospects." description="Visit search to add players." /> : <ShortlistManagerClient players={shortlist} />}
    </PageLayout>
  );
}
