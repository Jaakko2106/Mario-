/**
 * Super Mario Bros 8-Bit Physics & Game Engine
 */

import {
  GameState,
  MarioState,
  Enemy,
  Item,
  Block,
  Particle,
  Fireball,
  BowserFire,
  LevelData,
  InputState,
  Rect,
} from './types';
import { getLevelData } from './levels';
import { soundEngine } from './audio';

export class GameEngine {
  public state: GameState = 'TITLE';
  public currentWorld: string = '1-1';
  public level!: LevelData;
  public mario!: MarioState;
  public cameraX: number = 0;
  
  // Game stats
  public score: number = 0;
  public coins: number = 0;
  public lives: number = 3;
  public timeLeft: number = 400;
  private timeTickTimer: number = 0;

  // Active entities
  public blocks: Block[] = [];
  public enemies: Enemy[] = [];
  public items: Item[] = [];
  public fireballs: Fireball[] = [];
  public bowserFires: BowserFire[] = [];
  public particles: Particle[] = [];

  // Animation and timers
  public globalAnimTimer: number = 0;
  public stageClearBonusTimer: number = 0;
  public onStateChange?: (state: GameState) => void;

  // Physics constants
  private readonly GRAVITY = 0.28;
  private readonly JUMP_RELEASE_GRAVITY = 0.48;
  private readonly MAX_FALL_SPEED = 4.8;
  private readonly WALK_ACCEL = 0.08;
  private readonly RUN_ACCEL = 0.14;
  private readonly MAX_WALK_SPEED = 1.4;
  private readonly MAX_RUN_SPEED = 2.4;
  private readonly FRICTION = 0.06;
  private readonly SKID_DECEL = 0.16;
  private lastRunInput: boolean = false;

  constructor() {
    this.loadLevel('1-1');
  }

  public loadLevel(world: string, keepStats: boolean = false) {
    this.currentWorld = world;
    this.level = getLevelData(world);
    this.blocks = JSON.parse(JSON.stringify(this.level.blocks));
    this.enemies = JSON.parse(JSON.stringify(this.level.enemies));
    this.items = this.level.items ? JSON.parse(JSON.stringify(this.level.items)) : [];
    this.fireballs = [];
    this.bowserFires = [];
    this.particles = [];
    this.cameraX = 0;
    this.timeLeft = this.level.timeLimit;
    this.timeTickTimer = 0;

    if (!keepStats) {
      this.lives = 3;
      this.score = 0;
      this.coins = 0;
    }

    const currentPower = this.mario ? this.mario.power : 'small';
    this.initMario(currentPower);

    if (this.state === 'PLAYING') {
      soundEngine.playMusic(this.level.theme);
    }
  }

  public startGame(world: string = '1-1') {
    this.lives = 3;
    this.score = 0;
    this.coins = 0;
    this.loadLevel(world, false);
    this.state = 'PLAYING';
    soundEngine.playMusic(this.level.theme);
    if (this.onStateChange) this.onStateChange(this.state);
  }

  public restartLevel() {
    this.loadLevel(this.currentWorld, true);
    this.state = 'PLAYING';
    soundEngine.playMusic(this.level.theme);
    if (this.onStateChange) this.onStateChange(this.state);
  }

  private initMario(power: 'small' | 'super' | 'fire' = 'small') {
    const isSuper = power !== 'small';
    this.mario = {
      x: this.level.marioStart.x,
      y: this.level.marioStart.y,
      vx: 0,
      vy: 0,
      width: 14,
      height: isSuper ? 30 : 15,
      power,
      facing: 'right',
      isGrounded: false,
      isJumping: false,
      isCrouching: false,
      isSkidding: false,
      isRunning: false,
      invulnerableTimer: 0,
      transformTimer: 0,
      walkFrame: 0,
      walkTimer: 0,
      isDead: false,
      deathTimer: 0,
      flagpoleSlide: false,
      flagpoleTimer: 0,
      throwTimer: 0,
    };
  }

  /**
   * Main Game Loop Update (60 FPS tick)
   */
  public update(input: InputState) {
    this.globalAnimTimer++;

    if (this.state === 'TITLE' || this.state === 'PAUSED') {
      return;
    }

    if (this.state === 'DYING') {
      this.updateMarioDeath();
      return;
    }

    if (this.state === 'FLAGPOLE') {
      this.updateFlagpoleSequence();
      return;
    }

    if (this.state === 'LEVEL_CLEAR') {
      this.updateLevelClearCountdown();
      return;
    }

    if (this.state === 'GAME_OVER' || this.state === 'VICTORY') {
      return;
    }

    // Time countdown (1 game second every 24 frames, authentic SMB tempo)
    this.timeTickTimer++;
    if (this.timeTickTimer >= 24) {
      this.timeTickTimer = 0;
      if (this.timeLeft > 0) {
        this.timeLeft--;
        if (this.timeLeft === 0) {
          this.killMario();
        }
      }
    }

    // Update Mario
    this.updateMario(input);

    // Update Camera
    this.updateCamera();

    // Update Blocks (bump animations)
    this.updateBlocks();

    // Update Items (mushrooms moving, coins, sprouting)
    this.updateItems();

    // Update Enemies (AI, walking, shells, piranha plants, bowser)
    this.updateEnemies();

    // Update Projectiles (fireballs, bowser fire)
    this.updateProjectiles();

    // Update Particles
    this.updateParticles();

    // Check collisions
    this.checkMarioItemCollisions();
    this.checkMarioEnemyCollisions();
    this.checkFireballEnemyCollisions();
    this.checkMarioFlagpole();
  }

  // --- Mario Physics ---

  private updateMario(input: InputState) {
    const m = this.mario;

    // Invulnerability decay
    if (m.invulnerableTimer > 0) m.invulnerableTimer--;
    if (m.transformTimer > 0) m.transformTimer--;
    if (m.throwTimer > 0) m.throwTimer--;

    // Crouch (only for Super/Fire Mario)
    m.isCrouching = input.down && m.isGrounded && m.power !== 'small';
    m.isRunning = input.run && !m.isCrouching;

    // Pipe entry check
    if (input.down && m.isGrounded && this.level.warpPipes) {
      for (const warp of this.level.warpPipes) {
        if (Math.abs(m.x - warp.entryPipeX) < 18 && Math.abs(m.y - warp.entryPipeY) < 16) {
          soundEngine.playPipe();
          this.loadLevel(warp.targetWorld, true);
          return;
        }
      }
    }

    // Horizontal Movement
    const maxSpeed = m.isRunning ? this.MAX_RUN_SPEED : this.MAX_WALK_SPEED;
    const accel = m.isRunning ? this.RUN_ACCEL : this.WALK_ACCEL;

    m.isSkidding = false;

    if (!m.isCrouching) {
      if (input.left) {
        m.facing = 'left';
        if (m.vx > 0.5) {
          // Skidding right while pressing left
          m.vx -= this.SKID_DECEL;
          m.isSkidding = true;
        } else {
          m.vx -= accel;
          if (m.vx < -maxSpeed) m.vx = -maxSpeed;
        }
      } else if (input.right) {
        m.facing = 'right';
        if (m.vx < -0.5) {
          // Skidding left while pressing right
          m.vx += this.SKID_DECEL;
          m.isSkidding = true;
        } else {
          m.vx += accel;
          if (m.vx > maxSpeed) m.vx = maxSpeed;
        }
      } else {
        // Friction when no key pressed
        if (m.vx > 0) {
          m.vx -= this.FRICTION;
          if (m.vx < 0) m.vx = 0;
        } else if (m.vx < 0) {
          m.vx += this.FRICTION;
          if (m.vx > 0) m.vx = 0;
        }
      }
    } else {
      // High friction while crouching
      m.vx *= 0.85;
      if (Math.abs(m.vx) < 0.05) m.vx = 0;
    }

    // Jumping Physics
    if (input.jump && m.isGrounded && !m.isJumping) {
      const jumpImpulse = m.isRunning ? -4.3 : -3.9;
      m.vy = jumpImpulse;
      m.isGrounded = false;
      m.isJumping = true;
      soundEngine.playJump(m.power !== 'small');
    }

    // Variable jump gravity: cut jump if jump key released
    const currentGravity = (input.jump && m.vy < 0) ? this.GRAVITY : this.JUMP_RELEASE_GRAVITY;
    m.vy += currentGravity;
    if (m.vy > this.MAX_FALL_SPEED) m.vy = this.MAX_FALL_SPEED;

    // Fireball throwing (press run button once while Fire Mario)
    const runJustPressed = input.run && !this.lastRunInput;
    this.lastRunInput = input.run;

    if (m.power === 'fire' && (runJustPressed || (input.run && this.globalAnimTimer % 20 === 0)) && this.fireballs.length < 2) {
      this.spawnFireball();
      m.throwTimer = 10;
    }

    // Apply Horizontal Movement & Collisions
    m.x += m.vx;
    // Don't go left of camera
    if (m.x < this.cameraX) {
      m.x = this.cameraX;
      m.vx = 0;
    }
    this.handleMarioHorizontalCollisions();

    // Apply Vertical Movement & Collisions
    m.y += m.vy;
    this.handleMarioVerticalCollisions();

    // Check bottom pit fall death
    if (m.y > 240) {
      this.killMario();
      return;
    }

    // Walk animation frames
    if (m.isGrounded && Math.abs(m.vx) > 0.1) {
      m.walkTimer += Math.abs(m.vx) * 0.4;
      if (m.walkTimer >= 4) {
        m.walkTimer = 0;
        m.walkFrame = (m.walkFrame + 1) % 3;
      }
    } else {
      m.walkFrame = 0;
    }
  }

  private handleMarioHorizontalCollisions() {
    const m = this.mario;
    const marioBox = { x: m.x, y: m.y, width: m.width, height: m.height };

    for (const block of this.blocks) {
      if (block.isDestroyed || block.type === 'flagpole' || block.type === 'axe') continue;

      const blockBox = { x: block.x, y: block.y + block.bumpOffset, width: 16, height: 16 };
      if (this.checkOverlap(marioBox, blockBox)) {
        if (m.vx > 0) {
          // Colliding right
          m.x = blockBox.x - m.width;
          m.vx = 0;
        } else if (m.vx < 0) {
          // Colliding left
          m.x = blockBox.x + blockBox.width;
          m.vx = 0;
        }
      }
    }
  }

  private handleMarioVerticalCollisions() {
    const m = this.mario;
    const marioBox = { x: m.x, y: m.y, width: m.width, height: m.height };
    m.isGrounded = false;

    for (const block of this.blocks) {
      if (block.isDestroyed || block.type === 'flagpole' || block.type === 'axe') continue;

      const blockBox = { x: block.x, y: block.y + block.bumpOffset, width: 16, height: 16 };
      if (this.checkOverlap(marioBox, blockBox)) {
        if (m.vy > 0) {
          // Landing on top of block
          m.y = blockBox.y - m.height;
          m.vy = 0;
          m.isGrounded = true;
          m.isJumping = false;
        } else if (m.vy < 0) {
          // Bonking head against block!
          m.y = blockBox.y + blockBox.height;
          m.vy = 0.5;
          this.hitBlock(block);
        }
      }
    }
  }

  private hitBlock(block: Block) {
    if (block.isBumped || block.type === 'used' || block.type === 'ground' || block.type === 'hard') {
      soundEngine.playBump();
      return;
    }

    // Question Mark Block
    if (block.type === 'question') {
      block.isBumped = true;
      block.bumpOffset = -6;
      block.bumpTimer = 10;

      if (block.content === 'coin') {
        this.addCoin();
        this.spawnBlockCoin(block.x + 4, block.y - 12);
        this.spawnCoinExplosion(block.x + 8, block.y - 8);
        soundEngine.playCoin();
      } else if (block.content === 'mushroom' || block.content === 'fireflower') {
        const itemType = (this.mario.power === 'small') ? 'mushroom' : 'fireflower';
        this.spawnSproutingItem(block.x, block.y - 16, itemType);
        soundEngine.playPowerupAppear();
      }

      block.type = 'used';
      this.bumpEnemiesOnTop(block);
      return;
    }

    // Brick Block
    if (block.type === 'brick') {
      if (this.mario.power === 'small') {
        // Small Mario bumps brick
        block.isBumped = true;
        block.bumpOffset = -4;
        block.bumpTimer = 8;
        soundEngine.playBump();
        this.bumpEnemiesOnTop(block);
      } else {
        // Super Mario breaks brick!
        block.isDestroyed = true;
        this.score += 50;
        soundEngine.playBreak();
        this.spawnBrickShards(block.x + 8, block.y + 8);
        this.bumpEnemiesOnTop(block);
      }
    }
  }

  private bumpEnemiesOnTop(block: Block) {
    const bumpZone = { x: block.x - 2, y: block.y - 18, width: 20, height: 18 };
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      const enemyBox = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
      if (this.checkOverlap(bumpZone, enemyBox)) {
        this.defeatEnemyByImpact(enemy);
      }
    }
  }

  // --- Entity Updaters ---

  private updateBlocks() {
    for (const block of this.blocks) {
      if (block.isBumped) {
        block.bumpTimer--;
        if (block.bumpTimer <= 0) {
          block.bumpOffset = 0;
          block.isBumped = false;
        } else {
          // Smooth bounce return
          block.bumpOffset = -Math.sin((block.bumpTimer / 10) * Math.PI) * 6;
        }
      }
    }
  }

  private updateCamera() {
    // Camera scrolls right when Mario passes screen midpoint
    const screenMid = this.cameraX + 120;
    if (this.mario.x > screenMid) {
      this.cameraX = this.mario.x - 120;
    }
    // Clamp to level bounds
    const maxCamera = (this.level.width * 16) - 256;
    if (this.cameraX > maxCamera) {
      this.cameraX = maxCamera;
    }
  }

  private updateItems() {
    for (const item of this.items) {
      if (item.collected) continue;

      if (item.sprouting) {
        item.sproutProgress += 0.8;
        item.y -= 0.8;
        if (item.sproutProgress >= 16) {
          item.sprouting = false;
          item.vx = 1.0; // Slide right
        }
        continue;
      }

      // Moving items (mushrooms)
      if (item.type === 'mushroom') {
        item.vy += this.GRAVITY;
        item.x += item.vx;
        item.y += item.vy;

        // Tile collision for mushroom
        const itemBox = { x: item.x, y: item.y, width: item.width, height: item.height };
        for (const block of this.blocks) {
          if (block.isDestroyed || block.type === 'flagpole') continue;
          const blockBox = { x: block.x, y: block.y, width: 16, height: 16 };
          if (this.checkOverlap(itemBox, blockBox)) {
            // Horizontal bounce
            if (item.vy >= 0 && item.y + item.height - 4 < block.y) {
              item.y = block.y - item.height;
              item.vy = 0;
              item.isGrounded = true;
            } else {
              item.vx = -item.vx;
            }
          }
        }
      } else if (item.type === 'fireflower' || item.type === 'coin') {
        item.animFrame = Math.floor(this.globalAnimTimer / 8);
      }
    }

    this.items = this.items.filter((i) => !i.collected && i.y < 260);
  }

  private updateEnemies() {
    for (const enemy of this.enemies) {
      if (enemy.isDead && enemy.squishedTimer <= 0) continue;

      // Activate enemies when near camera
      if (!enemy.active && enemy.x < this.cameraX + 280) {
        enemy.active = true;
      }
      if (!enemy.active) continue;

      // Handle Goomba squish animation
      if (enemy.type === 'goomba' && enemy.squishedTimer > 0) {
        enemy.squishedTimer--;
        continue;
      }

      // Handle Piranha Plant
      if (enemy.type === 'piranha') {
        this.updatePiranhaPlant(enemy);
        continue;
      }

      // Handle Bowser Boss
      if (enemy.type === 'bowser') {
        this.updateBowserBoss(enemy);
        continue;
      }

      // Standard enemy walking & shell sliding physics
      enemy.vy += this.GRAVITY;
      if (enemy.vy > 4) enemy.vy = 4;

      enemy.x += enemy.vx;
      this.handleEnemyHorizontalTileCollisions(enemy);

      enemy.y += enemy.vy;
      this.handleEnemyVerticalTileCollisions(enemy);

      // Walk animation
      enemy.animTimer++;
      if (enemy.animTimer > 8) {
        enemy.animTimer = 0;
        enemy.animFrame = (enemy.animFrame + 1) % 2;
      }

      // Shell hitting other enemies
      if (enemy.shellMoving) {
        const shellBox = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
        for (const other of this.enemies) {
          if (other.id === enemy.id || other.isDead) continue;
          const otherBox = { x: other.x, y: other.y, width: other.width, height: other.height };
          if (this.checkOverlap(shellBox, otherBox)) {
            this.defeatEnemyByImpact(other);
          }
        }
      }
    }
  }

  private updatePiranhaPlant(enemy: Enemy) {
    if (!enemy.baseY) return;
    enemy.piranhaTimer = (enemy.piranhaTimer || 0) + 1;
    // Don't emerge if Mario is standing directly on pipe
    const nearMario = Math.abs(this.mario.x - enemy.x) < 24;

    const cycle = (enemy.piranhaTimer % 180);
    if (cycle < 60 && !nearMario) {
      // Emerge up
      enemy.y = enemy.baseY - 24 + Math.sin((cycle / 60) * (Math.PI / 2)) * -16;
    } else if (cycle >= 60 && cycle < 120) {
      // Stay up
      enemy.y = enemy.baseY - 40;
    } else if (cycle >= 120 && cycle < 150) {
      // Retract down
      enemy.y = enemy.baseY - 40 + ((cycle - 120) / 30) * 16;
    } else {
      // Stay inside pipe
      enemy.y = enemy.baseY - 8;
    }

    enemy.animFrame = Math.floor(this.globalAnimTimer / 12) % 2;
  }

  private updateBowserBoss(enemy: Enemy) {
    enemy.bowserTimer = (enemy.bowserTimer || 0) + 1;

    // Turn toward Mario
    enemy.facing = this.mario.x < enemy.x ? 'left' : 'right';

    // Patrol back and forth
    if (enemy.bowserTimer % 120 < 60) {
      enemy.vx = -0.3;
    } else {
      enemy.vx = 0.3;
    }
    enemy.x += enemy.vx;

    // Breathe fireballs towards Mario
    if (enemy.bowserTimer % 150 === 0 && Math.abs(this.mario.x - enemy.x) < 220) {
      this.bowserFires.push({
        id: `bf_${this.globalAnimTimer}`,
        x: enemy.facing === 'left' ? enemy.x - 12 : enemy.x + 32,
        y: enemy.y + 10,
        vx: enemy.facing === 'left' ? -2.2 : 2.2,
        vy: 0,
        life: 140,
      });
      soundEngine.playFireball();
    }

    // Jump occasionally
    if (enemy.bowserTimer % 90 === 0 && enemy.isGrounded) {
      enemy.vy = -3.2;
      enemy.isGrounded = false;
    }

    enemy.vy += this.GRAVITY;
    enemy.y += enemy.vy;

    // Check bridge/ground collision for Bowser
    const enemyBox = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
    for (const block of this.blocks) {
      if (block.isDestroyed) continue;
      const blockBox = { x: block.x, y: block.y, width: 16, height: 16 };
      if (this.checkOverlap(enemyBox, blockBox) && enemy.vy >= 0) {
        enemy.y = blockBox.y - enemy.height;
        enemy.vy = 0;
        enemy.isGrounded = true;
      }
    }
  }

  private handleEnemyHorizontalTileCollisions(enemy: Enemy) {
    const enemyBox = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
    for (const block of this.blocks) {
      if (block.isDestroyed || block.type === 'flagpole' || block.type === 'axe') continue;
      const blockBox = { x: block.x, y: block.y, width: 16, height: 16 };
      if (this.checkOverlap(enemyBox, blockBox)) {
        if (enemy.vx > 0) {
          enemy.x = blockBox.x - enemy.width;
          enemy.vx = -enemy.vx;
          enemy.facing = 'left';
          if (enemy.shellMoving) soundEngine.playBump();
        } else if (enemy.vx < 0) {
          enemy.x = blockBox.x + blockBox.width;
          enemy.vx = -enemy.vx;
          enemy.facing = 'right';
          if (enemy.shellMoving) soundEngine.playBump();
        }
      }
    }
  }

  private handleEnemyVerticalTileCollisions(enemy: Enemy) {
    const enemyBox = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
    enemy.isGrounded = false;
    for (const block of this.blocks) {
      if (block.isDestroyed || block.type === 'flagpole' || block.type === 'axe') continue;
      const blockBox = { x: block.x, y: block.y, width: 16, height: 16 };
      if (this.checkOverlap(enemyBox, blockBox) && enemy.vy >= 0) {
        enemy.y = blockBox.y - enemy.height;
        enemy.vy = 0;
        enemy.isGrounded = true;
      }
    }
  }

  private updateProjectiles() {
    // Mario's Fireballs
    for (const fb of this.fireballs) {
      fb.x += fb.vx;
      fb.vy += 0.3; // Gravity
      fb.y += fb.vy;
      fb.life--;

      // Bouncing on blocks
      const fbBox = { x: fb.x, y: fb.y, width: 8, height: 8 };
      for (const block of this.blocks) {
        if (block.isDestroyed || block.type === 'flagpole') continue;
        const blockBox = { x: block.x, y: block.y, width: 16, height: 16 };
        if (this.checkOverlap(fbBox, blockBox)) {
          if (fb.vy > 0) {
            fb.y = blockBox.y - 8;
            fb.vy = -2.8; // Bounce up!
          } else {
            fb.life = 0; // Splat against wall
          }
        }
      }
    }
    this.fireballs = this.fireballs.filter((fb) => fb.life > 0 && fb.y < 250);

    // Bowser's traveling fires
    for (const bf of this.bowserFires) {
      bf.x += bf.vx;
      bf.life--;
    }
    this.bowserFires = this.bowserFires.filter((bf) => bf.life > 0);
  }

  private updateParticles() {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      if (p.type === 'brick_shard') {
        p.vy += 0.25; // gravity for flying brick pieces
        p.rotation = (p.rotation || 0) + (p.rotSpeed || 0.1);
      } else if (p.type === 'coin_pixel') {
        p.vy += 0.08; // subtle gravity pulling coin sparkles
        p.vx *= 0.95; // light air drag
      }
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife);
  }

  // --- Collisions & Interactions ---

  private checkMarioItemCollisions() {
    const m = this.mario;
    const marioBox = { x: m.x, y: m.y, width: m.width, height: m.height };

    for (const item of this.items) {
      if (item.collected || item.sprouting) continue;
      const itemBox = { x: item.x, y: item.y, width: item.width, height: item.height };
      if (this.checkOverlap(marioBox, itemBox)) {
        item.collected = true;

        if (item.type === 'mushroom') {
          if (m.power === 'small') {
            m.power = 'super';
            m.height = 30;
            m.y -= 15;
            m.transformTimer = 40;
            soundEngine.playPowerup();
          } else {
            soundEngine.playPowerup();
          }
          this.score += 1000;
          this.spawnScoreParticle(item.x, item.y, '1000');
        } else if (item.type === 'fireflower') {
          if (m.power === 'small') {
            m.y -= 15;
          }
          m.power = 'fire';
          m.height = 30;
          m.transformTimer = 40;
          soundEngine.playPowerup();
          this.score += 1000;
          this.spawnScoreParticle(item.x, item.y, '1000');
        } else if (item.type === 'coin') {
          this.addCoin();
          this.spawnCoinExplosion(item.x + 8, item.y + 8);
          this.spawnScoreParticle(item.x, item.y - 4, '200');
          soundEngine.playCoin();
        }
      }
    }
  }

  private checkMarioEnemyCollisions() {
    const m = this.mario;
    if (m.isDead || m.invulnerableTimer > 0) return;

    const marioBox = { x: m.x, y: m.y, width: m.width, height: m.height };

    // Check Bowser's fireballs hitting Mario
    for (const bf of this.bowserFires) {
      const fireBox = { x: bf.x, y: bf.y, width: 24, height: 8 };
      if (this.checkOverlap(marioBox, fireBox)) {
        this.damageMario();
        return;
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.isDead && enemy.squishedTimer <= 0) continue;

      const enemyBox = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
      if (this.checkOverlap(marioBox, enemyBox)) {
        // Did Mario stomp on the enemy from above?
        const isStomping = m.vy > 0 && (m.y + m.height - m.vy <= enemy.y + 8);

        if (isStomping) {
          if (enemy.type === 'goomba') {
            enemy.isDead = true;
            enemy.squishedTimer = 30;
            m.vy = -3.5; // Bounce off enemy
            soundEngine.playStomp();
            this.score += 100;
            this.spawnScoreParticle(enemy.x, enemy.y, '100');
          } else if (enemy.type === 'koopa') {
            if (!enemy.inShell) {
              // Knock into shell
              enemy.inShell = true;
              enemy.vx = 0;
              enemy.height = 16;
              enemy.y += 8;
              m.vy = -3.5;
              soundEngine.playStomp();
              this.score += 100;
              this.spawnScoreParticle(enemy.x, enemy.y, '100');
            } else {
              // Kick shell
              enemy.shellMoving = true;
              enemy.vx = m.x < enemy.x ? 3.5 : -3.5;
              m.vy = -2.5;
              soundEngine.playKick();
              this.score += 400;
              this.spawnScoreParticle(enemy.x, enemy.y, '400');
            }
          } else if (enemy.type === 'bowser') {
            // Cannot stomp bowser safely without getting hurt!
            this.damageMario();
          } else if (enemy.type === 'piranha') {
            this.damageMario();
          }
        } else {
          // Mario touched enemy from the side
          if (enemy.inShell && !enemy.shellMoving) {
            // Safe kick stationary shell
            enemy.shellMoving = true;
            enemy.vx = m.x < enemy.x ? 3.5 : -3.5;
            soundEngine.playKick();
            this.score += 400;
            this.spawnScoreParticle(enemy.x, enemy.y, '400');
          } else {
            // Mario takes damage!
            this.damageMario();
          }
        }
      }
    }
  }

  private checkFireballEnemyCollisions() {
    for (const fb of this.fireballs) {
      const fbBox = { x: fb.x, y: fb.y, width: 8, height: 8 };

      for (const enemy of this.enemies) {
        if (enemy.isDead) continue;
        const enemyBox = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };

        if (this.checkOverlap(fbBox, enemyBox)) {
          fb.life = 0; // Fireball pops
          if (enemy.type === 'bowser') {
            enemy.hp = (enemy.hp || 5) - 1;
            soundEngine.playStomp();
            if (enemy.hp <= 0) {
              this.defeatEnemyByImpact(enemy);
              this.score += 5000;
              this.spawnScoreParticle(enemy.x, enemy.y, '5000');
            }
          } else {
            this.defeatEnemyByImpact(enemy);
          }
        }
      }
    }
  }

  private checkMarioFlagpole() {
    const m = this.mario;
    if (m.flagpoleSlide || this.state !== 'PLAYING') return;

    // Check Axe in Castle
    for (const block of this.blocks) {
      if (block.type === 'axe') {
        const axeBox = { x: block.x, y: block.y, width: 16, height: 16 };
        const marioBox = { x: m.x, y: m.y, width: m.width, height: m.height };
        if (this.checkOverlap(marioBox, axeBox)) {
          // Collapse bridge, defeat Bowser, win level!
          this.triggerCastleVictory();
          return;
        }
      }
    }

    // Check Flagpole
    if (Math.abs(m.x - this.level.flagpoleX) < 12 && m.y <= 13 * 16) {
      m.flagpoleSlide = true;
      m.vx = 0;
      m.vy = 2.0;
      m.x = this.level.flagpoleX - 6;
      this.state = 'FLAGPOLE';
      soundEngine.playFlagpole();
      if (this.onStateChange) this.onStateChange(this.state);
    }
  }

  private triggerCastleVictory() {
    // Collapse wooden bridge
    for (const block of this.blocks) {
      if (block.type === 'bridge') {
        block.isDestroyed = true;
      }
    }
    // Drop Bowser into lava
    for (const enemy of this.enemies) {
      if (enemy.type === 'bowser') {
        enemy.isDead = true;
        enemy.vy = 3.0;
      }
    }

    this.state = 'LEVEL_CLEAR';
    soundEngine.playStageClear();
    if (this.onStateChange) this.onStateChange(this.state);
  }

  private updateFlagpoleSequence() {
    const m = this.mario;
    m.flagpoleTimer++;

    // Slide down to bottom
    if (m.y < 11 * 16) {
      m.y += 2.0;
    } else {
      // Reached bottom: step off and walk to castle
      m.y = 11 * 16;
      m.x += 1.2;
      m.walkFrame = Math.floor(m.flagpoleTimer / 6) % 3;

      if (m.x >= this.level.castleX) {
        // Entered castle!
        this.state = 'LEVEL_CLEAR';
        soundEngine.playStageClear();
        if (this.onStateChange) this.onStateChange(this.state);
      }
    }
  }

  private updateLevelClearCountdown() {
    // Rapidly countdown remaining time and convert to score (50 pts per tick)
    if (this.timeLeft > 0) {
      this.timeLeft = Math.max(0, this.timeLeft - 2);
      this.score += 100;
      if (this.globalAnimTimer % 3 === 0) {
        soundEngine.playCoin();
        this.spawnCoinExplosion(this.mario.x + 8, this.mario.y - 8);
      }
    } else {
      this.stageClearBonusTimer++;
      if (this.stageClearBonusTimer > 90) {
        this.stageClearBonusTimer = 0;
        // Next World Progression!
        if (this.currentWorld === '1-1') {
          this.loadLevel('1-2', true);
          this.state = 'PLAYING';
          soundEngine.playMusic('underground');
        } else if (this.currentWorld === '1-2') {
          this.loadLevel('1-4', true);
          this.state = 'PLAYING';
          soundEngine.playMusic('castle');
        } else {
          this.state = 'VICTORY';
        }
        if (this.onStateChange) this.onStateChange(this.state);
      }
    }
  }

  private damageMario() {
    const m = this.mario;
    if (m.power === 'fire') {
      m.power = 'super';
      m.invulnerableTimer = 90;
      soundEngine.playPowerdown();
    } else if (m.power === 'super') {
      m.power = 'small';
      m.height = 15;
      m.invulnerableTimer = 90;
      soundEngine.playPowerdown();
    } else {
      this.killMario();
    }
  }

  private killMario() {
    const m = this.mario;
    m.isDead = true;
    m.vx = 0;
    m.vy = -4.5; // Leap up into the air
    m.deathTimer = 0;
    this.state = 'DYING';
    soundEngine.playDie();
    if (this.onStateChange) this.onStateChange(this.state);
  }

  private updateMarioDeath() {
    const m = this.mario;
    m.deathTimer++;

    // Brief freeze (30 frames), then launch up and fall down
    if (m.deathTimer > 20) {
      m.vy += 0.22;
      m.y += m.vy;
    }

    if (m.deathTimer > 150) {
      this.lives--;
      if (this.lives > 0) {
        this.restartLevel();
      } else {
        this.state = 'GAME_OVER';
        if (this.onStateChange) this.onStateChange(this.state);
      }
    }
  }

  private defeatEnemyByImpact(enemy: Enemy) {
    enemy.isDead = true;
    enemy.vy = -3.0; // Fly up and fall off
    enemy.vx = 0.5;
    soundEngine.playKick();
    this.score += 200;
    this.spawnScoreParticle(enemy.x, enemy.y, '200');
  }

  // --- Spawners & Helpers ---

  private spawnFireball() {
    const m = this.mario;
    this.fireballs.push({
      id: `fb_${this.globalAnimTimer}`,
      x: m.facing === 'right' ? m.x + m.width : m.x - 8,
      y: m.y + 10,
      vx: m.facing === 'right' ? 3.5 : -3.5,
      vy: 1.0,
      isGrounded: false,
      life: 90,
    });
    soundEngine.playFireball();
  }

  private spawnSproutingItem(x: number, y: number, type: 'mushroom' | 'fireflower') {
    this.items.push({
      id: `item_${this.globalAnimTimer}`,
      type,
      x,
      y: y + 16,
      vx: 0,
      vy: 0,
      width: 16,
      height: 16,
      isGrounded: true,
      sprouting: true,
      sproutProgress: 0,
      collected: false,
      animFrame: 0,
    });
  }

  private spawnBlockCoin(x: number, y: number) {
    this.particles.push({
      id: `coin_${this.globalAnimTimer}`,
      x,
      y,
      vx: 0,
      vy: -3.5,
      life: 0,
      maxLife: 20,
      type: 'coin_sparkle',
    });
  }

  public spawnCoinExplosion(x: number, y: number) {
    const count = 12;
    const colors = ['#fcb040', '#ffffff', '#fce0a8', '#f88c00', '#fff8b0'];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const speed = 1.2 + Math.random() * 2.2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 0.7; // slight upward fountain pop
      const color = colors[i % colors.length];
      const size = Math.random() > 0.4 ? 3 : 2;
      const maxLife = 18 + Math.floor(Math.random() * 12);

      this.particles.push({
        id: `coin_px_${this.globalAnimTimer}_${i}_${Math.random()}`,
        x,
        y,
        vx,
        vy,
        life: 0,
        maxLife,
        color,
        size,
        type: 'coin_pixel',
      });
    }
  }

  private spawnBrickShards(x: number, y: number) {
    const shards = [
      { vx: -1.6, vy: -4.0 },
      { vx: 1.6, vy: -4.0 },
      { vx: -1.2, vy: -2.0 },
      { vx: 1.2, vy: -2.0 },
    ];
    shards.forEach((s, idx) => {
      this.particles.push({
        id: `shard_${this.globalAnimTimer}_${idx}`,
        x,
        y,
        vx: s.vx,
        vy: s.vy,
        life: 0,
        maxLife: 40,
        type: 'brick_shard',
        rotation: 0,
        rotSpeed: s.vx > 0 ? 0.2 : -0.2,
      });
    });
  }

  private spawnScoreParticle(x: number, y: number, text: string) {
    this.particles.push({
      id: `score_${this.globalAnimTimer}`,
      x,
      y: y - 8,
      vx: 0,
      vy: -0.8,
      life: 0,
      maxLife: 35,
      text,
      type: 'score',
    });
  }

  private addCoin() {
    this.coins++;
    this.score += 200;
    if (this.coins >= 100) {
      this.coins = 0;
      this.lives++;
      soundEngine.playPowerup();
    }
  }

  private checkOverlap(a: Rect, b: Rect): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
}
