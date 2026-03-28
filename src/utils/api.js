const BASE = import.meta.env.VITE_SERVER_URL || '';

export async function createRoom() {
  const res = await fetch(`${BASE}/room/create`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create room');
  return res.json(); // { roomId }
}

export async function checkRoom(roomId) {
  const res = await fetch(`${BASE}/room/${roomId}/exists`);
  if (!res.ok) throw new Error('Network error');
  return res.json(); // { exists, userCount, full }
}
