-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "handicap" DOUBLE PRECISION NOT NULL,
    "photoUrl" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "inviteSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "arrivalDate" TIMESTAMP(3),
    "arrivalTime" TEXT,
    "arrivalAirport" TEXT,
    "arrivalFlight" TEXT,
    "departureDate" TIMESTAMP(3),
    "departureTime" TEXT,
    "departureAirport" TEXT,
    "departureFlight" TEXT,
    "villaId" TEXT,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Villa" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Villa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "courseId" TEXT,
    "activeTeeBox" TEXT,
    "teeTime" TEXT NOT NULL,
    "teeSlots" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isRyderCup" BOOLEAN NOT NULL DEFAULT true,
    "format" TEXT NOT NULL DEFAULT 'Foursomes',
    "formatId" TEXT,
    "handicapAllowance" INTEGER,
    "scoringType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundPlayerHandicap" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playingHandicap" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoundPlayerHandicap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundAvailability" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RoundAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RyderCupTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamNumber" INTEGER NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RyderCupTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RyderCupTeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "RyderCupTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "teeSlotIndex" INTEGER,
    "teamAId" TEXT NOT NULL,
    "teamBId" TEXT NOT NULL,
    "result" TEXT,
    "pointsA" DOUBLE PRECISION,
    "pointsB" DOUBLE PRECISION,
    "ghostDifficulty" TEXT NOT NULL DEFAULT 'AUTO',
    "overridePointsA" DOUBLE PRECISION,
    "overridePointsB" DOUBLE PRECISION,
    "overrideLabel" TEXT,
    "overrideNote" TEXT,
    "overriddenAt" TIMESTAMP(3),
    "overriddenById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "absentOverride" BOOLEAN,

    CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "playerId" TEXT,
    "hole" INTEGER NOT NULL,
    "strokes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Format" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "teamSize" INTEGER NOT NULL,
    "scoringType" TEXT NOT NULL,
    "teamScoringMode" TEXT NOT NULL,
    "handicapCombine" TEXT NOT NULL,
    "defaultAllowance" INTEGER NOT NULL,
    "strokeEntryMode" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "stablefordConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Format_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designer" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeeBox" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "totalYards" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION,
    "slope" INTEGER,

    CONSTRAINT "TeeBox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hole" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "holeNumber" INTEGER NOT NULL,
    "par" INTEGER NOT NULL,
    "handicapIndex" INTEGER NOT NULL,

    CONSTRAINT "Hole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoleYardage" (
    "id" TEXT NOT NULL,
    "holeId" TEXT NOT NULL,
    "teeBoxId" TEXT NOT NULL,
    "yards" INTEGER NOT NULL,

    CONSTRAINT "HoleYardage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealReservation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "restaurant" TEXT NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "headcount" INTEGER,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeeTimeNotification" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeeTimeNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_key" ON "Player"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Round_roundNumber_key" ON "Round"("roundNumber");

-- CreateIndex
CREATE INDEX "RoundPlayerHandicap_roundId_idx" ON "RoundPlayerHandicap"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "RoundPlayerHandicap_roundId_playerId_key" ON "RoundPlayerHandicap"("roundId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "RoundAvailability_playerId_roundId_key" ON "RoundAvailability"("playerId", "roundId");

-- CreateIndex
CREATE UNIQUE INDEX "RyderCupTeam_teamNumber_key" ON "RyderCupTeam"("teamNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RyderCupTeamMember_playerId_key" ON "RyderCupTeamMember"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_roundId_matchNumber_key" ON "Match"("roundId", "matchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MatchPlayer_matchId_playerId_key" ON "MatchPlayer"("matchId", "playerId");

-- CreateIndex
CREATE INDEX "Score_matchId_hole_idx" ON "Score"("matchId", "hole");

-- CreateIndex
CREATE INDEX "Score_matchId_side_hole_idx" ON "Score"("matchId", "side", "hole");

-- CreateIndex
CREATE UNIQUE INDEX "Score_matchId_playerId_hole_key" ON "Score"("matchId", "playerId", "hole");

-- CreateIndex
CREATE UNIQUE INDEX "Format_name_key" ON "Format"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Format_slug_key" ON "Format"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Course_name_key" ON "Course"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TeeBox_courseId_name_key" ON "TeeBox"("courseId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Hole_courseId_holeNumber_key" ON "Hole"("courseId", "holeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HoleYardage_holeId_teeBoxId_key" ON "HoleYardage"("holeId", "teeBoxId");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_playerId_idx" ON "PushSubscription"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TeeTimeNotification_matchId_key" ON "TeeTimeNotification"("matchId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_villaId_fkey" FOREIGN KEY ("villaId") REFERENCES "Villa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "Format"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundPlayerHandicap" ADD CONSTRAINT "RoundPlayerHandicap_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundPlayerHandicap" ADD CONSTRAINT "RoundPlayerHandicap_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundAvailability" ADD CONSTRAINT "RoundAvailability_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundAvailability" ADD CONSTRAINT "RoundAvailability_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RyderCupTeamMember" ADD CONSTRAINT "RyderCupTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "RyderCupTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RyderCupTeamMember" ADD CONSTRAINT "RyderCupTeamMember_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "RyderCupTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "RyderCupTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_overriddenById_fkey" FOREIGN KEY ("overriddenById") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeeBox" ADD CONSTRAINT "TeeBox_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hole" ADD CONSTRAINT "Hole_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoleYardage" ADD CONSTRAINT "HoleYardage_holeId_fkey" FOREIGN KEY ("holeId") REFERENCES "Hole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoleYardage" ADD CONSTRAINT "HoleYardage_teeBoxId_fkey" FOREIGN KEY ("teeBoxId") REFERENCES "TeeBox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLink" ADD CONSTRAINT "MagicLink_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeeTimeNotification" ADD CONSTRAINT "TeeTimeNotification_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

