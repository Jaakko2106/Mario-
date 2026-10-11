/**
 * Super Mario Bros 8-Bit Engine Types
 */

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'DYING' | 'FLAGPOLE' | 'LEVEL_CLEAR' | 'GAME_OVER' | 'VICTORY';

export type MarioPower = 'small' | 'super' | 'fire';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MarioState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  power: MarioPower;
  facing: 'left' | 'right';
  isGrounded: boolean;
  isJumping: boolean;
  isCrouching: boolean;
  isSkidding: boolean;
  isRunning: boolean;
  invulnerableTimer: number; // in frames (60fps)
  transformTimer: number; // flashing animation when getting mushroom/damage
  walkFrame: number;
  walkTimer: number;
  isDead: boolean;
  deathTimer: number;
  flagpoleSlide: boolean;
  flagpoleTimer: number;
  throwTimer: number;
}

export type EnemyType = 'goomba' | 'koopa' | 'piranha' | 'bowser';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  isGrounded: boolean;
  isDead: boolean;
  squishedTimer: number; // for goomba squish
  inShell: boolean; // for koopa
  shellMoving: boolean; // koopa shell sliding
  animFrame: number;
  animTimer: number;
  active: boolean; // active when near camera
  // For Piranha plant
  pipeX?: number;
  pipeY?: number;
  baseY?: number;
  piranhaTimer?: number;
  // For Bowser
  hp?: number;
  bowserTimer?: number;
  jumpTimer?: number;
}

export type ItemType = 'mushroom' | 'fireflower' | 'star' | 'coin';

export interface Item {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  sprouting: boolean;
  sproutProgress: number; // 0 to 16 pixels
  collected: boolean;
  animFrame: number;
}

export type BlockType = 
  | 'ground' 
  | 'brick' 
  | 'question' 
  | 'used' 
  | 'hard' 
  | 'pipe_tl' 
  | 'pipe_tr' 
  | 'pipe_bl' 
  | 'pipe_br' 
  | 'castle_brick' 
  | 'flagpole' 
  | 'flag' 
  | 'axe' 
  | 'bridge';

export interface Block {
  x: number;
  y: number;
  type: BlockType;
  content?: 'coin' | 'mushroom' | 'fireflower' | 'empty' | 'multi_coin';
  coinsLeft?: number;
  bumpOffset: number;
  bumpTimer: number;
  isBumped: boolean;
  isDestroyed?: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color?: string;
  text?: string;
  type: 'score' | 'brick_shard' | 'coin_sparkle' | 'smoke' | 'firework';
  rotation?: number;
  rotSpeed?: number;
}

export interface Fireball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  life: number;
}

export interface BowserFire {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface SceneryItem {
  x: number;
  y: number;
  type: 'cloud_single' | 'cloud_double' | 'cloud_triple' | 'bush_single' | 'bush_double' | 'bush_triple' | 'hill_small' | 'hill_large' | 'castle';
}

export interface LevelData {
  world: string;
  name: string;
  theme: 'overworld' | 'underground' | 'castle';
  width: number; // in tiles (16px per tile)
  height: number; // 15 tiles = 240px
  timeLimit: number;
  bgColor: string;
  marioStart: Point;
  flagpoleX: number;
  flagpoleY: number;
  castleX: number;
  blocks: Block[];
  enemies: Enemy[];
  scenery: SceneryItem[];
  items?: Item[];
  warpPipes?: {
    entryPipeX: number;
    entryPipeY: number;
    targetWorld: string;
    targetX: number;
    targetY: number;
  }[];
}

export interface InputState {
  left: boolean;
  right: boolean;
  down: boolean;
  up: boolean;
  jump: boolean;
  run: boolean; // B button / sprint / fireball
  pause: boolean;
}
