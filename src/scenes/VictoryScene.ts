import Phaser from "phaser";

interface EndPayload {
  chipsCarried: number;
  chipsCollected: number;
  chipsRetained: number;
  roomsCleared: number;
  enemiesDefeated: number;
  bossesDefeated: number;
  weaponName: string;
}

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super("VictoryScene");
  }

  create(payload: EndPayload): void {
    this.add.rectangle(512, 352, 1024, 704, 0x07100d);
    this.add.text(122, 112, "THE CITY IS BACK ONLINE", {
      fontFamily: "Arial Black",
      fontSize: "48px",
      color: "#63f7b4"
    });
    this.add.text(128, 206, "You broke the district AI chain and recovered enough code to rebuild.", {
      fontSize: "24px",
      color: "#e8f6ff",
      wordWrap: { width: 760 }
    });
    this.add.text(128, 292, `Microchips collected: ${payload.chipsCollected}`, { fontSize: "24px", color: "#e8f6ff" });
    this.add.text(128, 332, `Microchips carried: ${payload.chipsCarried}`, { fontSize: "24px", color: "#e8f6ff" });
    this.add.text(128, 372, `Retained for upgrades: ${payload.chipsRetained}`, { fontSize: "24px", color: "#63f7b4" });
    this.add.text(
      584,
      292,
      [
        `Rooms cleared: ${payload.roomsCleared}`,
        `Enemies defeated: ${payload.enemiesDefeated}`,
        `Bosses defeated: ${payload.bossesDefeated}`,
        `Weapon: ${payload.weaponName}`
      ],
      {
        fontSize: "22px",
        lineSpacing: 14,
        color: "#cfe8f5"
      }
    );
    this.button(128, 462, "New Run", () => this.scene.start("MainMenuScene"));
    this.button(128, 524, "Permanent Upgrades", () => this.scene.start("UpgradeScene"));
  }

  private button(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 292, 46, 0x172536).setOrigin(0, 0).setStrokeStyle(2, 0x54d6ff, 0.65);
    this.add.text(x + 18, y + 11, label, { fontSize: "20px", color: "#e8f6ff" });
    bg.setInteractive({ useHandCursor: true }).on("pointerdown", onClick);
  }
}
