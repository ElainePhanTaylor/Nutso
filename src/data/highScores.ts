// High Score System - Pinball style with 3-letter initials

export interface HighScoreEntry {
  initials: string; // 3 letters
  score: number;
  level: number;
  date: string;
}

const STORAGE_KEY = 'nutso_highscores';
const MAX_ENTRIES = 10;

export function getHighScores(): HighScoreEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading high scores:', e);
  }
  return getDefaultHighScores();
}

export function getDefaultHighScores(): HighScoreEntry[] {
  // Default high score table
  return [
    { initials: 'NUT', score: 5000, level: 50, date: '2024-01-01' },
    { initials: 'ACE', score: 4000, level: 40, date: '2024-01-01' },
    { initials: 'PRO', score: 3000, level: 30, date: '2024-01-01' },
    { initials: 'FUN', score: 2000, level: 20, date: '2024-01-01' },
    { initials: 'NEW', score: 1000, level: 10, date: '2024-01-01' },
  ];
}

export function saveHighScore(entry: HighScoreEntry): number {
  const scores = getHighScores();
  
  // Add the new entry
  scores.push(entry);
  
  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);
  
  // Keep only top entries
  const trimmed = scores.slice(0, MAX_ENTRIES);
  
  // Save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Error saving high scores:', e);
  }
  
  // Return the rank (1-based) of the new entry, or -1 if not in top 10
  const rank = trimmed.findIndex(s => 
    s.initials === entry.initials && 
    s.score === entry.score && 
    s.level === entry.level &&
    s.date === entry.date
  );
  
  return rank >= 0 ? rank + 1 : -1;
}

export function isHighScore(score: number): boolean {
  const scores = getHighScores();
  if (scores.length < MAX_ENTRIES) return true;
  return score > scores[scores.length - 1].score;
}


