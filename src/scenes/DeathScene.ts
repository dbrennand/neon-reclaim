import Phaser from "phaser";

interface EndPayload {
  chipsCollected: number;
  chipsRetained: number;
  dungeonReached: number;
}

export class DeathScene extends Phaser.Scene {
  constructor() {
    super("DeathScene");
  }

  create(payload: EndPayload): void {
    this.add.rectangle(512, 352, 1024, 704, 0x07090f);
    this.add.text(154, 118, "RUN TERMINATED", {
      fontFamily: "Arial Black",
      fontSize: "54px",
      color: "#ff4d6d"
    });
    this.add.text(158, 206, `District reached: ${payload.dungeonReached + 1}/3`, {
      fontSize: "24px",
      color: "#e8f6ff"
    });
    this.add.text(158, 246, `Microchips collected: ${payload.chipsCollected}`, { fontSize: "24px", color: "#e8f6ff" });
    this.add.text(158, 286, `Retained for upgrades: ${payload.chipsRetained}`, { fontSize: "24px", color: "#63f7b4" });
    this.button(158, 376, "Try Again", () => this.scene.start("MainMenuScene"));
    this.button(158, 438, "Permanent Upgrades", () => this.scene.start("UpgradeScene"));
  }

  private button(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 292, 46, 0x172536).setOrigin(0, 0).setStrokeStyle(2, 0x54d6ff, 0.65);
    this.add.text(x + 18, y + 11, label, { fontSize: "20px", color: "#e8f6ff" });
    bg.setInteractive({ useHandCursor: true }).on("pointerdown", onClick);
  }
}
