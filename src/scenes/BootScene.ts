import Phaser from "phaser";
import { bosses, enemies, weapons } from "../data";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.createPlayerTexture();
    this.createSharedTextures();
    enemies.forEach((enemy) => this.createRobotTexture(`enemy-${enemy.id}`, enemy.color, enemy.accent, enemy.radius));
    bosses.forEach((boss) => this.createBossTexture(`boss-${boss.id}`, boss.color, boss.accent));
    weapons.forEach((weapon) => this.createProjectileTexture(`projectile-${weapon.id}`, weapon.color));
    this.scene.start("MainMenuScene");
  }

  private createPlayerTexture(): void {
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

    graphics.generateTexture("player", 44, 48);
    graphics.destroy();
  }

  private createRobotTexture(key: string, color: number, accent: number, radius: number): void {
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
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private createBossTexture(key: string, color: number, accent: number): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x101018, 1);
    graphics.fillRoundedRect(3, 7, 74, 66, 10);
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(9, 13, 62, 54, 8);
    graphics.fillStyle(0x080a0f, 1);
    graphics.fillRect(20, 28, 40, 12);
    graphics.fillStyle(accent, 1);
    graphics.fillCircle(30, 34, 4);
    graphics.fillCircle(50, 34, 4);
    graphics.lineStyle(3, accent, 1);
    graphics.strokeRoundedRect(7, 11, 66, 58, 10);
    graphics.generateTexture(key, 80, 80);
    graphics.destroy();
  }

  private createProjectileTexture(key: string, color: number): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(color, 0.28);
    graphics.fillRoundedRect(0, 6, 34, 8, 4);
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(7, 8, 25, 4, 2);
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillRoundedRect(18, 9, 13, 2, 1);
    graphics.fillStyle(color, 0.85);
    graphics.fillTriangle(34, 10, 24, 2, 24, 18);
    graphics.generateTexture(key, 38, 20);
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
