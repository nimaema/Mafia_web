export async function getGameStatus(gameId: string) {
  return await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      moderator: {
        select: { name: true }
      },
      scenario: {
        include: {
          roles: {
            include: { role: true }
          }
        }
      },
      players: {
        include: {
          role: true
        }
      }
    }
  });
}

export async function startGame(gameId: string) {
  try {
    await checkModerator();
    
    // Fetch game with scenario and players
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: true,
        scenario: {
          include: {
            roles: true
          }
        }
      }
    });

    if (!game || !game.scenario) {
      throw new Error("سناریو بازی یافت نشد");
    }

    // Prepare list of role IDs based on scenario count
    const roleIds: string[] = [];
    for (const sr of game.scenario.roles) {
      for (let i = 0; i < sr.count; i++) {
        roleIds.push(sr.roleId);
      }
    }

    if (game.players.length !== roleIds.length) {
      throw new Error(`تعداد بازیکنان (${game.players.length}) با تعداد نقش‌های سناریو (${roleIds.length}) مطابقت ندارد.`);
    }

    // Shuffle role IDs
    for (let i = roleIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roleIds[i], roleIds[j]] = [roleIds[j], roleIds[i]];
    }

    // Assign roles to players
    await prisma.$transaction(
      game.players.map((player, index) => 
        prisma.gamePlayer.update({
          where: { id: player.id },
          data: { roleId: roleIds[index] }
        })
      )
    );
    
    await prisma.game.update({
      where: { id: gameId },
      data: { status: "IN_PROGRESS" }
    });

    await pusherServer.trigger(`game-${gameId}`, 'game-started', {});
    
    return { success: true };
  } catch (error: any) {
    console.error("Start game error:", error);
    return { error: error.message || "خطا در شروع بازی" };
  }
}