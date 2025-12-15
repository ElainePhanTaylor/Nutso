// Level configuration data
export interface LevelConfig {
  basketY: number; // Y position (0-1 relative to playable height)
  basketX: number; // X position (0-1 relative to width, from right)
  branches: BranchConfig[];
  isBossLevel: boolean;
}

export interface BranchConfig {
  x: number; // 0-1 relative to width
  y: number; // 0-1 relative to height
  width: number; // pixels
}

// Generate level configs - 100 levels
export function getLevelConfig(level: number): LevelConfig {
  // Boss levels every 10th level
  if (level % 10 === 0) {
    return {
      basketY: 0.5,
      basketX: 0.15,
      branches: [],
      isBossLevel: true,
    };
  }

  // Regular levels with increasing difficulty
  const difficulty = Math.min(level / 100, 1); // 0 to 1 based on level
  
  // Basket position varies
  const basketY = 0.3 + Math.sin(level * 0.5) * 0.2 * difficulty;
  const basketX = 0.1 + (level % 5) * 0.02;

  // Number of branches increases with level
  const numBranches = Math.min(Math.floor(level / 8), 5);
  
  const branches: BranchConfig[] = [];
  
  for (let i = 0; i < numBranches; i++) {
    // Spread branches across the play area
    const branchX = 0.3 + (i / Math.max(numBranches - 1, 1)) * 0.4;
    const branchY = 0.3 + ((i % 3) / 3) * 0.4;
    const branchWidth = 80 + Math.random() * 60;
    
    branches.push({
      x: branchX + (Math.random() - 0.5) * 0.1,
      y: branchY + (Math.random() - 0.5) * 0.1,
      width: branchWidth,
    });
  }

  return {
    basketY,
    basketX,
    branches,
    isBossLevel: false,
  };
}



