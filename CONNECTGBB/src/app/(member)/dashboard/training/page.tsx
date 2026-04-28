"use client";

import { TrainingClient } from "@/app/(member)/dashboard/_components/TrainingClient";
import { getTrainingDashboardData } from "@/lib/adapters/training";

export default function DashboardTrainingPage() {
  // For now, use mock data until adapter is implemented
  const mockData = {
    featuredProgram: {
      title: "Point Guard Fundamentals",
      description: "Master the skills every great PG needs",
      progressPercent: 45,
    },
    videos: [
      {
        id: "v1",
        title: "Ball Handling Drills",
        category: "Ball Handling" as const,
        difficulty: "intermediate" as const,
        durationMinutes: 15,
        progressPercent: 75,
        completed: false,
        thumbnailUrl: "/placeholder-video.jpg",
      },
      {
        id: "v2",
        title: "Court Vision Exercises",
        category: "Decision Making" as const,
        difficulty: "advanced" as const,
        durationMinutes: 20,
        progressPercent: 100,
        completed: true,
        thumbnailUrl: "/placeholder-video.jpg",
      },
    ],
    drills: [
      {
        id: "d1",
        title: "Dribble Knockout",
        category: "Ball Handling",
        equipment: "Basketball",
        durationMinutes: 10,
        icon: "🏀",
      },
      {
        id: "d2",
        title: "Pick and Roll Reads",
        category: "Team Offense",
        equipment: "Basketball, Cones",
        durationMinutes: 15,
        icon: "👥",
      },
    ],
  };

  return <TrainingClient data={mockData} />;
}
