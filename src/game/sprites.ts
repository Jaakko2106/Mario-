/**
 * 8-Bit NES Super Mario Bros Pixel Art Sprite Renderer
 * Accurately renders 16x16 and 16x32 sprites with NES palette.
 */

import { MarioState, Enemy, Item, Block, Particle, Fireball, BowserFire, SceneryItem } from './types';

export class SpriteRenderer {
  // Classic NES Color Palette
  private static readonly C = {
    SKY_BLUE: '#5c94fc',
    UNDERGROUND_BG: '#000000',
    CASTLE_BG: '#000000',
    MARIO_RED: '#b81800',
    MARIO_BROWN: '#885818',
    MARIO_SKIN: '#fcb040',
    MARIO_WHITE: '#fcfcfc',
    GOOMBA_BROWN: '#a83800',
    GOOMBA_SKIN: '#fce0a8',
    KOOPA_GREEN: '#00a800',
    KOOPA_LIGHT: '#80d010',
    KOOPA_YELLOW: '#fce0a8',
    BRICK_BROWN: '#b84418',
    BRICK_DARK: '#401800',
    QUESTION_YELLOW: '#fca044',
    QUESTION_LIGHT: '#fce0a8',
    QUESTION_DARK: '#884400',
    USED_BLOCK: '#885020',
    PIPE_GREEN: '#00a800',
    PIPE_LIGHT: '#58d838',
    PIPE_DARK: '#005000',
    BLACK: '#000000',
    WHITE: '#ffffff',
    COIN_GOLD: '#fcb040',
    COIN_WHITE: '#fcfcfc',
    HILL_GREEN: '#00a800',
    HILL_LIGHT: '#58d838',
    BUSH_GREEN: '#00a800',
    CLOUD_WHITE: '#fcfcfc',
    CLOUD_BLUE: '#90c0fc',
    CASTLE_STONE: '#6c6c6c',
    CASTLE_DARK: '#282828',
    LAVA_RED: '#d82800',
    LAVA_YELLOW: '#fcb040',
  };

  /**
   * Render Mario
   */
  public static renderMario(ctx: CanvasRenderingContext2D, mario: MarioState) {
    if (mario.isDead) {
      this.drawMarioDead(ctx, mario);
      return;
    }

    // Invulnerability flashing (every 4 frames)
    if (mario.invulnerableTimer > 0 && Math.floor(mario.invulnerableTimer / 4) % 2 === 0) {
      return;
    }

    // Power-up transformation flickering
    if (mario.transformTimer > 0 && Math.floor(mario.transformTimer / 3) % 2 === 0) {
      // flash size/state
    }

    ctx.save();
    ctx.translate(Math.round(mario.x), Math.round(mario.y));

    // Flip horizontally if facing left
    if (mario.facing === 'left') {
      ctx.translate(mario.width, 0);
      ctx.scale(-1, 1);
    }

    const isFire = mario.power === 'fire';
    const capColor = isFire ? this.C.MARIO_WHITE : this.C.MARIO_RED;
    const suitColor = isFire ? this.C.MARIO_RED : this.C.MARIO_BROWN;
    const shirtColor = isFire ? this.C.MARIO_WHITE : this.C.MARIO_RED;

    // Growth transformation flicker: alternate between small and big frames
    if (mario.transformTimer > 0 && Math.floor(mario.transformTimer / 4) % 2 === 1) {
      ctx.translate(0, 15);
      this.drawSmallMario(ctx, mario, capColor, suitColor, shirtColor);
      ctx.restore();
      return;
    }

    if (mario.power === 'small') {
      this.drawSmallMario(ctx, mario, capColor, suitColor, shirtColor);
    } else {
      this.drawSuperMario(ctx, mario, capColor, suitColor, shirtColor);
    }

    ctx.restore();
  }

  private static drawSmallMario(
    ctx: CanvasRenderingContext2D, 
    mario: MarioState,
    capColor: string, 
    suitColor: string, 
    shirtColor: string
  ) {
    const skin = this.C.MARIO_SKIN;
    const eye = this.C.BLACK;

    // Head / Cap (16x16 grid)
    // Row 0-1: Cap
    ctx.fillStyle = capColor;
    ctx.fillRect(3, 1, 6, 2);
    ctx.fillRect(2, 2, 9, 2);

    // Row 3-4: Hair & Face
    ctx.fillStyle = suitColor;
    ctx.fillRect(2, 3, 3, 3);
    ctx.fillStyle = skin;
    ctx.fillRect(5, 3, 4, 3);
    // Nose
    ctx.fillRect(9, 4, 2, 2);
    // Eye
    ctx.fillStyle = eye;
    ctx.fillRect(8, 3, 1, 2);
    // Mustache
    ctx.fillStyle = suitColor;
    ctx.fillRect(7, 5, 4, 1);

    // Row 6-9: Torso / Overalls / Arms
    if (mario.isJumping) {
      // Jump pose
      ctx.fillStyle = shirtColor;
      ctx.fillRect(1, 6, 3, 3); // Left arm up
      ctx.fillRect(4, 7, 6, 4); // Chest
      ctx.fillRect(10, 8, 3, 3); // Right arm forward
      ctx.fillStyle = suitColor;
      ctx.fillRect(5, 8, 4, 4); // Suspenders
      // Hands
      ctx.fillStyle = skin;
      ctx.fillRect(0, 5, 2, 2);
      ctx.fillRect(12, 8, 2, 2);
      // Legs split
      ctx.fillStyle = suitColor;
      ctx.fillRect(2, 11, 4, 3);
      ctx.fillRect(8, 12, 4, 3);
      // Shoes
      ctx.fillStyle = suitColor;
      ctx.fillRect(1, 13, 3, 3);
      ctx.fillRect(10, 13, 3, 3);
    } else if (mario.isSkidding) {
      // Skid pose
      ctx.fillStyle = shirtColor;
      ctx.fillRect(3, 6, 8, 4);
      ctx.fillStyle = suitColor;
      ctx.fillRect(4, 8, 6, 4);
      ctx.fillStyle = skin;
      ctx.fillRect(10, 7, 2, 2);
      ctx.fillRect(1, 7, 2, 2);
      // Legs
      ctx.fillStyle = suitColor;
      ctx.fillRect(3, 11, 8, 3);
      ctx.fillRect(2, 13, 4, 3);
      ctx.fillRect(8, 13, 4, 3);
    } else if (Math.abs(mario.vx) > 0.1) {
      // Walk animation: 3 frames
      const frame = mario.walkFrame % 3;
      ctx.fillStyle = shirtColor;
      ctx.fillRect(3, 6, 8, 4);
      ctx.fillStyle = suitColor;
      ctx.fillRect(4, 8, 6, 4);
      ctx.fillStyle = skin;
      ctx.fillRect(2, 7, 2, 2);
      ctx.fillRect(10, 7, 2, 2);

      // Animated legs
      ctx.fillStyle = suitColor;
      if (frame === 0) {
        ctx.fillRect(3, 11, 4, 4);
        ctx.fillRect(8, 11, 4, 4);
      } else if (frame === 1) {
        ctx.fillRect(2, 11, 5, 3);
        ctx.fillRect(8, 11, 4, 5);
      } else {
        ctx.fillRect(5, 11, 4, 5);
        ctx.fillRect(9, 11, 4, 3);
      }
    } else {
      // Idle pose
      ctx.fillStyle = shirtColor;
      ctx.fillRect(3, 6, 8, 4);
      ctx.fillStyle = suitColor;
      ctx.fillRect(4, 8, 6, 4);
      ctx.fillStyle = skin;
      ctx.fillRect(1, 7, 3, 3);
      ctx.fillRect(10, 7, 3, 3);

      // Legs / Shoes
      ctx.fillStyle = suitColor;
      ctx.fillRect(3, 11, 4, 3);
      ctx.fillRect(8, 11, 4, 3);
      ctx.fillRect(2, 13, 4, 3);
      ctx.fillRect(8, 13, 4, 3);
    }
  }

  private static drawSuperMario(
    ctx: CanvasRenderingContext2D, 
    mario: MarioState,
    capColor: string, 
    suitColor: string, 
    shirtColor: string
  ) {
    const skin = this.C.MARIO_SKIN;
    const eye = this.C.BLACK;

    // Crouching: compress height
    if (mario.isCrouching) {
      ctx.fillStyle = capColor;
      ctx.fillRect(3, 12, 8, 3);
      ctx.fillRect(2, 14, 11, 3);
      ctx.fillStyle = skin;
      ctx.fillRect(4, 16, 7, 4);
      ctx.fillRect(11, 17, 2, 2);
      ctx.fillStyle = suitColor;
      ctx.fillRect(2, 20, 12, 6);
      ctx.fillRect(1, 26, 14, 6);
      return;
    }

    // Fireball throwing pose
    if (mario.throwTimer > 0) {
      // Head
      ctx.fillStyle = capColor;
      ctx.fillRect(4, 2, 7, 3);
      ctx.fillRect(3, 4, 11, 3);
      ctx.fillStyle = suitColor;
      ctx.fillRect(3, 6, 3, 4);
      ctx.fillRect(2, 8, 3, 2);
      ctx.fillStyle = skin;
      ctx.fillRect(6, 6, 5, 5);
      ctx.fillRect(11, 8, 3, 3);
      ctx.fillStyle = eye;
      ctx.fillRect(9, 7, 2, 2);
      ctx.fillStyle = suitColor;
      ctx.fillRect(8, 10, 5, 2);

      // Torso & Outstretched Arm
      ctx.fillStyle = shirtColor;
      ctx.fillRect(1, 14, 4, 4); // Left arm back
      ctx.fillRect(5, 13, 6, 6); // Torso
      ctx.fillRect(11, 13, 5, 4); // Right arm thrust forward!
      ctx.fillStyle = suitColor;
      ctx.fillRect(5, 16, 6, 6); // Overalls
      ctx.fillStyle = skin;
      ctx.fillRect(0, 15, 2, 2);
      ctx.fillRect(15, 14, 2, 2);
      // Legs
      ctx.fillStyle = suitColor;
      ctx.fillRect(3, 22, 5, 5);
      ctx.fillRect(8, 22, 5, 5);
      ctx.fillRect(2, 27, 5, 4);
      ctx.fillRect(9, 27, 5, 4);
      return;
    }

    // Normal Super Mario (16x32)
    // Head / Cap
    ctx.fillStyle = capColor;
    ctx.fillRect(4, 2, 7, 3);
    ctx.fillRect(3, 4, 11, 3);

    // Hair / Face
    ctx.fillStyle = suitColor;
    ctx.fillRect(3, 6, 3, 4);
    ctx.fillRect(2, 8, 3, 2);
    ctx.fillStyle = skin;
    ctx.fillRect(6, 6, 5, 5);
    ctx.fillRect(11, 8, 3, 3); // Nose
    ctx.fillStyle = eye;
    ctx.fillRect(9, 7, 2, 2); // Eye
    ctx.fillStyle = suitColor;
    ctx.fillRect(8, 10, 5, 2); // Mustache

    // Torso & Overalls
    if (mario.isJumping) {
      // Jumping pose
      ctx.fillStyle = shirtColor;
      ctx.fillRect(2, 12, 4, 5); // left arm up
      ctx.fillRect(5, 13, 7, 6); // shirt
      ctx.fillRect(11, 14, 4, 5); // right arm
      ctx.fillStyle = suitColor;
      ctx.fillRect(5, 16, 6, 6); // overalls
      // Hands
      ctx.fillStyle = skin;
      ctx.fillRect(1, 9, 3, 3);
      ctx.fillRect(13, 15, 3, 3);
      // Legs
      ctx.fillStyle = suitColor;
      ctx.fillRect(2, 21, 5, 5);
      ctx.fillRect(9, 23, 6, 4);
      // Shoes
      ctx.fillRect(1, 25, 5, 4);
      ctx.fillRect(11, 26, 4, 4);
    } else if (mario.isSkidding) {
      // Skidding pose
      ctx.fillStyle = shirtColor;
      ctx.fillRect(4, 13, 8, 6);
      ctx.fillStyle = suitColor;
      ctx.fillRect(5, 17, 6, 7);
      ctx.fillStyle = skin;
      ctx.fillRect(1, 14, 3, 3);
      ctx.fillRect(12, 14, 3, 3);
      // Legs
      ctx.fillStyle = suitColor;
      ctx.fillRect(3, 23, 10, 4);
      ctx.fillRect(2, 26, 5, 5);
      ctx.fillRect(9, 26, 5, 5);
    } else if (Math.abs(mario.vx) > 0.1) {
      // Walking pose
      const frame = mario.walkFrame % 3;
      ctx.fillStyle = shirtColor;
      ctx.fillRect(4, 13, 8, 6);
      ctx.fillStyle = suitColor;
      ctx.fillRect(5, 17, 6, 7);
      ctx.fillStyle = skin;
      ctx.fillRect(2, 15, 3, 3);
      ctx.fillRect(11, 15, 3, 3);

      ctx.fillStyle = suitColor;
      if (frame === 0) {
        ctx.fillRect(4, 23, 4, 5);
        ctx.fillRect(9, 23, 4, 5);
        ctx.fillRect(3, 27, 4, 4);
        ctx.fillRect(9, 27, 4, 4);
      } else if (frame === 1) {
        ctx.fillRect(2, 23, 6, 5);
        ctx.fillRect(9, 23, 4, 6);
        ctx.fillRect(1, 27, 5, 4);
        ctx.fillRect(10, 27, 4, 4);
      } else {
        ctx.fillRect(6, 23, 4, 6);
        ctx.fillRect(10, 23, 5, 5);
        ctx.fillRect(6, 28, 4, 3);
        ctx.fillRect(10, 27, 5, 4);
      }
    } else {
      // Idle
      ctx.fillStyle = shirtColor;
      ctx.fillRect(4, 13, 8, 6);
      ctx.fillStyle = suitColor;
      ctx.fillRect(5, 17, 6, 7);
      ctx.fillStyle = skin;
      ctx.fillRect(1, 15, 3, 3);
      ctx.fillRect(12, 15, 3, 3);

      ctx.fillStyle = suitColor;
      ctx.fillRect(4, 23, 4, 5);
      ctx.fillRect(9, 23, 4, 5);
      ctx.fillRect(3, 27, 4, 4);
      ctx.fillRect(9, 27, 4, 4);
    }
  }

  private static drawMarioDead(ctx: CanvasRenderingContext2D, mario: MarioState) {
    ctx.save();
    ctx.translate(Math.round(mario.x), Math.round(mario.y));
    const cap = this.C.MARIO_RED;
    const skin = this.C.MARIO_SKIN;
    const suit = this.C.MARIO_BROWN;

    // Face forward dead pose
    ctx.fillStyle = cap;
    ctx.fillRect(3, 1, 10, 3);
    ctx.fillRect(2, 3, 12, 2);
    ctx.fillStyle = skin;
    ctx.fillRect(3, 5, 10, 4);
    ctx.fillStyle = this.C.BLACK;
    ctx.fillRect(5, 6, 2, 2);
    ctx.fillRect(9, 6, 2, 2);
    ctx.fillStyle = suit;
    ctx.fillRect(5, 8, 6, 2); // Mustache
    // Body
    ctx.fillStyle = cap;
    ctx.fillRect(3, 9, 10, 3);
    ctx.fillStyle = suit;
    ctx.fillRect(4, 11, 8, 3);
    ctx.fillRect(2, 13, 4, 3);
    ctx.fillRect(10, 13, 4, 3);
    ctx.restore();
  }

  /**
   * Render Enemy
   */
  public static renderEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    ctx.save();
    ctx.translate(Math.round(enemy.x), Math.round(enemy.y));

    if (enemy.facing === 'left') {
      ctx.translate(enemy.width, 0);
      ctx.scale(-1, 1);
    }

    switch (enemy.type) {
      case 'goomba':
        this.drawGoomba(ctx, enemy);
        break;
      case 'koopa':
        this.drawKoopa(ctx, enemy);
        break;
      case 'piranha':
        this.drawPiranha(ctx, enemy);
        break;
      case 'bowser':
        this.drawBowser(ctx, enemy);
        break;
    }

    ctx.restore();
  }

  private static drawGoomba(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    const brown = this.C.GOOMBA_BROWN;
    const skin = this.C.GOOMBA_SKIN;
    const black = this.C.BLACK;
    const white = this.C.WHITE;

    if (enemy.squishedTimer > 0) {
      // Squished flat goomba
      ctx.fillStyle = brown;
      ctx.fillRect(2, 9, 12, 5);
      ctx.fillStyle = skin;
      ctx.fillRect(4, 10, 8, 3);
      ctx.fillStyle = black;
      ctx.fillRect(3, 12, 10, 2);
      return;
    }

    // Mushroom cap
    ctx.fillStyle = brown;
    ctx.fillRect(4, 1, 8, 2);
    ctx.fillRect(2, 3, 12, 3);
    ctx.fillRect(1, 6, 14, 3);

    // Stem / Face
    ctx.fillStyle = skin;
    ctx.fillRect(4, 8, 8, 4);

    // Eyes
    ctx.fillStyle = white;
    ctx.fillRect(4, 8, 2, 3);
    ctx.fillRect(10, 8, 2, 3);
    ctx.fillStyle = black;
    ctx.fillRect(5, 9, 2, 2);
    ctx.fillRect(9, 9, 2, 2);

    // Eyebrows
    ctx.fillStyle = black;
    ctx.fillRect(3, 7, 4, 1);
    ctx.fillRect(9, 7, 4, 1);

    // Animated feet (2 frames)
    ctx.fillStyle = black;
    if (enemy.animFrame === 0) {
      ctx.fillRect(1, 12, 5, 4);
      ctx.fillRect(10, 12, 5, 3);
    } else {
      ctx.fillRect(1, 12, 5, 3);
      ctx.fillRect(10, 12, 5, 4);
    }
  }

  private static drawKoopa(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    const green = this.C.KOOPA_GREEN;
    const yellow = this.C.KOOPA_YELLOW;
    const black = this.C.BLACK;
    const white = this.C.WHITE;

    if (enemy.inShell) {
      // Shell mode (16x16)
      ctx.fillStyle = green;
      ctx.fillRect(3, 3, 10, 10);
      ctx.fillRect(2, 5, 12, 6);

      // Shell rim
      ctx.fillStyle = yellow;
      ctx.fillRect(2, 11, 12, 3);

      // Shell pattern lines
      ctx.fillStyle = this.C.KOOPA_LIGHT;
      ctx.fillRect(5, 5, 6, 2);
      ctx.fillRect(5, 8, 6, 2);
      return;
    }

    // Normal Koopa Troopa (16x24)
    // Head
    ctx.fillStyle = green;
    ctx.fillRect(7, 2, 6, 4);
    ctx.fillRect(6, 4, 8, 4);
    ctx.fillStyle = yellow;
    ctx.fillRect(10, 6, 5, 3); // beak/snout
    ctx.fillStyle = white;
    ctx.fillRect(8, 4, 3, 3); // eye
    ctx.fillStyle = black;
    ctx.fillRect(9, 5, 1, 2);

    // Shell body
    ctx.fillStyle = green;
    ctx.fillRect(3, 10, 10, 8);
    ctx.fillRect(2, 12, 11, 5);
    ctx.fillStyle = yellow;
    ctx.fillRect(2, 16, 11, 3); // Rim

    // Legs (2 frames)
    ctx.fillStyle = yellow;
    if (enemy.animFrame === 0) {
      ctx.fillRect(3, 19, 4, 4);
      ctx.fillRect(9, 19, 4, 4);
      ctx.fillRect(1, 22, 5, 2);
      ctx.fillRect(8, 22, 5, 2);
    } else {
      ctx.fillRect(4, 19, 4, 4);
      ctx.fillRect(8, 19, 4, 4);
      ctx.fillRect(4, 22, 4, 2);
      ctx.fillRect(8, 22, 6, 2);
    }
  }

  private static drawPiranha(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    const red = this.C.MARIO_RED;
    const green = this.C.PIPE_GREEN;
    const white = this.C.WHITE;

    // Stem
    ctx.fillStyle = green;
    ctx.fillRect(6, 12, 4, 12);
    // Leaves
    ctx.fillRect(2, 16, 4, 3);
    ctx.fillRect(10, 16, 4, 3);

    // Animated mouth (open/closed)
    const mouthOpen = enemy.animFrame === 0;
    ctx.fillStyle = red;
    if (mouthOpen) {
      // Top jaw
      ctx.fillRect(2, 1, 12, 6);
      // Bottom jaw
      ctx.fillRect(3, 8, 10, 5);
      // Teeth
      ctx.fillStyle = white;
      ctx.fillRect(4, 6, 2, 2);
      ctx.fillRect(8, 6, 2, 2);
      ctx.fillRect(5, 7, 2, 2);
      ctx.fillRect(9, 7, 2, 2);
    } else {
      // Closed jaw
      ctx.fillRect(3, 3, 10, 9);
      ctx.fillStyle = white;
      ctx.fillRect(4, 6, 8, 2);
    }

    // Spots on head
    ctx.fillStyle = white;
    ctx.fillRect(4, 2, 2, 2);
    ctx.fillRect(10, 3, 2, 2);
  }

  private static drawBowser(ctx: CanvasRenderingContext2D, enemy: Enemy) {
    const green = this.C.KOOPA_GREEN;
    const orange = this.C.QUESTION_YELLOW;
    const red = this.C.MARIO_RED;
    const white = this.C.WHITE;
    const dark = this.C.CASTLE_DARK;

    // 32x32 Bowser Boss
    // Shell with spikes
    ctx.fillStyle = green;
    ctx.fillRect(4, 8, 16, 18);
    ctx.fillStyle = orange;
    ctx.fillRect(2, 10, 4, 14); // Shell rim

    // Spikes
    ctx.fillStyle = white;
    ctx.fillRect(10, 6, 3, 3);
    ctx.fillRect(16, 9, 3, 3);
    ctx.fillRect(8, 16, 3, 3);

    // Head
    ctx.fillStyle = green;
    ctx.fillRect(18, 6, 10, 8);
    ctx.fillStyle = orange;
    ctx.fillRect(24, 10, 7, 6); // Snout
    ctx.fillStyle = red;
    ctx.fillRect(20, 3, 6, 4); // Red hair mane
    ctx.fillStyle = white;
    ctx.fillRect(21, 7, 3, 3); // Eye
    ctx.fillStyle = dark;
    ctx.fillRect(22, 8, 1, 2);
    // Horns
    ctx.fillStyle = orange;
    ctx.fillRect(16, 4, 3, 4);

    // Mouth / teeth
    ctx.fillStyle = white;
    ctx.fillRect(26, 14, 2, 2);
    ctx.fillRect(29, 14, 2, 2);

    // Arms & Claws
    ctx.fillStyle = green;
    ctx.fillRect(14, 16, 6, 7);
    ctx.fillStyle = white;
    ctx.fillRect(18, 21, 4, 3);

    // Feet
    ctx.fillStyle = orange;
    ctx.fillRect(6, 26, 8, 6);
    ctx.fillRect(16, 26, 8, 6);
    ctx.fillStyle = white;
    ctx.fillRect(4, 30, 4, 2);
    ctx.fillRect(14, 30, 4, 2);
  }

  /**
   * Render Items
   */
  public static renderItem(ctx: CanvasRenderingContext2D, item: Item) {
    ctx.save();
    ctx.translate(Math.round(item.x), Math.round(item.y));

    switch (item.type) {
      case 'mushroom':
        this.drawMushroom(ctx, item);
        break;
      case 'fireflower':
        this.drawFireFlower(ctx, item);
        break;
      case 'coin':
        this.drawSpinningCoin(ctx, item.animFrame);
        break;
    }

    ctx.restore();
  }

  private static drawMushroom(ctx: CanvasRenderingContext2D, item: Item) {
    const red = this.C.MARIO_RED;
    const skin = this.C.MARIO_SKIN;
    const white = this.C.WHITE;
    const black = this.C.BLACK;

    // Cap
    ctx.fillStyle = red;
    ctx.fillRect(3, 1, 10, 3);
    ctx.fillRect(1, 4, 14, 5);

    // White Spots
    ctx.fillStyle = white;
    ctx.fillRect(6, 2, 4, 4);
    ctx.fillRect(1, 5, 3, 3);
    ctx.fillRect(12, 5, 3, 3);

    // Stem
    ctx.fillStyle = skin;
    ctx.fillRect(4, 9, 8, 6);

    // Eyes
    ctx.fillStyle = black;
    ctx.fillRect(5, 10, 2, 3);
    ctx.fillRect(9, 10, 2, 3);
  }

  private static drawFireFlower(ctx: CanvasRenderingContext2D, item: Item) {
    // 4 colors cycling: Red, Orange, White, Yellow
    const colors = [this.C.MARIO_RED, this.C.QUESTION_YELLOW, this.C.WHITE, this.C.COIN_GOLD];
    const c1 = colors[item.animFrame % 4];
    const c2 = colors[(item.animFrame + 1) % 4];

    // Flower head
    ctx.fillStyle = c1;
    ctx.fillRect(4, 1, 8, 2);
    ctx.fillRect(2, 3, 12, 6);
    ctx.fillStyle = c2;
    ctx.fillRect(5, 4, 6, 4);

    // Eyes
    ctx.fillStyle = this.C.BLACK;
    ctx.fillRect(6, 5, 1, 2);
    ctx.fillRect(9, 5, 1, 2);

    // Green stem & leaves
    ctx.fillStyle = this.C.PIPE_GREEN;
    ctx.fillRect(7, 9, 2, 6);
    ctx.fillRect(3, 11, 4, 3);
    ctx.fillRect(9, 11, 4, 3);
  }

  public static drawSpinningCoin(ctx: CanvasRenderingContext2D, animFrame: number) {
    const gold = this.C.COIN_GOLD;
    const white = this.C.COIN_WHITE;
    const dark = this.C.QUESTION_DARK;

    const frame = animFrame % 4;
    // 4 perspective frames: full (10px), medium (7px), thin (4px), sliver (2px)
    if (frame === 0) {
      ctx.fillStyle = gold;
      ctx.fillRect(4, 2, 8, 12);
      ctx.fillRect(3, 4, 10, 8);
      ctx.fillStyle = white;
      ctx.fillRect(5, 4, 2, 8);
      ctx.fillStyle = dark;
      ctx.fillRect(7, 5, 2, 6);
    } else if (frame === 1) {
      ctx.fillStyle = gold;
      ctx.fillRect(5, 2, 6, 12);
      ctx.fillRect(4, 4, 8, 8);
      ctx.fillStyle = white;
      ctx.fillRect(5, 4, 2, 8);
    } else if (frame === 2) {
      ctx.fillStyle = gold;
      ctx.fillRect(6, 2, 4, 12);
      ctx.fillRect(5, 4, 6, 8);
      ctx.fillStyle = white;
      ctx.fillRect(6, 4, 2, 8);
    } else {
      ctx.fillStyle = gold;
      ctx.fillRect(7, 2, 2, 12);
      ctx.fillRect(6, 4, 4, 8);
    }
  }

  /**
   * Render Block
   */
  public static renderBlock(
    ctx: CanvasRenderingContext2D, 
    block: Block, 
    theme: 'overworld' | 'underground' | 'castle', 
    globalAnimTimer: number
  ) {
    if (block.isDestroyed) return;

    ctx.save();
    const bumpY = block.bumpOffset;
    ctx.translate(block.x, block.y + bumpY);

    switch (block.type) {
      case 'ground':
        this.drawGroundTile(ctx, theme);
        break;
      case 'brick':
        this.drawBrickTile(ctx, theme);
        break;
      case 'question':
        this.drawQuestionTile(ctx, Math.floor(globalAnimTimer / 12));
        break;
      case 'used':
        this.drawUsedTile(ctx);
        break;
      case 'hard':
        this.drawHardTile(ctx, theme);
        break;
      case 'pipe_tl':
        this.drawPipeTL(ctx);
        break;
      case 'pipe_tr':
        this.drawPipeTR(ctx);
        break;
      case 'pipe_bl':
        this.drawPipeBL(ctx);
        break;
      case 'pipe_br':
        this.drawPipeBR(ctx);
        break;
      case 'flagpole':
        this.drawFlagpole(ctx);
        break;
      case 'axe':
        this.drawAxe(ctx, globalAnimTimer);
        break;
      case 'bridge':
        this.drawBridge(ctx);
        break;
    }

    ctx.restore();
  }

  private static drawGroundTile(ctx: CanvasRenderingContext2D, theme: 'overworld' | 'underground' | 'castle') {
    let main = this.C.BRICK_BROWN;
    let dark = this.C.BRICK_DARK;
    let light = this.C.QUESTION_LIGHT;

    if (theme === 'underground') {
      main = '#006090';
      dark = '#002040';
      light = '#60c0f0';
    } else if (theme === 'castle') {
      main = this.C.CASTLE_STONE;
      dark = this.C.CASTLE_DARK;
      light = '#a0a0a0';
    }

    ctx.fillStyle = main;
    ctx.fillRect(0, 0, 16, 16);

    // Textured mortar lines
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(8, 1, 1, 7);
    ctx.fillRect(0, 8, 16, 1);
    ctx.fillRect(4, 9, 1, 7);
    ctx.fillRect(12, 9, 1, 7);

    // Highlights
    ctx.fillStyle = light;
    ctx.fillRect(1, 1, 7, 1);
    ctx.fillRect(9, 1, 6, 1);
    ctx.fillRect(1, 9, 3, 1);
    ctx.fillRect(5, 9, 6, 1);
  }

  private static drawBrickTile(ctx: CanvasRenderingContext2D, theme: 'overworld' | 'underground' | 'castle') {
    let brickColor = this.C.BRICK_BROWN;
    let darkColor = this.C.BRICK_DARK;

    if (theme === 'underground') {
      brickColor = '#006090';
      darkColor = '#001830';
    } else if (theme === 'castle') {
      brickColor = this.C.CASTLE_STONE;
      darkColor = this.C.CASTLE_DARK;
    }

    ctx.fillStyle = brickColor;
    ctx.fillRect(0, 0, 16, 16);

    // Mortar lines
    ctx.fillStyle = darkColor;
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 4, 16, 1);
    ctx.fillRect(0, 8, 16, 1);
    ctx.fillRect(0, 12, 16, 1);

    // Vertical brick joints
    ctx.fillRect(7, 1, 1, 3);
    ctx.fillRect(3, 5, 1, 3);
    ctx.fillRect(11, 5, 1, 3);
    ctx.fillRect(7, 9, 1, 3);
    ctx.fillRect(3, 13, 1, 3);
    ctx.fillRect(11, 13, 1, 3);
  }

  private static drawQuestionTile(ctx: CanvasRenderingContext2D, animStep: number) {
    const gold = this.C.QUESTION_YELLOW;
    const dark = this.C.QUESTION_DARK;
    const light = this.C.QUESTION_LIGHT;

    // Glowing frame
    const frame = animStep % 4;
    ctx.fillStyle = frame === 3 ? light : gold;
    ctx.fillRect(0, 0, 16, 16);

    // Dark border & 4 corner rivets
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(15, 0, 1, 16);
    ctx.fillRect(0, 15, 16, 1);

    ctx.fillRect(1, 1, 1, 1);
    ctx.fillRect(14, 1, 1, 1);
    ctx.fillRect(1, 14, 1, 1);
    ctx.fillRect(14, 14, 1, 1);

    // Question mark "?"
    ctx.fillStyle = dark;
    ctx.fillRect(5, 3, 6, 2);
    ctx.fillRect(9, 5, 2, 3);
    ctx.fillRect(6, 7, 4, 2);
    ctx.fillRect(6, 9, 2, 2);
    // Dot
    ctx.fillRect(6, 12, 2, 2);
  }

  private static drawUsedTile(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.C.USED_BLOCK;
    ctx.fillRect(0, 0, 16, 16);

    ctx.fillStyle = this.C.BLACK;
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(15, 0, 1, 16);
    ctx.fillRect(0, 15, 16, 1);

    // 4 metal rivets
    ctx.fillStyle = this.C.MARIO_BROWN;
    ctx.fillRect(2, 2, 2, 2);
    ctx.fillRect(12, 2, 2, 2);
    ctx.fillRect(2, 12, 2, 2);
    ctx.fillRect(12, 12, 2, 2);
  }

  private static drawHardTile(ctx: CanvasRenderingContext2D, theme: 'overworld' | 'underground' | 'castle') {
    let main = '#d89060';
    let dark = '#884400';
    if (theme === 'underground') {
      main = '#6090c0';
      dark = '#002050';
    } else if (theme === 'castle') {
      main = '#787878';
      dark = '#202020';
    }
    ctx.fillStyle = main;
    ctx.fillRect(0, 0, 16, 16);

    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(15, 0, 1, 16);
    ctx.fillRect(0, 15, 16, 1);
  }

  private static drawPipeTL(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.C.PIPE_GREEN;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = this.C.PIPE_LIGHT;
    ctx.fillRect(2, 2, 3, 14);
    ctx.fillStyle = this.C.PIPE_DARK;
    ctx.fillRect(0, 0, 16, 2);
    ctx.fillRect(0, 0, 2, 16);
  }

  private static drawPipeTR(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.C.PIPE_GREEN;
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = this.C.PIPE_DARK;
    ctx.fillRect(0, 0, 16, 2);
    ctx.fillRect(14, 0, 2, 16);
    ctx.fillRect(10, 2, 4, 14);
  }

  private static drawPipeBL(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.C.PIPE_GREEN;
    ctx.fillRect(2, 0, 14, 16);
    ctx.fillStyle = this.C.PIPE_LIGHT;
    ctx.fillRect(4, 0, 3, 16);
    ctx.fillStyle = this.C.PIPE_DARK;
    ctx.fillRect(2, 0, 2, 16);
  }

  private static drawPipeBR(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.C.PIPE_GREEN;
    ctx.fillRect(0, 0, 14, 16);
    ctx.fillStyle = this.C.PIPE_DARK;
    ctx.fillRect(10, 0, 4, 16);
  }

  private static drawFlagpole(ctx: CanvasRenderingContext2D) {
    // Golden top or green pole
    ctx.fillStyle = this.C.PIPE_LIGHT;
    ctx.fillRect(7, 0, 2, 16);
    ctx.fillStyle = this.C.PIPE_DARK;
    ctx.fillRect(9, 0, 1, 16);
  }

  private static drawAxe(ctx: CanvasRenderingContext2D, animTimer: number) {
    // Castle golden axe trigger
    ctx.fillStyle = this.C.COIN_GOLD;
    ctx.fillRect(4, 4, 8, 8);
    ctx.fillStyle = this.C.WHITE;
    ctx.fillRect(5, 5, 6, 2);
    ctx.fillStyle = this.C.QUESTION_DARK;
    ctx.fillRect(7, 8, 2, 8);
  }

  private static drawBridge(ctx: CanvasRenderingContext2D) {
    // Castle wooden rope bridge over lava
    ctx.fillStyle = this.C.MARIO_BROWN;
    ctx.fillRect(0, 6, 16, 4);
    ctx.fillStyle = this.C.QUESTION_DARK;
    ctx.fillRect(2, 6, 2, 4);
    ctx.fillRect(8, 6, 2, 4);
    ctx.fillRect(14, 6, 2, 4);
  }

  /**
   * Render Scenery: Hills, Bushes, Clouds, Castle
   */
  public static renderScenery(ctx: CanvasRenderingContext2D, item: SceneryItem) {
    ctx.save();
    ctx.translate(Math.round(item.x), Math.round(item.y));

    if (item.type.startsWith('cloud')) {
      this.drawCloud(ctx, item.type);
    } else if (item.type.startsWith('bush')) {
      this.drawBush(ctx, item.type);
    } else if (item.type.startsWith('hill')) {
      this.drawHill(ctx, item.type);
    } else if (item.type === 'castle') {
      this.drawCastle(ctx);
    }

    ctx.restore();
  }

  private static drawCloud(ctx: CanvasRenderingContext2D, type: string) {
    const white = this.C.CLOUD_WHITE;
    const blue = this.C.CLOUD_BLUE;

    const sections = type === 'cloud_single' ? 1 : type === 'cloud_double' ? 2 : 3;
    const width = sections * 24;

    ctx.fillStyle = white;
    ctx.beginPath();
    // Puffy cloud lobes
    for (let i = 0; i < sections; i++) {
      ctx.arc(12 + i * 20, 16, 10, 0, Math.PI * 2);
      ctx.arc(20 + i * 20, 10, 9, 0, Math.PI * 2);
    }
    ctx.fill();

    // Blue bottom shadow
    ctx.fillStyle = blue;
    ctx.fillRect(6, 18, width - 4, 4);
  }

  private static drawBush(ctx: CanvasRenderingContext2D, type: string) {
    const green = this.C.BUSH_GREEN;
    const light = this.C.HILL_LIGHT;

    const sections = type === 'bush_single' ? 1 : type === 'bush_double' ? 2 : 3;
    const width = sections * 16;

    ctx.fillStyle = green;
    for (let i = 0; i < sections; i++) {
      ctx.beginPath();
      ctx.arc(8 + i * 14, 10, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = light;
    ctx.fillRect(4, 6, width - 8, 3);
  }

  private static drawHill(ctx: CanvasRenderingContext2D, type: string) {
    const green = this.C.HILL_GREEN;
    const light = this.C.HILL_LIGHT;
    const isLarge = type === 'hill_large';
    const h = isLarge ? 48 : 28;
    const w = isLarge ? 80 : 48;

    ctx.fillStyle = green;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Black eyes/dots on hills
    ctx.fillStyle = this.C.BLACK;
    ctx.fillRect(w / 2 - 4, h / 2, 2, 4);
    ctx.fillRect(w / 2 + 2, h / 2, 2, 4);

    // Light ridge
    ctx.fillStyle = light;
    ctx.fillRect(w / 2 - 1, 2, 2, h - 4);
  }

  private static drawCastle(ctx: CanvasRenderingContext2D) {
    const stone = this.C.CASTLE_STONE;
    const dark = this.C.CASTLE_DARK;
    const red = this.C.MARIO_RED;

    // Fortress walls (80x80)
    ctx.fillStyle = stone;
    ctx.fillRect(10, 30, 60, 50);

    // Battlements
    ctx.fillRect(8, 22, 10, 10);
    ctx.fillRect(24, 22, 10, 10);
    ctx.fillRect(46, 22, 10, 10);
    ctx.fillRect(62, 22, 10, 10);

    // Central Turret
    ctx.fillRect(26, 6, 28, 20);
    ctx.fillRect(24, 0, 8, 8);
    ctx.fillRect(48, 0, 8, 8);

    // Flag on turret
    ctx.fillStyle = this.C.PIPE_LIGHT;
    ctx.fillRect(39, -12, 2, 14);
    ctx.fillStyle = red;
    ctx.fillRect(41, -12, 8, 6);

    // Doorway entrance arch
    ctx.fillStyle = dark;
    ctx.fillRect(32, 54, 16, 26);
    ctx.beginPath();
    ctx.arc(40, 54, 8, Math.PI, 0);
    ctx.fill();
  }

  /**
   * Render Particles & Fireballs
   */
  public static renderParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));

    if (p.type === 'score' && p.text) {
      ctx.fillStyle = this.C.WHITE;
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText(p.text, 0, 0);
    } else if (p.type === 'brick_shard') {
      ctx.rotate(p.rotation || 0);
      ctx.fillStyle = this.C.BRICK_BROWN;
      ctx.fillRect(-4, -4, 8, 8);
      ctx.fillStyle = this.C.BRICK_DARK;
      ctx.fillRect(-2, -2, 4, 4);
    } else if (p.type === 'coin_sparkle') {
      ctx.fillStyle = this.C.COIN_GOLD;
      ctx.fillRect(-2, -2, 4, 4);
      ctx.fillStyle = this.C.WHITE;
      ctx.fillRect(-1, -1, 2, 2);
    }

    ctx.restore();
  }

  public static renderFireball(ctx: CanvasRenderingContext2D, fb: Fireball) {
    ctx.save();
    ctx.translate(Math.round(fb.x), Math.round(fb.y));

    // Bouncing Fireball (8x8)
    ctx.fillStyle = this.C.MARIO_RED;
    ctx.fillRect(1, 1, 6, 6);
    ctx.fillStyle = this.C.QUESTION_YELLOW;
    ctx.fillRect(2, 2, 4, 4);
    ctx.fillStyle = this.C.WHITE;
    ctx.fillRect(3, 3, 2, 2);

    ctx.restore();
  }

  public static renderBowserFire(ctx: CanvasRenderingContext2D, bf: BowserFire) {
    ctx.save();
    ctx.translate(Math.round(bf.x), Math.round(bf.y));

    // Bowser's traveling flame (24x8)
    ctx.fillStyle = this.C.MARIO_RED;
    ctx.fillRect(0, 2, 24, 6);
    ctx.fillStyle = this.C.QUESTION_YELLOW;
    ctx.fillRect(6, 1, 14, 6);
    ctx.fillStyle = this.C.WHITE;
    ctx.fillRect(12, 2, 6, 4);

    ctx.restore();
  }
}
