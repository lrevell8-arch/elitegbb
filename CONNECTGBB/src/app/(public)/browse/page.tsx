"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { UpgradeBanner } from "@/components/ui/UpgradeBanner";
import { getPublicPlayers, type PublicPlayerProfile } from "@/lib/adapters/players";

interface PlayerPreviewCardProps {
  player: PublicPlayerProfile;
  isAuthenticated: boolean;
}

function PlayerPreviewCard({ player, isAuthenticated }: PlayerPreviewCardProps) {
  return (
    <div className="bg-[var(--surface)] border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <ProfileAvatar
          src={player.avatarUrl}
          initials={player.name.split(" ").map(n => n[0]).join("")}
          size="md"
        />
        <div className="flex-1">
          <h3 className={`font-semibold ${!isAuthenticated ? 'blur-sm select-none' : ''}`}>
            {player.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--foreground)]/80">{player.position}</span>
            <span className="text-sm text-[var(--foreground)]/80">•</span>
            <span className="text-sm text-[var(--foreground)]/80">Class of {player.gradYear}</span>
            <span className="text-sm text-[var(--foreground)]/80">•</span>
            <span className="text-sm text-[var(--foreground)]/80">{player.state}</span>
          </div>
        </div>
        <VerificationBadge status={player.verified ? "verified" : "unverified"} />
      </div>
      {!isAuthenticated && (
        <div className="relative">
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <UpgradeBanner
              currentPlan="Free"
              upgradeTo="Pro"
              onUpgrade={() => {/* handle upgrade */}}
            />
          </div>
        </div>
      )}
      <Link
        href={`/players/${player.id}`}
        className="w-full inline-flex items-center justify-center bg-[var(--brand-primary)] text-white py-2 px-4 rounded-lg font-medium hover:bg-[var(--brand-primary)]/90 transition-colors"
      >
        View Profile
      </Link>
    </div>
  );
}

export default function BrowsePage() {
  const [players, setPlayers] = useState<PublicPlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"recent" | "gradYear" | "height">("recent");
  const [filters, setFilters] = useState({
    positions: [] as string[],
    gradYears: [] as number[],
    state: "",
    heightMin: 60, // 5'0"
    heightMax: 80, // 6'8"
    verifiedOnly: false,
  });

  const { session } = useAuth();
  const isAuthenticated = Boolean(session);

  useEffect(() => {
    async function loadPlayers() {
      setLoading(true);
      const data = await getPublicPlayers();
      setPlayers(data);
      setLoading(false);
    }
    loadPlayers();
  }, []);

  const filteredPlayers = players.filter(player => {
    if (filters.positions.length > 0 && !filters.positions.includes(player.position)) return false;
    if (filters.gradYears.length > 0 && !filters.gradYears.includes(player.gradYear)) return false;
    if (filters.state && player.state !== filters.state) return false;
    if (player.heightInches < filters.heightMin || player.heightInches > filters.heightMax) return false;
    if (filters.verifiedOnly && !player.verified) return false;
    return true;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    switch (sortBy) {
      case "gradYear":
        return a.gradYear - b.gradYear;
      case "height":
        return b.heightInches - a.heightInches;
      default:
        return 0; // recent - assume already sorted
    }
  });

  const itemsPerPage = 24;
  const totalPages = Math.ceil(sortedPlayers.length / itemsPerPage);
  const paginatedPlayers = sortedPlayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <div className="bg-[var(--surface)] border border-white/10 rounded-lg p-6 sticky top-4">
            <h3 className="font-semibold text-[var(--foreground)] mb-4">Filters</h3>

            {/* Position */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Position</label>
              <div className="space-y-2">
                {["PG", "SG", "SF", "PF", "C"].map(pos => (
                  <label key={pos} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.positions.includes(pos)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, positions: [...prev.positions, pos] }));
                        } else {
                          setFilters(prev => ({ ...prev, positions: prev.positions.filter(p => p !== pos) }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-[var(--foreground)]/80">{pos}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Grad Year */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Graduation Year</label>
              <div className="space-y-2">
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i).map(year => (
                  <label key={year} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.gradYears.includes(year)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, gradYears: [...prev.gradYears, year] }));
                        } else {
                          setFilters(prev => ({ ...prev, gradYears: prev.gradYears.filter(y => y !== year) }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-[var(--foreground)]/80">{year}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* State */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">State</label>
              <select
                value={filters.state}
                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                className="w-full bg-[var(--surface-muted)] border border-white/10 rounded px-3 py-2 text-[var(--foreground)]"
              >
                <option value="">All States</option>
                {/* Add state options */}
              </select>
            </div>

            {/* Height */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Height</label>
              <input
                type="range"
                min="60"
                max="80"
                value={filters.heightMin}
                onChange={(e) => setFilters(prev => ({ ...prev, heightMin: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="text-xs text-[var(--foreground)]/60 mt-1">
                Min: {Math.floor(filters.heightMin / 12)}'{filters.heightMin % 12}"
              </div>
            </div>

            {/* Verified Only */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-[var(--foreground)]/80">Verified Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          {/* Sort Bar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-[var(--foreground)]/80">
              {filteredPlayers.length} players found
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-[var(--surface)] border border-white/10 rounded px-3 py-2 text-[var(--foreground)]"
            >
              <option value="recent">Recently Active</option>
              <option value="gradYear">Grad Year</option>
              <option value="height">Height</option>
            </select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[var(--surface)] border border-white/10 rounded-lg p-4 animate-pulse">
                  <div className="h-12 bg-[var(--surface-muted)] rounded mb-4"></div>
                  <div className="h-8 bg-[var(--surface-muted)] rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPlayers.map(player => (
                  <PlayerPreviewCard
                    key={player.id}
                    player={player}
                    isAuthenticated={isAuthenticated}
                    onViewProfile={() => {/* handle view */}}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-8">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
