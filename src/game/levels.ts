/**
 * Super Mario Bros 8-Bit Levels
 * Contains tilemaps, enemy spawns, and scenery for World 1-1, 1-2, and 1-4.
 */

import { LevelData, Block, Enemy, SceneryItem, Item } from './types';

export function getLevelData(world: string): LevelData {
  switch (world) {
    case '1-2':
      return createWorld1_2();
    case '1-4':
      return createWorld1_4();
    case '1-1':
    default:
      return createWorld1_1();
  }
}

/**
 * World 1-1: Iconic Grassland Overworld
 */
function createWorld1_1(): LevelData {
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const scenery: SceneryItem[] = [];
  const items: Item[] = [];

  const widthInTiles = 180;
  const TILE = 16;

  // Add Ground Tiles (Y = 13 and 14) with pits at specific spots
  const pits = [
    { start: 69, end: 71 },
    { start: 86, end: 89 },
    { start: 153, end: 155 },
  ];

  for (let tx = 0; tx < widthInTiles; tx++) {
    const inPit = pits.some((p) => tx >= p.start && tx <= p.end);
    if (!inPit) {
      blocks.push({
        x: tx * TILE,
        y: 13 * TILE,
        type: 'ground',
        bumpOffset: 0,
        bumpTimer: 0,
        isBumped: false,
      });
      blocks.push({
        x: tx * TILE,
        y: 14 * TILE,
        type: 'ground',
        bumpOffset: 0,
        bumpTimer: 0,
        isBumped: false,
      });
    }
  }

  // Scenery (Hills, Bushes, Clouds)
  for (let s = 0; s < widthInTiles; s += 48) {
    scenery.push({ x: s * TILE, y: 10 * TILE, type: 'hill_large' });
    scenery.push({ x: (s + 16) * TILE, y: 11 * TILE, type: 'bush_triple' });
    scenery.push({ x: (s + 8) * TILE, y: 3 * TILE, type: 'cloud_single' });
    scenery.push({ x: (s + 28) * TILE, y: 2 * TILE, type: 'cloud_triple' });
    scenery.push({ x: (s + 36) * TILE, y: 11 * TILE, type: 'hill_small' });
    scenery.push({ x: (s + 42) * TILE, y: 11 * TILE, type: 'bush_single' });
  }

  // Helper for adding pipes
  const addPipe = (tx: number, heightTiles: number, enterable: boolean = false) => {
    const topY = 13 - heightTiles;
    // Pipe top
    blocks.push({ x: tx * TILE, y: topY * TILE, type: 'pipe_tl', bumpOffset: 0, bumpTimer: 0, isBumped: false });
    blocks.push({ x: (tx + 1) * TILE, y: topY * TILE, type: 'pipe_tr', bumpOffset: 0, bumpTimer: 0, isBumped: false });
    // Pipe shaft
    for (let py = topY + 1; py < 13; py++) {
      blocks.push({ x: tx * TILE, y: py * TILE, type: 'pipe_bl', bumpOffset: 0, bumpTimer: 0, isBumped: false });
      blocks.push({ x: (tx + 1) * TILE, y: py * TILE, type: 'pipe_br', bumpOffset: 0, bumpTimer: 0, isBumped: false });
    }
    // Add Piranha Plant if tall enough and not enterable
    if (heightTiles >= 3 && !enterable) {
      enemies.push({
        id: `piranha_${tx}`,
        type: 'piranha',
        x: tx * TILE + 8,
        y: topY * TILE - 8,
        vx: 0,
        vy: 0,
        width: 16,
        height: 24,
        facing: 'left',
        isGrounded: false,
        isDead: false,
        squishedTimer: 0,
        inShell: false,
        shellMoving: false,
        animFrame: 0,
        animTimer: 0,
        active: false,
        pipeX: tx * TILE,
        pipeY: topY * TILE,
        baseY: topY * TILE,
        piranhaTimer: Math.random() * 60,
      });
    }
  };

  // Helper for adding ? block
  const addQuestion = (tx: number, ty: number, content: 'coin' | 'mushroom' | 'fireflower' = 'coin') => {
    blocks.push({
      x: tx * TILE,
      y: ty * TILE,
      type: 'question',
      content,
      bumpOffset: 0,
      bumpTimer: 0,
      isBumped: false,
    });
  };

  // Helper for adding brick block
  const addBrick = (tx: number, ty: number, content: 'empty' | 'multi_coin' = 'empty') => {
    blocks.push({
      x: tx * TILE,
      y: ty * TILE,
      type: 'brick',
      content,
      coinsLeft: content === 'multi_coin' ? 10 : 0,
      bumpOffset: 0,
      bumpTimer: 0,
      isBumped: false,
    });
  };

  // Helper for adding hard block (for staircases)
  const addHard = (tx: number, ty: number) => {
    blocks.push({
      x: tx * TILE,
      y: ty * TILE,
      type: 'hard',
      bumpOffset: 0,
      bumpTimer: 0,
      isBumped: false,
    });
  };

  // Helper for adding Goomba
  const addGoomba = (tx: number, ty: number) => {
    enemies.push({
      id: `goomba_${tx}_${ty}`,
      type: 'goomba',
      x: tx * TILE,
      y: ty * TILE,
      vx: -0.6,
      vy: 0,
      width: 16,
      height: 16,
      facing: 'left',
      isGrounded: true,
      isDead: false,
      squishedTimer: 0,
      inShell: false,
      shellMoving: false,
      animFrame: 0,
      animTimer: 0,
      active: false,
    });
  };

  // Helper for adding Koopa
  const addKoopa = (tx: number, ty: number) => {
    enemies.push({
      id: `koopa_${tx}_${ty}`,
      type: 'koopa',
      x: tx * TILE,
      y: (ty - 1) * TILE,
      vx: -0.6,
      vy: 0,
      width: 16,
      height: 24,
      facing: 'left',
      isGrounded: true,
      isDead: false,
      squishedTimer: 0,
      inShell: false,
      shellMoving: false,
      animFrame: 0,
      animTimer: 0,
      active: false,
    });
  };

  // 1-1 Layout
  // First ? block
  addQuestion(16, 9, 'coin');

  // Standalone Super Mushroom in the world ready to collect
  items.push({
    id: 'world_mushroom_1',
    type: 'mushroom',
    x: 18 * TILE,
    y: 12 * TILE,
    vx: 0,
    vy: 0,
    width: 16,
    height: 16,
    isGrounded: true,
    sprouting: false,
    sproutProgress: 16,
    collected: false,
    animFrame: 0,
  });

  // First enemy
  addGoomba(22, 12);

  // Row of 3 bricks with ? block in between containing Super Mushroom!
  addBrick(20, 9);
  addQuestion(21, 9, 'mushroom');
  addBrick(22, 9);
  addQuestion(23, 9, 'fireflower');
  addBrick(24, 9);

  // Standalone Fire Flower on elevated platform
  items.push({
    id: 'world_flower_1',
    type: 'fireflower',
    x: 64 * TILE,
    y: 8 * TILE,
    vx: 0,
    vy: 0,
    width: 16,
    height: 16,
    isGrounded: true,
    sprouting: false,
    sproutProgress: 16,
    collected: false,
    animFrame: 0,
  });

  // High ? block above
  addQuestion(22, 5, 'coin');

  // Green Pipes
  addPipe(28, 2); // height 2
  addGoomba(34, 12);
  addPipe(38, 3); // height 3 with piranha
  addGoomba(43, 12);
  addPipe(46, 4, true); // height 4 enterable pipe!

  addGoomba(52, 12);
  addGoomba(54, 12);

  // Hidden multi-coin block or high bricks
  addBrick(64, 9);
  addQuestion(65, 9, 'mushroom');
  addBrick(66, 9);

  // Long elevated bridge of bricks
  for (let bx = 77; bx <= 84; bx++) {
    if (bx === 80) {
      addQuestion(bx, 9, 'coin');
    } else {
      addBrick(bx, 9);
    }
  }
  for (let bx = 80; bx <= 87; bx++) {
    addBrick(bx, 5);
  }
  addQuestion(88, 5, 'coin');
  addGoomba(82, 4);

  // Koopa patrol
  addKoopa(96, 12);
  addQuestion(101, 9, 'coin');
  addBrick(103, 9, 'multi_coin');
  addQuestion(106, 9, 'mushroom');

  // Pyramid staircases
  // Staircase 1: 4 steps up
  for (let step = 1; step <= 4; step++) {
    for (let sy = 0; sy < step; sy++) {
      addHard(124 + step - 1, 13 - 1 - sy);
    }
  }
  // Staircase 2: 4 steps down
  for (let step = 4; step >= 1; step--) {
    for (let sy = 0; sy < step; sy++) {
      addHard(130 + (4 - step), 13 - 1 - sy);
    }
  }

  addGoomba(138, 12);
  addGoomba(140, 12);

  // Final high staircase up to flagpole (8 steps)
  for (let step = 1; step <= 8; step++) {
    for (let sy = 0; sy < step; sy++) {
      addHard(144 + step - 1, 13 - 1 - sy);
    }
  }

  // Flagpole (at X = 160)
  const flagTx = 160;
  for (let fy = 3; fy <= 12; fy++) {
    blocks.push({
      x: flagTx * TILE,
      y: fy * TILE,
      type: 'flagpole',
      bumpOffset: 0,
      bumpTimer: 0,
      isBumped: false,
    });
  }
  // Flag block base
  addHard(flagTx, 12);

  // Flag top ball
  blocks.push({
    x: flagTx * TILE,
    y: 2 * TILE,
    type: 'hard',
    bumpOffset: 0,
    bumpTimer: 0,
    isBumped: false,
  });

  // Castle at end (X = 166)
  const castleTx = 166;
  scenery.push({
    x: castleTx * TILE,
    y: 7 * TILE,
    type: 'castle',
  });

  return {
    world: '1-1',
    name: 'WORLD 1-1',
    theme: 'overworld',
    width: widthInTiles,
    height: 15,
    timeLimit: 400,
    bgColor: '#5c94fc',
    marioStart: { x: 40, y: 11 * TILE },
    flagpoleX: flagTx * TILE,
    flagpoleY: 3 * TILE,
    castleX: castleTx * TILE + 40,
    blocks,
    enemies,
    scenery,
    items,
    warpPipes: [
      {
        entryPipeX: 46 * TILE,
        entryPipeY: 9 * TILE,
        targetWorld: '1-2',
        targetX: 30,
        targetY: 10 * TILE,
      },
    ],
  };
}

/**
 * World 1-2: Underground Caverns
 */
function createWorld1_2(): LevelData {
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const scenery: SceneryItem[] = [];

  const widthInTiles = 150;
  const TILE = 16;

  // Underground: ceiling bricks (rows 0 and 1)
  for (let tx = 0; tx < widthInTiles; tx++) {
    blocks.push({ x: tx * TILE, y: 0, type: 'brick', bumpOffset: 0, bumpTimer: 0, isBumped: false });
    blocks.push({ x: tx * TILE, y: 16, type: 'brick', bumpOffset: 0, bumpTimer: 0, isBumped: false });
  }

  // Floor with pits
  const pits = [
    { start: 30, end: 33 },
    { start: 68, end: 72 },
    { start: 105, end: 108 },
  ];

  for (let tx = 0; tx < widthInTiles; tx++) {
    const inPit = pits.some((p) => tx >= p.start && tx <= p.end);
    if (!inPit) {
      blocks.push({ x: tx * TILE, y: 13 * TILE, type: 'ground', bumpOffset: 0, bumpTimer: 0, isBumped: false });
      blocks.push({ x: tx * TILE, y: 14 * TILE, type: 'ground', bumpOffset: 0, bumpTimer: 0, isBumped: false });
    }
  }

  // Underground pipes & platforms
  const addBrickRow = (startX: number, endX: number, ty: number) => {
    for (let x = startX; x <= endX; x++) {
      blocks.push({ x: x * TILE, y: ty * TILE, type: 'brick', bumpOffset: 0, bumpTimer: 0, isBumped: false });
    }
  };

  addBrickRow(12, 22, 9);
  // Coins on top
  for (let cx = 14; cx <= 20; cx += 2) {
    blocks.push({ x: cx * TILE, y: 8 * TILE, type: 'question', content: 'coin', bumpOffset: 0, bumpTimer: 0, isBumped: false });
  }

  // Goombas & Koopas
  enemies.push({
    id: 'ug_goomba_1',
    type: 'goomba',
    x: 18 * TILE,
    y: 8 * TILE,
    vx: -0.6,
    vy: 0,
    width: 16,
    height: 16,
    facing: 'left',
    isGrounded: true,
    isDead: false,
    squishedTimer: 0,
    inShell: false,
    shellMoving: false,
    animFrame: 0,
    animTimer: 0,
    active: false,
  });

  enemies.push({
    id: 'ug_koopa_1',
    type: 'koopa',
    x: 42 * TILE,
    y: 11 * TILE,
    vx: -0.6,
    vy: 0,
    width: 16,
    height: 24,
    facing: 'left',
    isGrounded: true,
    isDead: false,
    squishedTimer: 0,
    inShell: false,
    shellMoving: false,
    animFrame: 0,
    animTimer: 0,
    active: false,
  });

  // Floating platforms over pit
  addBrickRow(31, 32, 9);

  // Question blocks
  blocks.push({ x: 50 * TILE, y: 9 * TILE, type: 'question', content: 'mushroom', bumpOffset: 0, bumpTimer: 0, isBumped: false });
  blocks.push({ x: 53 * TILE, y: 9 * TILE, type: 'question', content: 'fireflower', bumpOffset: 0, bumpTimer: 0, isBumped: false });

  addBrickRow(78, 86, 7);
  for (let gx = 80; gx <= 84; gx += 2) {
    enemies.push({
      id: `ug_goomba_${gx}`,
      type: 'goomba',
      x: gx * TILE,
      y: 6 * TILE,
      vx: -0.6,
      vy: 0,
      width: 16,
      height: 16,
      facing: 'left',
      isGrounded: true,
      isDead: false,
      squishedTimer: 0,
      inShell: false,
      shellMoving: false,
      animFrame: 0,
      animTimer: 0,
      active: false,
    });
  }

  // End warp pipe leading up to Castle 1-4!
  const exitPipeX = 130;
  // Pipe height 4
  const topY = 9;
  blocks.push({ x: exitPipeX * TILE, y: topY * TILE, type: 'pipe_tl', bumpOffset: 0, bumpTimer: 0, isBumped: false });
  blocks.push({ x: (exitPipeX + 1) * TILE, y: topY * TILE, type: 'pipe_tr', bumpOffset: 0, bumpTimer: 0, isBumped: false });
  for (let py = topY + 1; py < 13; py++) {
    blocks.push({ x: exitPipeX * TILE, y: py * TILE, type: 'pipe_bl', bumpOffset: 0, bumpTimer: 0, isBumped: false });
    blocks.push({ x: (exitPipeX + 1) * TILE, y: py * TILE, type: 'pipe_br', bumpOffset: 0, bumpTimer: 0, isBumped: false });
  }

  // Flagpole / Clear marker
  const flagTx = 142;
  for (let fy = 3; fy <= 12; fy++) {
    blocks.push({ x: flagTx * TILE, y: fy * TILE, type: 'flagpole', bumpOffset: 0, bumpTimer: 0, isBumped: false });
  }
  blocks.push({ x: flagTx * TILE, y: 12 * TILE, type: 'hard', bumpOffset: 0, bumpTimer: 0, isBumped: false });

  return {
    world: '1-2',
    name: 'WORLD 1-2',
    theme: 'underground',
    width: widthInTiles,
    height: 15,
    timeLimit: 400,
    bgColor: '#000000',
    marioStart: { x: 40, y: 11 * TILE },
    flagpoleX: flagTx * TILE,
    flagpoleY: 3 * TILE,
    castleX: 146 * TILE,
    blocks,
    enemies,
    scenery,
    warpPipes: [
      {
        entryPipeX: exitPipeX * TILE,
        entryPipeY: topY * TILE,
        targetWorld: '1-4',
        targetX: 30,
        targetY: 10 * TILE,
      },
    ],
  };
}

/**
 * World 1-4: Bowser's Castle
 */
function createWorld1_4(): LevelData {
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const scenery: SceneryItem[] = [];

  const widthInTiles = 150;
  const TILE = 16;

  // Castle Floor with Lava pits
  const lavaPits = [
    { start: 22, end: 27 },
    { start: 50, end: 55 },
    { start: 80, end: 86 },
    { start: 108, end: 124 }, // Bowser's Lava Lake!
  ];

  for (let tx = 0; tx < widthInTiles; tx++) {
    const inLava = lavaPits.some((p) => tx >= p.start && tx <= p.end);
    if (!inLava) {
      blocks.push({ x: tx * TILE, y: 13 * TILE, type: 'ground', bumpOffset: 0, bumpTimer: 0, isBumped: false });
      blocks.push({ x: tx * TILE, y: 14 * TILE, type: 'ground', bumpOffset: 0, bumpTimer: 0, isBumped: false });
    }
  }

  // Floating platforms over lava
  const addBridgeSection = (startX: number, endX: number, ty: number) => {
    for (let x = startX; x <= endX; x++) {
      blocks.push({ x: x * TILE, y: ty * TILE, type: 'bridge', bumpOffset: 0, bumpTimer: 0, isBumped: false });
    }
  };

  // Ceiling stones
  for (let tx = 0; tx < widthInTiles; tx++) {
    blocks.push({ x: tx * TILE, y: 0, type: 'castle_brick', bumpOffset: 0, bumpTimer: 0, isBumped: false });
    blocks.push({ x: tx * TILE, y: 16, type: 'castle_brick', bumpOffset: 0, bumpTimer: 0, isBumped: false });
  }

  // Jumping obstacles
  addBridgeSection(23, 26, 9);
  addBridgeSection(51, 54, 8);
  addBridgeSection(81, 85, 9);

  // Bowser's Rope Bridge over the large lava pit (X=108 to 124)
  addBridgeSection(108, 124, 10);

  // Power-up question block before Bowser!
  blocks.push({
    x: 104 * TILE,
    y: 8 * TILE,
    type: 'question',
    content: 'fireflower',
    bumpOffset: 0,
    bumpTimer: 0,
    isBumped: false,
  });

  // Bowser Boss!
  enemies.push({
    id: 'bowser_boss',
    type: 'bowser',
    x: 116 * TILE,
    y: 8 * TILE,
    vx: -0.3,
    vy: 0,
    width: 32,
    height: 32,
    facing: 'left',
    isGrounded: true,
    isDead: false,
    squishedTimer: 0,
    inShell: false,
    shellMoving: false,
    animFrame: 0,
    animTimer: 0,
    active: false,
    hp: 5,
    bowserTimer: 0,
    jumpTimer: 60,
  });

  // Golden Axe switch on the right side of the bridge! (X = 126)
  blocks.push({
    x: 126 * TILE,
    y: 9 * TILE,
    type: 'axe',
    bumpOffset: 0,
    bumpTimer: 0,
    isBumped: false,
  });

  // Princess / Toad Chamber (X = 132)
  for (let fy = 3; fy <= 12; fy++) {
    blocks.push({ x: 136 * TILE, y: fy * TILE, type: 'flagpole', bumpOffset: 0, bumpTimer: 0, isBumped: false });
  }

  return {
    world: '1-4',
    name: 'WORLD 1-4',
    theme: 'castle',
    width: widthInTiles,
    height: 15,
    timeLimit: 300,
    bgColor: '#000000',
    marioStart: { x: 30, y: 11 * TILE },
    flagpoleX: 126 * TILE, // Touching the axe or passing triggers victory!
    flagpoleY: 9 * TILE,
    castleX: 138 * TILE,
    blocks,
    enemies,
    scenery,
  };
}
