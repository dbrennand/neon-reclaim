import Phaser from "phaser";
import { bosses, enemies, weapons } from "../data";
import type { BossDefinition, EnemyBehavior } from "../types";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.createPlayerTexture();
    this.createSharedTextures();
    enemies.forEach((enemy) =>
      this.createRobotTexture(`enemy-${enemy.id}`, enemy.id, enemy.behavior, enemy.color, enemy.accent, enemy.radius)
    );
    bosses.forEach((boss) => this.createBossTexture(`boss-${boss.id}`, boss));
    weapons.forEach((weapon) => this.createProjectileTexture(`projectile-${weapon.id}`, weapon.id, weapon.color));
    this.scene.start("MainMenuScene");
  }

  private createPlayerTexture(): void {
    this.drawPlayerTexture("player", false);
    this.drawPlayerTexture("player-armored", true);
  }

  private drawPlayerTexture(key: string, armored: boolean): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Top-down human survivor: head, jacket, arms, legs, visor, and sidearm.
    graphics.fillStyle(0x0b1118, 0.75);
    graphics.fillEllipse(22, 27, 32, 38);

    graphics.fillStyle(0x6b4638, 1);
    graphics.fillCircle(22, 9, 7);
    graphics.fillStyle(0x18100d, 1);
    graphics.fillEllipse(22, 5, 15, 8);
    graphics.fillRoundedRect(15, 5, 14, 5, 2);

    graphics.fillStyle(0x1f6f8b, 1);
    graphics.fillRoundedRect(12, 16, 20, 20, 5);
    graphics.fillStyle(0x142331, 1);
    graphics.fillRoundedRect(15, 18, 14, 17, 4);
    graphics.lineStyle(2, 0x54d6ff, 1);
    graphics.lineBetween(22, 17, 22, 33);

    graphics.fillStyle(0x6b4638, 1);
    graphics.fillRoundedRect(6, 18, 7, 18, 3);
    graphics.fillRoundedRect(31, 18, 7, 18, 3);

    graphics.fillStyle(0x202b36, 1);
    graphics.fillRoundedRect(14, 35, 8, 11, 3);
    graphics.fillRoundedRect(23, 35, 8, 11, 3);

    graphics.fillStyle(0x54d6ff, 1);
    graphics.fillRect(17, 7, 10, 2);
    graphics.fillStyle(0xe8f6ff, 1);
    graphics.fillRoundedRect(32, 14, 9, 4, 2);
    graphics.fillStyle(0x54d6ff, 1);
    graphics.fillCircle(41, 16, 2);

    if (armored) {
      graphics.fillStyle(0xd8edf7, 0.96);
      graphics.fillRoundedRect(10, 15, 24, 8, 3);
      graphics.fillRoundedRect(11, 23, 22, 13, 4);
      graphics.fillStyle(0x465867, 1);
      graphics.fillRoundedRect(14, 18, 16, 4, 2);
      graphics.fillRoundedRect(15, 25, 14, 8, 2);
      graphics.lineStyle(2, 0xffd166, 0.9);
      graphics.lineBetween(22, 16, 22, 36);
      graphics.fillStyle(0xd8edf7, 0.92);
      graphics.fillRoundedRect(4, 17, 9, 11, 3);
      graphics.fillRoundedRect(31, 17, 9, 11, 3);
      graphics.fillRoundedRect(13, 34, 10, 5, 2);
      graphics.fillRoundedRect(22, 34, 10, 5, 2);
      graphics.fillStyle(0xffd166, 1);
      graphics.fillCircle(12, 19, 2);
      graphics.fillCircle(32, 19, 2);
    }

    graphics.generateTexture(key, 44, 48);
    graphics.destroy();
  }

  private createRobotTexture(
    key: string,
    enemyId: string,
    behavior: EnemyBehavior,
    color: number,
    accent: number,
    radius: number
  ): void {
    const size = Math.max(46, radius * 2 + 20);
    const center = size / 2;
    const graphics = this.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0x090d12, 0.75);
    graphics.fillEllipse(center, center + 8, radius * 1.9, radius * 2.5);

    graphics.fillStyle(0x202833, 1);
    graphics.fillRoundedRect(center - radius * 0.9, center - radius * 0.25, radius * 1.8, radius * 1.5, 5);
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(center - radius * 0.65, center - radius * 0.05, radius * 1.3, radius * 1.05, 4);

    graphics.fillStyle(0x18202a, 1);
    graphics.fillRoundedRect(center - radius * 0.55, center - radius * 1.1, radius * 1.1, radius * 0.78, 4);
    graphics.fillStyle(0x090c11, 1);
    graphics.fillRoundedRect(center - radius * 0.42, center - radius * 0.88, radius * 0.84, radius * 0.24, 2);
    graphics.fillStyle(accent, 1);
    graphics.fillCircle(center - radius * 0.24, center - radius * 0.76, 2);
    graphics.fillCircle(center + radius * 0.24, center - radius * 0.76, 2);

    graphics.fillStyle(0x28313d, 1);
    graphics.fillRoundedRect(center - radius * 1.25, center, radius * 0.36, radius * 1.4, 4);
    graphics.fillRoundedRect(center + radius * 0.9, center, radius * 0.36, radius * 1.4, 4);
    graphics.fillRoundedRect(center - radius * 0.62, center + radius * 1.05, radius * 0.42, radius * 0.95, 4);
    graphics.fillRoundedRect(center + radius * 0.2, center + radius * 1.05, radius * 0.42, radius * 0.95, 4);

    graphics.fillStyle(accent, 0.9);
    graphics.fillRoundedRect(center + radius * 1.08, center + radius * 0.26, radius * 0.72, radius * 0.22, 2);
    graphics.lineStyle(2, accent, 1);
    graphics.strokeRoundedRect(center - radius * 0.7, center - radius * 1.15, radius * 1.4, radius * 2.15, 6);
    this.addRobotVariantDetails(graphics, enemyId, behavior, center, radius, color, accent);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private addRobotVariantDetails(
    graphics: Phaser.GameObjects.Graphics,
    enemyId: string,
    behavior: EnemyBehavior,
    center: number,
    radius: number,
    color: number,
    accent: number
  ): void {
    switch (behavior) {
      case "swarm":
        graphics.fillStyle(accent, 0.95);
        graphics.fillTriangle(
          center,
          center - radius * 1.42,
          center - radius * 0.38,
          center - radius,
          center + radius * 0.38,
          center - radius
        );
        graphics.lineStyle(2, accent, 0.9);
        graphics.lineBetween(
          center - radius * 1.4,
          center + radius * 0.24,
          center - radius * 1.9,
          center + radius * 0.75
        );
        graphics.lineBetween(
          center + radius * 1.4,
          center + radius * 0.24,
          center + radius * 1.9,
          center + radius * 0.75
        );
        break;
      case "shield":
        graphics.fillStyle(0xdcecff, 0.92);
        graphics.fillRoundedRect(center - radius * 1.75, center - radius * 0.35, radius * 0.62, radius * 1.8, 4);
        graphics.fillRoundedRect(center + radius * 1.13, center - radius * 0.35, radius * 0.62, radius * 1.8, 4);
        graphics.lineStyle(2, accent, 0.9);
        graphics.strokeRoundedRect(center - radius * 1.72, center - radius * 0.31, radius * 0.56, radius * 1.68, 4);
        graphics.strokeRoundedRect(center + radius * 1.16, center - radius * 0.31, radius * 0.56, radius * 1.68, 4);
        break;
      case "sniper":
        graphics.fillStyle(accent, 1);
        graphics.fillCircle(center, center - radius * 0.76, radius * 0.2);
        graphics.fillStyle(color, 0.95);
        graphics.fillRoundedRect(center + radius * 0.58, center - radius * 0.15, radius * 1.55, radius * 0.24, 2);
        graphics.fillStyle(0xffffff, 0.95);
        graphics.fillRoundedRect(center + radius * 1.42, center - radius * 0.09, radius * 0.64, radius * 0.11, 1);
        break;
      case "mineLayer":
        graphics.fillStyle(0x111820, 1);
        graphics.fillCircle(center - radius * 0.45, center + radius * 0.95, radius * 0.32);
        graphics.fillCircle(center + radius * 0.45, center + radius * 0.95, radius * 0.32);
        graphics.fillStyle(accent, 0.95);
        graphics.fillCircle(center - radius * 0.45, center + radius * 0.95, radius * 0.15);
        graphics.fillCircle(center + radius * 0.45, center + radius * 0.95, radius * 0.15);
        break;
      case "support":
        graphics.lineStyle(3, accent, 0.9);
        graphics.strokeCircle(center, center - radius * 1.1, radius * 0.56);
        graphics.fillStyle(accent, 1);
        graphics.fillRoundedRect(center - radius * 0.12, center - radius * 0.07, radius * 0.24, radius * 0.78, 1);
        graphics.fillRoundedRect(center - radius * 0.39, center + radius * 0.2, radius * 0.78, radius * 0.24, 1);
        break;
      case "hacker":
        graphics.fillStyle(accent, 0.32);
        graphics.fillEllipse(center, center + radius * 0.3, radius * 2.25, radius * 2.55);
        graphics.lineStyle(2, accent, 1);
        graphics.lineBetween(
          center - radius * 0.46,
          center - radius * 1.05,
          center - radius * 0.9,
          center - radius * 1.55
        );
        graphics.lineBetween(
          center + radius * 0.46,
          center - radius * 1.05,
          center + radius * 0.9,
          center - radius * 1.55
        );
        graphics.fillStyle(0xffffff, 0.9);
        graphics.fillRect(center - radius * 0.5, center + radius * 0.48, radius, 2);
        break;
      case "boss":
        break;
    }

    const idMarker = enemyId.charCodeAt(0) + enemyId.charCodeAt(enemyId.length - 1);
    const markerCount = (idMarker % 3) + 1;
    graphics.fillStyle(accent, 0.95);
    for (let marker = 0; marker < markerCount; marker += 1) {
      graphics.fillCircle(center - radius * 0.34 + marker * radius * 0.34, center + radius * 0.18, 2);
    }
  }

  private createBossTexture(key: string, boss: BossDefinition): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x080a0f, 0.92);
    graphics.fillEllipse(40, 50, 70, 52);
    graphics.fillStyle(0x101018, 1);
    graphics.fillRoundedRect(3, 7, 74, 66, 10);
    graphics.fillStyle(boss.color, 1);
    graphics.fillRoundedRect(9, 13, 62, 54, 8);
    graphics.fillStyle(0x080a0f, 1);
    graphics.fillRect(20, 28, 40, 12);
    graphics.fillStyle(boss.accent, 1);
    graphics.fillCircle(30, 34, 4);
    graphics.fillCircle(50, 34, 4);
    graphics.lineStyle(3, boss.accent, 1);
    graphics.strokeRoundedRect(7, 11, 66, 58, 10);
    this.addBossVariantDetails(graphics, boss);
    graphics.generateTexture(key, 80, 80);
    graphics.destroy();
  }

  private addBossVariantDetails(graphics: Phaser.GameObjects.Graphics, boss: BossDefinition): void {
    switch (boss.id) {
      case "traffic-king":
        graphics.fillStyle(0x151922, 1);
        graphics.fillRoundedRect(31, 3, 18, 70, 8);
        [0xff4d6d, 0xffd166, 0x63f7b4].forEach((light, index) => {
          graphics.fillStyle(light, 1);
          graphics.fillCircle(40, 17 + index * 18, 5);
        });
        graphics.lineStyle(3, boss.accent, 0.9);
        graphics.lineBetween(14, 20, 3, 9);
        graphics.lineBetween(66, 20, 77, 9);
        break;
      case "retail-warden":
        graphics.fillStyle(0x0d1520, 1);
        graphics.fillRoundedRect(14, 12, 52, 16, 4);
        graphics.fillStyle(0xffffff, 0.92);
        for (let x = 20; x <= 58; x += 7) {
          graphics.fillRect(x, 15, 3, 10);
        }
        graphics.fillStyle(boss.accent, 0.95);
        graphics.fillTriangle(10, 10, 70, 10, 40, 0);
        graphics.lineStyle(4, boss.accent, 0.86);
        graphics.lineBetween(18, 60, 62, 60);
        break;
      case "core-seraph":
        graphics.lineStyle(4, boss.accent, 0.9);
        graphics.strokeCircle(40, 12, 13);
        graphics.fillStyle(boss.accent, 0.34);
        graphics.fillTriangle(9, 18, 30, 42, 4, 62);
        graphics.fillTriangle(71, 18, 50, 42, 76, 62);
        graphics.fillStyle(0xffffff, 0.86);
        graphics.fillCircle(40, 34, 7);
        graphics.fillStyle(boss.color, 0.8);
        graphics.fillCircle(40, 34, 3);
        break;
      default:
        break;
    }
  }

  private createProjectileTexture(key: string, weaponId: string, color: number): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    switch (weaponId) {
      case "rail-rifle":
        graphics.fillStyle(color, 0.22);
        graphics.fillRoundedRect(0, 4, 58, 8, 4);
        graphics.fillStyle(color, 1);
        graphics.fillRoundedRect(6, 6, 47, 4, 2);
        graphics.fillStyle(0xffffff, 0.95);
        graphics.fillRoundedRect(19, 7, 32, 2, 1);
        graphics.fillStyle(color, 0.72);
        graphics.fillTriangle(57, 8, 45, 0, 45, 16);
        graphics.fillTriangle(12, 8, 2, 2, 2, 14);
        graphics.generateTexture(key, 60, 16);
        break;
      case "scatter-coil":
        graphics.fillStyle(color, 0.26);
        graphics.fillCircle(11, 11, 10);
        graphics.fillStyle(color, 0.95);
        graphics.fillCircle(11, 11, 5);
        graphics.lineStyle(2, 0xffffff, 0.8);
        graphics.strokeCircle(11, 11, 8);
        graphics.lineStyle(2, color, 0.75);
        graphics.lineBetween(3, 11, 19, 11);
        graphics.lineBetween(11, 3, 11, 19);
        graphics.generateTexture(key, 22, 22);
        break;
      case "arc-lancer":
        graphics.lineStyle(7, color, 0.26);
        graphics.lineBetween(1, 12, 14, 6);
        graphics.lineBetween(14, 6, 24, 15);
        graphics.lineBetween(24, 15, 36, 5);
        graphics.lineBetween(36, 5, 50, 12);
        graphics.lineStyle(3, color, 1);
        graphics.lineBetween(2, 12, 15, 7);
        graphics.lineBetween(15, 7, 24, 15);
        graphics.lineBetween(24, 15, 36, 6);
        graphics.lineBetween(36, 6, 49, 12);
        graphics.fillStyle(0xffffff, 0.9);
        graphics.fillCircle(15, 7, 2);
        graphics.fillCircle(36, 6, 2);
        graphics.fillStyle(color, 0.78);
        graphics.fillTriangle(51, 12, 42, 5, 42, 19);
        graphics.generateTexture(key, 54, 24);
        break;
      case "pulse-pistol":
      default:
        graphics.fillStyle(color, 0.28);
        graphics.fillRoundedRect(0, 6, 34, 8, 4);
        graphics.fillStyle(color, 1);
        graphics.fillRoundedRect(7, 8, 25, 4, 2);
        graphics.fillStyle(0xffffff, 0.9);
        graphics.fillRoundedRect(18, 9, 13, 2, 1);
        graphics.fillStyle(color, 0.85);
        graphics.fillTriangle(34, 10, 24, 2, 24, 18);
        graphics.generateTexture(key, 38, 20);
        break;
    }

    graphics.destroy();
  }

  private createSharedTextures(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x63f7b4, 1);
    graphics.fillRoundedRect(3, 5, 18, 14, 3);
    graphics.fillStyle(0x15241e, 1);
    graphics.fillRect(7, 9, 10, 2);
    graphics.fillRect(7, 13, 10, 2);
    graphics.generateTexture("chip", 24, 24);
    graphics.clear();

    graphics.fillStyle(0x0b1118, 0.95);
    graphics.fillRoundedRect(4, 12, 48, 38, 5);
    graphics.fillStyle(0x1b2635, 1);
    graphics.fillRoundedRect(8, 16, 40, 30, 4);
    graphics.fillStyle(0xffd166, 1);
    graphics.fillRoundedRect(13, 7, 30, 16, 4);
    graphics.fillStyle(0x111722, 1);
    graphics.fillRoundedRect(16, 11, 24, 8, 2);
    graphics.fillStyle(0x54d6ff, 1);
    graphics.fillCircle(23, 15, 2);
    graphics.fillCircle(33, 15, 2);
    graphics.fillStyle(0x2f3b49, 1);
    graphics.fillRoundedRect(0, 26, 8, 16, 3);
    graphics.fillRoundedRect(48, 26, 8, 16, 3);
    graphics.fillStyle(0x54d6ff, 1);
    graphics.fillCircle(18, 42, 4);
    graphics.fillCircle(38, 42, 4);
    graphics.lineStyle(2, 0xe8f6ff, 1);
    graphics.strokeRoundedRect(5, 13, 46, 36, 5);
    graphics.generateTexture("vendor", 56, 62);
    graphics.clear();

    graphics.fillStyle(0xff4d6d, 1);
    graphics.fillCircle(14, 14, 11);
    graphics.fillStyle(0xffd166, 1);
    graphics.fillCircle(14, 14, 4);
    graphics.generateTexture("mine", 28, 28);
    graphics.clear();

    graphics.fillStyle(0xff4d6d, 0.28);
    graphics.fillRoundedRect(0, 6, 32, 8, 4);
    graphics.fillStyle(0xff4d6d, 1);
    graphics.fillRoundedRect(6, 8, 23, 4, 2);
    graphics.fillStyle(0xffd166, 0.95);
    graphics.fillRoundedRect(15, 9, 12, 2, 1);
    graphics.fillStyle(0xff4d6d, 0.9);
    graphics.fillTriangle(35, 10, 25, 2, 25, 18);
    graphics.generateTexture("enemy-projectile", 38, 20);
    graphics.destroy();
  }
}
