export function judge(arrow, player) {
  const distance = Math.sqrt(
    (player.x - arrow.x) ** 2 + (player.y - arrow.y) ** 2
  );
  if (distance < 30) return true;
  else return false;
}
