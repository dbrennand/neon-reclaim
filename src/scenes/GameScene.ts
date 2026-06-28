import Phaser from "phaser";
import { bossById, dungeons, enemyById, weaponById } from "../data";
import { getAdjacentRooms, Rng } from "../dungeon";
import { loadSave, saveGame } from "../save";
import { advanceDungeon, currentRun, currentSave, endRun, setCurrentSave, startNewRun } from "../state";
import type { BossDefinition, EnemyDefinition, RoomChipDrop, RoomDefinition, RunState, SaveState } from "../types";

interface EnemyRuntime {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
  maxHp: number;
  definition?: EnemyDefinition;
  boss?: BossDefinition;
  nextActionAt: number;
  stunnedUntil: number;
  dead: boolean;
}

type Keys = Record<"W" | "A" | "S" | "D" | "SPACE" | "E" | "P" | "M", Phaser.Input.Keyboard.Key>;

const EXIT_LEFT = 62;
const EXIT_RIGHT = 962;
const EXIT_TOP = 112;
const EXIT_BOTTOM = 626;
const SAFE_SPAWN_DISTANCE = 230;
const BASE_PLAYER_SPEED = 210;
const MIN_PLAYER_SPEED = 120;
const DODGE_SPEED_MULTIPLIER = 3.3;
const HINT_TEXT_Y = 684;

export class GameScene extends Phaser.Scene {
  private run!: RunState;
  private save!: SaveState;
  private player!: Phaser.Physics.Arcade.Sprite;
  private keys!: Keys;
  private enemiesGroup!: Phaser.Physics.Arcade.Group;
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private chips!: Phaser.Physics.Arcade.Group;
  private mines!: Phaser.Physics.Arcade.Group;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private obstacleBounds: Phaser.Geom.Rectangle[] = [];
  private enemiesRuntime: EnemyRuntime[] = [];
  private chipDropId = 0;
  private lastShotAt = -9999;
  private lastHitAt = 0;
  private dodgeReadyAt = 0;
  private roomText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private spawnedRoomId = "";
  private vendorSprite?: Phaser.Physics.Arcade.Sprite;
  private terminalText?: Phaser.GameObjects.Text;
  private paused = false;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private audioContext?: AudioContext;
  private audioMaster?: GainNode;
  private musicEvent?: Phaser.Time.TimerEvent;
  private musicStarted = false;
  private musicStep = 0;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.save = currentSave ?? loadSave();
    setCurrentSave(this.save);
    this.run = currentRun ?? startNewRun(this.save);
    this.sound.mute = this.save.muted;

    this.physics.world.setBounds(32, 82, 960, 574);
    this.enemiesGroup = this.physics.add.group();
    this.playerBullets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.chips = this.physics.add.group();
    this.mines = this.physics.add.group();
    this.obstacles = this.physics.add.staticGroup();

    this.player = this.physics.add.sprite(512, 380, "player");
    this.player.setCollideWorldBounds(true);
    this.player.setDamping(true);
    this.player.setDrag(0.88);
    this.syncPlayerLoadout();

    this.keys = this.input.keyboard!.addKeys("W,A,S,D,SPACE,E,P,M") as Keys;
    this.input.on("pointerdown", () => {
      if (this.paused) {
        return;
      }
      this.ensureAudio();
      this.fireWeapon(this.time.now);
    });
    this.input.keyboard?.on("keydown", () => this.ensureAudio());
    this.input.keyboard?.on("keydown-P", () => this.togglePause());
    this.input.keyboard?.on("keydown-M", () => {
      this.save.muted = !this.save.muted;
      this.sound.mute = this.save.muted;
      this.updateAudioMute();
      if (!this.save.muted) {
        this.ensureAudio();
      }
      saveGame(this.save);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopAudio());

    this.createHud();
    this.physics.add.overlap(this.playerBullets, this.enemiesGroup, (projectile, enemy) =>
      this.hitEnemy(projectile, enemy)
    );
    this.physics.add.overlap(this.enemyBullets, this.player, (projectile, player) =>
      this.hitPlayerWithProjectile(player, projectile)
    );
    this.physics.add.overlap(this.enemiesGroup, this.player, (enemy, player) => this.touchEnemy(player, enemy));
    this.physics.add.overlap(this.chips, this.player, (chip) => this.collectChip(chip));
    this.physics.add.overlap(this.mines, this.player, (mine, player) => this.touchMine(player, mine));
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.enemiesGroup, this.obstacles);
    this.physics.add.collider(this.playerBullets, this.obstacles, (projectile) => this.destroyProjectile(projectile));
    this.physics.add.collider(this.enemyBullets, this.obstacles, (projectile) => this.destroyProjectile(projectile));

    this.enterCurrentRoom(true);
  }

  update(time: number): void {
    if (this.paused || !this.run) {
      return;
    }

    this.updatePlayer(time);
    this.updateProjectiles(time);
    this.updateEnemies(time);
    this.updateEnemyProjectileHits();
    this.updateMineHits();
    this.updateChipPickups();
    this.updateHud();
    this.handleRoomTransitions();
    this.handleInteraction();
  }

  private createHud(): void {
    this.add.rectangle(512, 36, 1024, 72, 0x080c13).setStrokeStyle(2, 0x1f3449, 1);
    this.roomText = this.add.text(28, 12, "", { fontSize: "20px", color: "#e8f6ff" });
    this.statusText = this.add.text(28, 42, "", { fontSize: "18px", color: "#cfe8f5" });
    this.objectiveText = this.add.text(560, 10, "", {
      fontSize: "15px",
      color: "#ffd166",
      align: "right",
      fixedWidth: 430,
      wordWrap: { width: 430 }
    });
    this.hintText = this.add
      .text(512, HINT_TEXT_Y, "", {
        fontSize: "18px",
        color: "#e8f6ff",
        backgroundColor: "#101721",
        padding: { x: 10, y: 6 }
      })
      .setOrigin(0.5, 0.5);
  }

  private enterCurrentRoom(resetPlayerPosition: boolean): void {
    const room = this.currentRoom();
    const dungeon = dungeons[this.run.dungeonIndex];
    this.spawnedRoomId = "";
    this.enemiesRuntime = [];
    this.enemiesGroup.clear(true, true);
    this.playerBullets.clear(true, true);
    this.enemyBullets.clear(true, true);
    this.chips.clear(true, true);
    this.mines.clear(true, true);
    this.obstacles.clear(true, true);
    this.obstacleBounds = [];
    this.vendorSprite?.destroy();
    this.vendorSprite = undefined;
    this.terminalText?.destroy();
    this.terminalText = undefined;

    this.drawRoom(room, true);
    if (resetPlayerPosition) {
      this.player.setPosition(512, 380);
    }

    this.roomText.setText(`${dungeon.name} / ${this.roomLabel(room)}`);
    this.objectiveText.setText(dungeon.flavor);
    this.spawnPersistedChips(room);
    this.spawnRoomContent(room);
  }

  private drawRoom(room: RoomDefinition, includeLayout: boolean): void {
    this.children.list
      .filter((child) => child.getData("doorArt") || (includeLayout && child.getData("roomArt")))
      .forEach((child) => child.destroy());

    if (!includeLayout) {
      this.drawDoors(room);
      return;
    }

    const dungeon = dungeons[this.run.dungeonIndex];
    const palette = {
      downtown: { floor: 0x111820, grid: 0x24394a, prop: 0xffd166 },
      mall: { floor: 0x191622, grid: 0x473550, prop: 0xff8fab },
      factory: { floor: 0x0f1722, grid: 0x24515a, prop: 0x00f5d4 }
    }[dungeon.theme];

    const floor = this.add.rectangle(512, 369, 960, 574, palette.floor).setData("roomArt", true);
    floor.setStrokeStyle(4, palette.grid, 1).setDepth(-10);

    for (let x = 64; x < 992; x += 64) {
      this.add.line(0, 0, x, 82, x, 656, palette.grid, 0.24).setOrigin(0, 0).setData("roomArt", true).setDepth(-9);
    }
    for (let y = 116; y < 656; y += 54) {
      this.add.line(0, 0, 32, y, 992, y, palette.grid, 0.22).setOrigin(0, 0).setData("roomArt", true).setDepth(-9);
    }

    const rng = new Rng(this.run.seed + room.x * 101 + room.y * 307);
    let obstacleCount = 0;
    let attempts = 0;
    while (obstacleCount < 9 && attempts < 36) {
      attempts += 1;
      const x = rng.int(90, 934);
      const y = rng.int(126, 616);
      const w = rng.int(22, 76);
      const h = rng.int(12, 42);
      if (this.isReservedObstacleZone(x, y, w, h)) {
        continue;
      }
      this.addBlockingObstacle(x, y, w, h, palette.prop);
      obstacleCount += 1;
    }

    this.drawDoors(room);
  }

  private addBlockingObstacle(x: number, y: number, width: number, height: number, color: number): void {
    const obstacle = this.add.rectangle(x, y, width, height, color, 0.2).setStrokeStyle(1, color, 0.65).setDepth(-8);
    this.physics.add.existing(obstacle, true);
    this.obstacles.add(obstacle);
    this.obstacleBounds.push(
      new Phaser.Geom.Rectangle(x - width / 2 - 12, y - height / 2 - 12, width + 24, height + 24)
    );
  }

  private isReservedObstacleZone(x: number, y: number, width: number, height: number): boolean {
    const candidate = new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height);
    const reservedZones = [
      new Phaser.Geom.Rectangle(430, 300, 164, 164),
      new Phaser.Geom.Rectangle(32, 300, 116, 150),
      new Phaser.Geom.Rectangle(876, 300, 116, 150),
      new Phaser.Geom.Rectangle(420, 82, 184, 120),
      new Phaser.Geom.Rectangle(420, 536, 184, 120)
    ];
    return [...reservedZones, ...this.obstacleBounds].some((zone) =>
      Phaser.Geom.Intersects.RectangleToRectangle(candidate, zone)
    );
  }

  private drawDoors(room: RoomDefinition): void {
    const adjacent = getAdjacentRooms(this.run.graph, room);
    const canExit = room.cleared || this.enemiesRuntime.length === 0;
    adjacent.forEach((target) => {
      const dx = target.x - room.x;
      const dy = target.y - room.y;
      const color = canExit ? 0x63f7b4 : 0xff4d6d;
      if (dx === 1) this.add.rectangle(995, 369, 16, 120, color, 0.7).setData("doorArt", true);
      if (dx === -1) this.add.rectangle(29, 369, 16, 120, color, 0.7).setData("doorArt", true);
      if (dy === 1) this.add.rectangle(512, 659, 140, 16, color, 0.7).setData("doorArt", true);
      if (dy === -1) this.add.rectangle(512, 79, 140, 16, color, 0.7).setData("doorArt", true);
    });
  }

  private spawnRoomContent(room: RoomDefinition): void {
    if (this.spawnedRoomId === room.id) {
      return;
    }
    this.spawnedRoomId = room.id;

    if (room.type === "vendor") {
      this.vendorSprite = this.physics.add.sprite(512, 340, "vendor");
      this.add.text(458, 390, "FIELD VENDOR", { fontSize: "16px", color: "#ffd166" }).setData("roomArt", true);
      this.hintText.setText("Press E near the vendor to spend microchips.");
      return;
    }

    if (room.type === "loot" && !room.cleared) {
      this.spawnChipBurst(512, 350, 34 + this.run.dungeonIndex * 18);
      room.cleared = true;
      this.run.roomsCleared += 1;
      this.hintText.setText("Recovered an abandoned microchip cache.");
      return;
    }

    if (room.type === "boss" && !room.cleared) {
      const boss = bossById(dungeons[this.run.dungeonIndex].bossId);
      this.spawnBoss(boss);
      this.hintText.setText(boss.flavor);
      return;
    }

    if ((room.type === "combat" || room.type === "hazard") && !room.cleared) {
      const rng = new Rng(this.run.seed + this.run.dungeonIndex * 71 + room.x * 17 + room.y * 23);
      const count = 3 + this.run.dungeonIndex + (room.type === "hazard" ? 1 : 0);
      for (let i = 0; i < count; i += 1) {
        const pool = dungeons[this.run.dungeonIndex].enemyPool;
        const spawn = this.findSafeSpawnPoint(rng, SAFE_SPAWN_DISTANCE);
        this.spawnEnemy(enemyById(rng.pick(pool)), spawn.x, spawn.y);
      }
      if (room.type === "hazard") {
        for (let i = 0; i < 4; i += 1) {
          const spawn = this.findSafeSpawnPoint(rng, 150);
          this.spawnMine(spawn.x, spawn.y, 12);
        }
      }
      this.hintText.setText("Clear the room to unlock the exits.");
      return;
    }

    this.hintText.setText(room.type === "start" ? "Find the vendor, clear rooms, and defeat the district boss." : "");
  }

  private spawnEnemy(definition: EnemyDefinition, x: number, y: number): void {
    const sprite = this.physics.add.sprite(x, y, `enemy-${definition.id}`);
    sprite.setCircle(definition.radius);
    sprite.setData("enemyId", definition.id);
    this.enemiesGroup.add(sprite);
    this.enemiesRuntime.push({
      sprite,
      hp: definition.hp + this.run.dungeonIndex * 12,
      maxHp: definition.hp + this.run.dungeonIndex * 12,
      definition,
      nextActionAt: this.time.now + definition.cooldown * 0.6 + Phaser.Math.Between(0, 700),
      stunnedUntil: 0,
      dead: false
    });

    if (!this.save.discoveredEnemies.includes(definition.id)) {
      this.save.discoveredEnemies.push(definition.id);
      saveGame(this.save);
    }
  }

  private spawnBoss(boss: BossDefinition): void {
    const sprite = this.physics.add.sprite(512, 236, `boss-${boss.id}`);
    sprite.setCircle(34);
    sprite.setData("bossId", boss.id);
    this.enemiesGroup.add(sprite);
    this.enemiesRuntime.push({
      sprite,
      hp: boss.hp,
      maxHp: boss.hp,
      boss,
      nextActionAt: this.time.now + 1000,
      stunnedUntil: 0,
      dead: false
    });
  }

  private updatePlayer(time: number): void {
    this.syncPlayerLoadout();
    const speed = this.playerMoveSpeed();
    const direction = new Phaser.Math.Vector2(0, 0);
    if (this.keys.A.isDown) direction.x -= 1;
    if (this.keys.D.isDown) direction.x += 1;
    if (this.keys.W.isDown) direction.y -= 1;
    if (this.keys.S.isDown) direction.y += 1;
    if (direction.lengthSq() > 0) {
      direction.normalize();
    }

    const dodging = time < this.dodgeReadyAt - 620;
    const currentSpeed = dodging ? speed * 2.2 : speed;
    this.player.setVelocity(direction.x * currentSpeed, direction.y * currentSpeed);

    const aimPoint = this.getAimPoint();
    this.player.rotation =
      Phaser.Math.Angle.Between(this.player.x, this.player.y, aimPoint.x, aimPoint.y) + Math.PI / 2;
    if (this.input.activePointer.isDown) {
      this.fireWeapon(time);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) && time > this.dodgeReadyAt && direction.lengthSq() > 0) {
      this.player.setVelocity(
        direction.x * speed * DODGE_SPEED_MULTIPLIER,
        direction.y * speed * DODGE_SPEED_MULTIPLIER
      );
      this.lastHitAt = time + 220;
      this.dodgeReadyAt = time + 800;
      this.tweens.add({ targets: this.player, alpha: 0.45, yoyo: true, duration: 110, repeat: 1 });
    }
  }

  private playerMoveSpeed(): number {
    return Math.max(MIN_PLAYER_SPEED, BASE_PLAYER_SPEED + this.run.speedBonus);
  }

  private syncPlayerLoadout(): void {
    const textureKey = this.run.armor > 0 ? "player-armored" : "player";
    if (this.player.texture.key !== textureKey) {
      this.player.setTexture(textureKey);
    }
    this.player.setMaxVelocity(this.playerMoveSpeed() * DODGE_SPEED_MULTIPLIER);
  }

  private fireWeapon(time: number): void {
    const weapon = weaponById(this.run.weaponId);
    if (time - this.lastShotAt < weapon.fireRate) {
      return;
    }
    this.lastShotAt = time;

    const aimPoint = this.getAimPoint();
    const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, aimPoint.x, aimPoint.y);
    const center = (weapon.projectileCount - 1) / 2;
    for (let i = 0; i < weapon.projectileCount; i += 1) {
      const angle = baseAngle + (i - center) * weapon.spread;
      const muzzleOffset = 28;
      const bullet = this.physics.add.image(
        this.player.x + Math.cos(angle) * muzzleOffset,
        this.player.y + Math.sin(angle) * muzzleOffset,
        `projectile-${weapon.id}`
      );
      bullet.setData("damage", weapon.damage * (1 + this.run.damageBonus));
      bullet.setData("born", time);
      bullet.setData("velocityX", Math.cos(angle) * weapon.projectileSpeed);
      bullet.setData("velocityY", Math.sin(angle) * weapon.projectileSpeed);
      const bodySize = this.projectileBodySize(weapon.id);
      bullet.body?.setSize(bodySize.width, bodySize.height);
      bullet.setVelocity(bullet.getData("velocityX") as number, bullet.getData("velocityY") as number);
      bullet.setRotation(angle);
      this.playerBullets.add(bullet);
    }
    this.playShotSound(weapon.id);
  }

  private getAimPoint(): Phaser.Math.Vector2 {
    const pointer = this.input.activePointer;
    const point = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    if (point instanceof Phaser.Math.Vector2) {
      return point;
    }
    const fallback = point as { x: number; y: number };
    return new Phaser.Math.Vector2(fallback.x, fallback.y);
  }

  private projectileBodySize(weaponId: string): { width: number; height: number } {
    switch (weaponId) {
      case "rail-rifle":
        return { width: 46, height: 6 };
      case "scatter-coil":
        return { width: 14, height: 14 };
      case "arc-lancer":
        return { width: 42, height: 14 };
      case "pulse-pistol":
      default:
        return { width: 28, height: 8 };
    }
  }

  private updateEnemies(time: number): void {
    this.enemiesRuntime.forEach((enemy) => {
      if (!enemy.sprite.active || time < enemy.stunnedUntil) {
        return;
      }
      if (enemy.boss) {
        this.updateBoss(enemy, time);
      } else if (enemy.definition) {
        this.updateRobot(enemy, time);
      }
    });
  }

  private updateRobot(enemy: EnemyRuntime, time: number): void {
    const definition = enemy.definition!;
    const sprite = enemy.sprite;
    const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
    const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);
    const moveToward = (speedScale = 1): void => {
      sprite.setVelocity(
        Math.cos(angle) * definition.speed * speedScale,
        Math.sin(angle) * definition.speed * speedScale
      );
    };
    const keepRange = (): void => {
      const desired = distance < 270 ? -1 : 0.6;
      sprite.setVelocity(Math.cos(angle) * definition.speed * desired, Math.sin(angle) * definition.speed * desired);
    };

    if (definition.behavior === "sniper") {
      keepRange();
      if (time > enemy.nextActionAt) {
        this.enemyShoot(sprite.x, sprite.y, angle, definition.damage, 540);
        enemy.nextActionAt = time + definition.cooldown;
      }
      return;
    }

    if (definition.behavior === "mineLayer") {
      keepRange();
      if (time > enemy.nextActionAt) {
        this.spawnMine(sprite.x, sprite.y, definition.damage);
        this.enemyShoot(sprite.x, sprite.y, angle, Math.ceil(definition.damage * 0.55), 260);
        enemy.nextActionAt = time + definition.cooldown + 250;
      }
      return;
    }

    if (definition.behavior === "support") {
      keepRange();
      if (time > enemy.nextActionAt) {
        const target = this.enemiesRuntime.find((other) => other !== enemy && other.hp < other.maxHp);
        if (target) {
          target.hp = Math.min(target.maxHp, target.hp + 20);
          this.add
            .line(0, 0, sprite.x, sprite.y, target.sprite.x, target.sprite.y, definition.accent, 0.8)
            .setOrigin(0, 0)
            .setDepth(2)
            .setData("roomArt", true);
        } else {
          this.enemyShoot(sprite.x, sprite.y, angle, definition.damage, 360);
        }
        enemy.nextActionAt = time + definition.cooldown;
      }
      return;
    }

    if (definition.behavior === "hacker") {
      keepRange();
      if (time > enemy.nextActionAt) {
        this.enemyShoot(sprite.x, sprite.y, angle, definition.damage, 300, "slow");
        enemy.nextActionAt = time + definition.cooldown;
      }
      return;
    }

    if (definition.behavior === "shield") {
      sprite.setVelocity(
        Math.cos(angle) * definition.speed * (distance > 150 ? 0.55 : -0.2),
        Math.sin(angle) * definition.speed * (distance > 150 ? 0.55 : -0.2)
      );
      if (time > enemy.nextActionAt && distance < 430) {
        this.enemyShoot(sprite.x, sprite.y, angle, Math.ceil(definition.damage * 0.75), 240);
        enemy.nextActionAt = time + definition.cooldown + 700;
      }
      return;
    }

    moveToward(1);
  }

  private updateBoss(enemy: EnemyRuntime, time: number): void {
    const boss = enemy.boss!;
    const sprite = enemy.sprite;
    const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
    const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);
    sprite.setVelocity(
      Math.cos(angle) * boss.speed * (distance > 240 ? 1 : -0.5),
      Math.sin(angle) * boss.speed * (distance > 240 ? 1 : -0.5)
    );

    if (time > enemy.nextActionAt) {
      const phase = enemy.hp < enemy.maxHp * 0.5 ? 8 : 5;
      for (let i = 0; i < phase; i += 1) {
        const shotAngle = angle + (i - (phase - 1) / 2) * 0.18;
        this.enemyShoot(sprite.x, sprite.y, shotAngle, boss.damage, 330 + this.run.dungeonIndex * 35);
      }
      if (enemy.hp < enemy.maxHp * 0.65) {
        const pool = dungeons[this.run.dungeonIndex].enemyPool;
        const rng = new Rng(this.run.seed + Math.floor(time));
        const spawn = this.findSafeSpawnPoint(rng, 190);
        this.spawnEnemy(enemyById(pool[Math.floor(Math.random() * pool.length)]), spawn.x, spawn.y);
      }
      enemy.nextActionAt = time + 1500 - this.run.dungeonIndex * 120;
    }
  }

  private enemyShoot(x: number, y: number, angle: number, damage: number, speed: number, effect?: "slow"): void {
    const muzzleOffset = 30;
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;
    const bullet = this.physics.add.image(
      x + Math.cos(angle) * muzzleOffset,
      y + Math.sin(angle) * muzzleOffset,
      "enemy-projectile"
    );
    bullet.setData("damage", damage);
    bullet.setData("born", this.time.now);
    bullet.setData("velocityX", velocityX);
    bullet.setData("velocityY", velocityY);
    if (effect) {
      bullet.setData("effect", effect);
    }
    bullet.body?.setSize(28, 8);
    bullet.setVelocity(velocityX, velocityY);
    bullet.setRotation(angle);
    this.enemyBullets.add(bullet);
  }

  private findSafeSpawnPoint(rng: Rng, minPlayerDistance: number): Phaser.Math.Vector2 {
    let best = new Phaser.Math.Vector2(512, 380);
    let bestDistance = -1;
    for (let i = 0; i < 50; i += 1) {
      const point = new Phaser.Math.Vector2(rng.int(110, 914), rng.int(140, 600));
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, point.x, point.y);
      if (distance > bestDistance && !this.isPointBlockedByObstacle(point.x, point.y)) {
        best = point;
        bestDistance = distance;
      }
      if (distance >= minPlayerDistance && !this.isPointBlockedByObstacle(point.x, point.y)) {
        return point;
      }
    }
    return best;
  }

  private isPointBlockedByObstacle(x: number, y: number): boolean {
    return this.obstacleBounds.some((bounds) => bounds.contains(x, y));
  }

  private updateProjectiles(time: number): void {
    [...this.playerBullets.getChildren(), ...this.enemyBullets.getChildren()].forEach((child) => {
      const body = child as Phaser.Physics.Arcade.Image;
      const velocityX = body.getData("velocityX") as number | undefined;
      const velocityY = body.getData("velocityY") as number | undefined;
      if (velocityX !== undefined && velocityY !== undefined) {
        body.setVelocity(velocityX, velocityY);
      }
    });

    [this.playerBullets, this.enemyBullets].forEach((group) => {
      group.getChildren().forEach((child) => {
        const body = child as Phaser.Physics.Arcade.Image;
        const born = body.getData("born") as number;
        if (time - born > 1800 || body.x < 20 || body.x > 1004 || body.y < 72 || body.y > 666) {
          this.destroyProjectile(body);
        }
      });
    });
  }

  private destroyProjectile(projectileObject: unknown): void {
    const projectile = this.getArcadeImage(projectileObject);
    if (!projectile || !projectile.active) {
      return;
    }
    projectile.disableBody(true, true);
    projectile.destroy();
  }

  private updateEnemyProjectileHits(): void {
    this.enemyBullets.getChildren().forEach((child) => {
      const projectile = this.getArcadeImage(child);
      if (!projectile || !projectile.active) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, projectile.x, projectile.y);
      if (distance <= 24) {
        this.hitPlayerWithProjectile(this.player, projectile);
      }
    });
  }

  private hitEnemy(projectileObject: unknown, enemyObject: unknown): void {
    const projectile = this.getArcadeImage(projectileObject);
    const enemySprite = this.getArcadeSprite(enemyObject);
    if (!projectile || !enemySprite) return;

    const enemy = this.enemiesRuntime.find((runtime) => runtime.sprite === enemySprite);
    if (!enemy || enemy.dead || !projectile.active || !enemySprite.active) return;

    let damage = projectile.getData("damage") as number;
    if (enemy.definition?.behavior === "shield") {
      damage *= 0.72;
    }
    enemy.hp -= damage;
    projectile.disableBody(true, true);
    projectile.destroy();
    this.playEnemyDamageFeedback(enemySprite, damage);
    this.playEnemyHitSound();

    if (enemy.hp <= 0) {
      enemy.dead = true;
      this.run.enemiesDefeated += 1;
      const chips = enemy.definition?.chipValue ?? 42 + this.run.dungeonIndex * 12;
      this.spawnChipBurst(enemySprite.x, enemySprite.y, chips);
      enemySprite.disableBody(true, true);
      enemySprite.destroy();
      this.enemiesRuntime = this.enemiesRuntime.filter((runtime) => runtime !== enemy);
      if (this.enemiesRuntime.length === 0) {
        this.clearRoom();
      }
    }
  }

  private playEnemyDamageFeedback(enemySprite: Phaser.Physics.Arcade.Sprite, damage: number): void {
    enemySprite.setTint(0xff4d6d);
    enemySprite.setAlpha(0.75);

    const spark = this.add
      .circle(enemySprite.x, enemySprite.y, 8, 0xffffff, 0.65)
      .setStrokeStyle(2, 0xffd166, 0.95)
      .setDepth(5);
    this.tweens.add({
      targets: spark,
      alpha: 0,
      scale: 2.4,
      duration: 150,
      ease: "Quad.easeOut",
      onComplete: () => spark.destroy()
    });

    const damageText = this.add
      .text(enemySprite.x, enemySprite.y - 30, Math.ceil(damage).toString(), {
        fontSize: "13px",
        color: "#ffd166",
        stroke: "#080c13",
        strokeThickness: 3
      })
      .setOrigin(0.5, 0.5)
      .setDepth(6);
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 16,
      alpha: 0,
      duration: 360,
      ease: "Quad.easeOut",
      onComplete: () => damageText.destroy()
    });

    this.tweens.add({
      targets: enemySprite,
      alpha: 1,
      duration: 120,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (enemySprite.active) {
          enemySprite.clearTint();
          enemySprite.setAlpha(1);
        }
      }
    });
  }

  private touchEnemy(_playerObject: unknown, enemyObject: unknown): void {
    const enemySprite = this.getArcadeSprite(enemyObject);
    if (!enemySprite) return;

    const enemy = this.enemiesRuntime.find((runtime) => runtime.sprite === enemySprite);
    const damage = enemy?.definition?.damage ?? enemy?.boss?.damage ?? 10;
    this.damagePlayer(damage);
  }

  private hitPlayerWithProjectile(_playerObject: unknown, projectileObject: unknown): void {
    const projectile = this.getArcadeImage(projectileObject);
    if (!projectile) return;

    this.damagePlayer(projectile.getData("damage") as number);
    if (projectile.getData("effect") === "slow") {
      this.player.setTint(0xf15bb5);
      this.time.delayedCall(220, () => this.player.clearTint());
      this.run.speedBonus = Math.max(-55, this.run.speedBonus - 12);
      this.syncPlayerLoadout();
    }
    this.destroyProjectile(projectile);
  }

  private touchMine(_playerObject: unknown, mineObject: unknown): void {
    const mine = this.getArcadeImage(mineObject);
    if (!mine || !mine.active) return;

    this.damagePlayer(mine.getData("damage") as number);
    this.playMineSound();
    mine.disableBody(true, true);
    mine.destroy();
  }

  private updateMineHits(): void {
    this.mines.getChildren().forEach((child) => {
      const mine = this.getArcadeImage(child);
      if (!mine || !mine.active) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, mine.x, mine.y);
      if (distance <= 32) {
        this.touchMine(this.player, mine);
      }
    });
  }

  private damagePlayer(amount: number): void {
    if (this.time.now < this.lastHitAt) {
      return;
    }
    this.lastHitAt = this.time.now + 550;
    const reduced = Math.max(2, Math.round(amount - this.run.armor * 3));
    this.run.hp -= reduced;
    this.cameras.main.shake(90, 0.006);
    this.player.setTint(0xff4d6d);
    this.playPlayerHitSound();
    this.time.delayedCall(130, () => this.player.clearTint());
    if (this.run.hp <= 0) {
      this.finishRun(false);
    }
  }

  private collectChip(chipObject: unknown): void {
    const chip = this.getArcadeImage(chipObject);
    if (!chip) {
      return;
    }
    if (!chip.active || chip.texture.key !== "chip") {
      return;
    }
    const value = Number(chip.getData("value") ?? 0);
    this.run.chips += value;
    this.run.chipsCollected += value;
    this.removePersistedChip(chip.getData("chipId") as string | undefined);
    this.playChipSound();
    chip.disableBody(true, true);
    chip.destroy();
  }

  private updateChipPickups(): void {
    this.chips.getChildren().forEach((child) => {
      const chip = this.getArcadeImage(child);
      if (!chip || !chip.active || chip.texture.key !== "chip") {
        return;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, chip.x, chip.y);
      if (distance <= 42) {
        this.collectChip(chip);
      }
    });
  }

  private getArcadeImage(value: unknown): Phaser.Physics.Arcade.Image | undefined {
    const maybeBody = value as { gameObject?: unknown };
    const maybeGameObject = maybeBody.gameObject ?? value;
    if (maybeGameObject instanceof Phaser.Physics.Arcade.Image) {
      return maybeGameObject;
    }
    return undefined;
  }

  private getArcadeSprite(value: unknown): Phaser.Physics.Arcade.Sprite | undefined {
    const maybeBody = value as { gameObject?: unknown };
    const maybeGameObject = maybeBody.gameObject ?? value;
    if (maybeGameObject instanceof Phaser.Physics.Arcade.Sprite) {
      return maybeGameObject;
    }
    return undefined;
  }

  private spawnChipBurst(x: number, y: number, value: number): void {
    const pieces = Math.max(3, Math.min(9, Math.ceil(value / 8)));
    const perPiece = Math.ceil(value / pieces);
    const room = this.currentRoom();
    room.droppedChips ??= [];

    for (let i = 0; i < pieces; i += 1) {
      const drop: RoomChipDrop = {
        id: `${room.id}-${this.time.now}-${this.chipDropId++}`,
        x,
        y,
        value: perPiece
      };
      room.droppedChips.push(drop);
      this.spawnChipDrop(drop, Phaser.Math.Between(-130, 130), Phaser.Math.Between(-130, 130));
    }
  }

  private spawnPersistedChips(room: RoomDefinition): void {
    room.droppedChips?.forEach((drop) => this.spawnChipDrop(drop, 0, 0));
  }

  private spawnChipDrop(drop: RoomChipDrop, velocityX: number, velocityY: number): void {
    const chip = this.physics.add.image(drop.x, drop.y, "chip");
    chip.setData("chipId", drop.id);
    chip.setData("value", drop.value);
    chip.setVelocity(velocityX, velocityY);
    chip.setCircle(12);
    chip.setDrag(340);
    this.chips.add(chip);
  }

  private removePersistedChip(chipId?: string): void {
    if (!chipId) {
      return;
    }
    const room = this.currentRoom();
    room.droppedChips = room.droppedChips?.filter((drop) => drop.id !== chipId);
  }

  private spawnMine(x: number, y: number, damage: number): void {
    const mine = this.physics.add.image(x, y, "mine");
    mine.setData("damage", damage);
    mine.setCircle(14);
    this.mines.add(mine);
  }

  private clearRoom(): void {
    const room = this.currentRoom();
    const newlyCleared = !room.cleared;
    room.cleared = true;
    if (newlyCleared) {
      this.run.roomsCleared += 1;
      if (room.type === "boss") {
        this.run.bossesDefeated += 1;
      }
    }
    this.hintText.setText(
      room.type === "boss" ? "Boss defeated. Use an exit to advance." : "Room clear. Exits unlocked."
    );
    this.drawRoom(room, false);
    if (room.type === "boss") {
      this.spawnChipBurst(512, 340, 70 + this.run.dungeonIndex * 35);
    }
  }

  private handleRoomTransitions(): void {
    const room = this.currentRoom();
    if (!room.cleared && this.enemiesRuntime.length > 0) {
      return;
    }
    const adjacent = getAdjacentRooms(this.run.graph, room);
    const target =
      this.player.x > EXIT_RIGHT
        ? adjacent.find((candidate) => candidate.x === room.x + 1)
        : this.player.x < EXIT_LEFT
          ? adjacent.find((candidate) => candidate.x === room.x - 1)
          : this.player.y > EXIT_BOTTOM
            ? adjacent.find((candidate) => candidate.y === room.y + 1)
            : this.player.y < EXIT_TOP
              ? adjacent.find((candidate) => candidate.y === room.y - 1)
              : undefined;

    if (!target) {
      return;
    }

    if (room.type === "boss" && room.cleared && target.type !== "boss") {
      this.persistVisibleChips(room);
      if (advanceDungeon()) {
        this.run = currentRun!;
        this.enterCurrentRoom(true);
      } else {
        this.finishRun(true);
      }
      return;
    }

    this.persistVisibleChips(room);
    this.run.currentRoomId = target.id;
    if (this.player.x > EXIT_RIGHT) this.player.setPosition(78, this.player.y);
    if (this.player.x < EXIT_LEFT) this.player.setPosition(946, this.player.y);
    if (this.player.y > EXIT_BOTTOM) this.player.setPosition(this.player.x, 126);
    if (this.player.y < EXIT_TOP) this.player.setPosition(this.player.x, 612);
    this.enterCurrentRoom(false);
  }

  private handleInteraction(): void {
    if (!Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      return;
    }
    const room = this.currentRoom();
    if (
      room.type === "vendor" &&
      this.vendorSprite &&
      Phaser.Math.Distance.Between(this.player.x, this.player.y, this.vendorSprite.x, this.vendorSprite.y) < 90
    ) {
      this.scene.pause("GameScene");
      this.scene.launch("VendorScene");
    }
  }

  private ensureAudio(): boolean {
    if (this.save.muted || typeof window === "undefined") {
      return false;
    }

    if (!this.audioContext) {
      const audioWindow = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
      const AudioCtor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
      if (!AudioCtor) {
        return false;
      }

      this.audioContext = new AudioCtor();
      this.audioMaster = this.audioContext.createGain();
      this.audioMaster.gain.value = 0.12;
      this.audioMaster.connect(this.audioContext.destination);
    }

    if (this.audioContext.state === "suspended") {
      void this.audioContext.resume();
    }

    this.updateAudioMute();
    this.startThemeMusic();
    return true;
  }

  private updateAudioMute(): void {
    if (!this.audioMaster) {
      return;
    }
    this.audioMaster.gain.value = this.save.muted ? 0 : 0.12;
  }

  private startThemeMusic(): void {
    if (this.musicStarted || this.paused || !this.audioContext || !this.audioMaster || this.save.muted) {
      return;
    }

    this.musicStarted = true;
    this.musicStep = 0;
    this.musicEvent = this.time.addEvent({
      delay: 155,
      loop: true,
      callback: () => this.playThemeStep()
    });
  }

  private stopAudio(): void {
    this.musicEvent?.remove(false);
    this.musicEvent = undefined;
    this.musicStarted = false;
  }

  private pauseMusic(): void {
    this.stopAudio();
  }

  private resumeMusic(): void {
    if (!this.save.muted && this.audioContext) {
      this.startThemeMusic();
    }
  }

  private playThemeStep(): void {
    if (!this.audioContext || !this.audioMaster || this.save.muted) {
      return;
    }

    const step = this.musicStep % 32;
    const bass = [55, 55, 65.41, 61.74, 49, 49, 58.27, 61.74];
    const arp = [220, 261.63, 329.63, 392, 311.13, 261.63, 246.94, 196];
    const lead = [440, 392, 466.16, 329.63];

    if (step % 4 === 0) {
      this.playMusicTone(bass[Math.floor(step / 4) % bass.length], 0.22, "sawtooth", 0.055, 0.02, 0.12);
      this.playMusicTone(42, 0.08, "triangle", 0.045, 0.002, 0.055, 34);
    }

    if (step % 2 === 1) {
      this.playMusicTone(arp[Math.floor(step / 2) % arp.length], 0.12, "square", 0.026, 0.006, 0.08);
    }

    if (step === 6 || step === 14 || step === 22 || step === 30) {
      this.playMusicTone(
        lead[Math.floor(step / 8) % lead.length],
        0.34,
        "triangle",
        0.035,
        0.03,
        0.2,
        lead[Math.floor(step / 8) % lead.length] * 0.75
      );
    }

    if (step % 2 === 0) {
      this.playMusicTone(1800, 0.035, "square", 0.012, 0.001, 0.025, 950);
    }

    this.musicStep += 1;
  }

  private playMusicTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    attack: number,
    releaseStart: number,
    endFrequency?: number
  ): void {
    if (!this.audioContext || !this.audioMaster) {
      return;
    }

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
    }
    filter.type = "lowpass";
    filter.frequency.value = type === "square" ? 1850 : 1200;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + attack);
    gain.gain.setValueAtTime(volume, now + releaseStart);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioMaster);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    endFrequency?: number
  ): void {
    if (!this.ensureAudio() || !this.audioContext || !this.audioMaster) {
      return;
    }

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.audioMaster);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  private playShotSound(weaponId: string): void {
    switch (weaponId) {
      case "rail-rifle":
        this.playTone(1480, 0.055, "sawtooth", 0.095, 220);
        this.playTone(2480, 0.035, "square", 0.04, 1240);
        this.time.delayedCall(22, () => this.playTone(110, 0.075, "triangle", 0.035, 70));
        break;
      case "scatter-coil":
        this.playTone(420, 0.09, "triangle", 0.085, 170);
        this.playTone(230, 0.12, "sawtooth", 0.045, 90);
        [16, 28, 42, 56].forEach((delay, index) => {
          this.time.delayedCall(delay, () => this.playTone(560 - index * 70, 0.045, "square", 0.035, 150));
        });
        break;
      case "arc-lancer":
        this.playTone(180, 0.18, "sawtooth", 0.085, 540);
        this.playTone(92, 0.2, "triangle", 0.06, 46);
        this.time.delayedCall(34, () => this.playTone(1320, 0.12, "sine", 0.045, 660));
        break;
      case "pulse-pistol":
      default:
        this.playTone(620, 0.07, "square", 0.08, 360);
        this.playTone(1240, 0.035, "sine", 0.035, 840);
        break;
    }
  }

  private playEnemyHitSound(): void {
    this.playTone(220, 0.08, "triangle", 0.07, 120);
  }

  private playPlayerHitSound(): void {
    this.playTone(130, 0.16, "sawtooth", 0.11, 70);
  }

  private playChipSound(): void {
    this.playTone(880, 0.06, "sine", 0.055, 1320);
  }

  private playMineSound(): void {
    this.playTone(80, 0.22, "sawtooth", 0.14, 35);
    this.time.delayedCall(35, () => this.playTone(42, 0.16, "square", 0.08, 24));
  }

  private finishRun(victory: boolean): void {
    const retentionLevel = this.save.metaUpgrades["salvage-cache"] ?? 0;
    const retention = victory ? 1 : 0.35 + retentionLevel * 0.08;
    const retained = Math.floor(this.run.chips * retention);
    this.save.retainedChips += retained;
    this.save.bestDungeonReached = Math.max(this.save.bestDungeonReached, this.run.dungeonIndex);
    if (!this.save.unlockedBlueprints.includes(this.run.weaponId)) {
      this.save.unlockedBlueprints.push(this.run.weaponId);
    }
    saveGame(this.save);
    const payload = {
      chipsCarried: this.run.chips,
      chipsCollected: this.run.chipsCollected,
      chipsRetained: retained,
      dungeonReached: this.run.dungeonIndex,
      roomsCleared: this.run.roomsCleared,
      enemiesDefeated: this.run.enemiesDefeated,
      bossesDefeated: this.run.bossesDefeated,
      weaponName: weaponById(this.run.weaponId).name,
      victory
    };
    endRun();
    this.scene.start(victory ? "VictoryScene" : "DeathScene", payload);
  }

  private togglePause(): void {
    if (this.paused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  private pauseGame(): void {
    this.paused = true;
    this.physics.world.isPaused = true;
    this.pauseMusic();
    this.hintText.setText("Paused");
    this.showPauseMenu();
  }

  private resumeGame(): void {
    this.paused = false;
    this.physics.world.isPaused = false;
    this.hidePauseMenu();
    this.hintText.setText("");
    this.resumeMusic();
  }

  private showPauseMenu(): void {
    this.hidePauseMenu();

    const shade = this.add.rectangle(512, 352, 1024, 704, 0x03060a, 0.58);
    const panel = this.add.rectangle(512, 352, 360, 236, 0x101721, 0.96).setStrokeStyle(2, 0x54d6ff, 0.7);
    const title = this.add
      .text(512, 274, "PAUSED", {
        fontFamily: "Arial Black",
        fontSize: "34px",
        color: "#e8f6ff"
      })
      .setOrigin(0.5, 0.5);
    const resumeButton = this.pauseButton(512, 344, "Resume", () => this.resumeGame());
    const menuButton = this.pauseButton(512, 406, "Exit to Main Menu", () => this.exitToMainMenu());

    this.pauseOverlay = this.add.container(0, 0, [shade, panel, title, resumeButton, menuButton]).setDepth(1000);
  }

  private hidePauseMenu(): void {
    this.pauseOverlay?.destroy(true);
    this.pauseOverlay = undefined;
  }

  private pauseButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 250, 46, 0x172536).setOrigin(0.5, 0.5).setStrokeStyle(2, 0x54d6ff, 0.65);
    const text = this.add.text(0, 0, label, { fontSize: "20px", color: "#e8f6ff" }).setOrigin(0.5, 0.5);
    bg.setInteractive({ useHandCursor: true })
      .on("pointerover", () => bg.setFillStyle(0x20344b))
      .on("pointerout", () => bg.setFillStyle(0x172536))
      .on("pointerdown", onClick);
    container.add([bg, text]);
    return container;
  }

  private exitToMainMenu(): void {
    this.stopAudio();
    this.hidePauseMenu();
    this.physics.world.isPaused = false;
    this.paused = false;
    endRun();
    this.scene.start("MainMenuScene");
  }

  private persistVisibleChips(room: RoomDefinition): void {
    if (!room.droppedChips?.length) {
      return;
    }

    const activePositions = new Map<string, { x: number; y: number }>();
    this.chips.getChildren().forEach((child) => {
      const chip = this.getArcadeImage(child);
      const chipId = chip?.getData("chipId") as string | undefined;
      if (chip && chip.active && chipId) {
        activePositions.set(chipId, { x: chip.x, y: chip.y });
      }
    });

    room.droppedChips.forEach((drop) => {
      const position = activePositions.get(drop.id);
      if (position) {
        drop.x = position.x;
        drop.y = position.y;
      }
    });
  }

  private updateHud(): void {
    const weapon = weaponById(this.run.weaponId);
    this.statusText.setText(
      `HP: ${Math.max(0, Math.ceil(this.run.hp))}/${this.run.maxHp}   Chips: ${this.run.chips}   Armor: ${this.run.armor}   Speed: ${this.playerMoveSpeed()}   Weapon: ${weapon.name}`
    );
  }

  private currentRoom(): RoomDefinition {
    return this.run.graph.rooms.find((room) => room.id === this.run.currentRoomId) ?? this.run.graph.rooms[0];
  }

  private roomLabel(room: RoomDefinition): string {
    const labels: Record<string, string> = {
      start: "Safe Entry",
      combat: "Patrol Zone",
      hazard: "Hazard Room",
      vendor: "Vendor Bay",
      loot: "Cache Room",
      boss: "Boss Gate"
    };
    return labels[room.type] ?? room.type;
  }
}
