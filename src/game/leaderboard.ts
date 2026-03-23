export interface LeaderboardEntry {
  name: string;
  score: number;
}

const API_URL = '/api/scores';

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function submitScore(name: string, score: number): Promise<boolean> {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
