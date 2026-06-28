import Phaser from "phaser";
import { metaUpgrades } from "../data";
import { centerFixedLayout } from "../layout";
import { loadSave, saveGame } from "../save";

export class UpgradeScene extends Phaser.Scene {
  constructor() {
    super("UpgradeScene");
  }

  create(): void {
    centerFixedLayout(this);
    const save = loadSave();
    this.add.rectangle(512, 352, 1024, 704, 0x080c13);
    this.add.text(74, 54, "Permanent Upgrades", {
      fontFamily: "Arial Black",
      fontSize: "42px",
      color: "#e8f6ff"
    });
    const chipText = this.add.text(76, 112, `Retained microchips: ${save.retainedChips}`, {
      fontSize: "22px",
      color: "#63f7b4"
    });

    metaUpgrades.forEach((upgrade, index) => {
      const y = 180 + index * 132;
      const level = save.metaUpgrades[upgrade.id] ?? 0;
      const cost = upgrade.baseCost * (level + 1);
      this.add.rectangle(512, y + 44, 876, 104, 0x111a25).setStrokeStyle(2, 0x2d4961, 1);
      this.add.text(100, y, `${upgrade.name} ${level}/${upgrade.maxLevel}`, {
        fontSize: "25px",
        color: "#ffd166"
      });
      this.add.text(100, y + 36, upgrade.description, {
        fontSize: "18px",
        color: "#cfe8f5"
      });
      const label = level >= upgrade.maxLevel ? "MAXED" : `Buy ${cost}`;
      const button = this.add.rectangle(782, y + 44, 160, 44, 0x172536).setStrokeStyle(2, 0x54d6ff, 0.7);
      const text = this.add.text(730, y + 31, label, { fontSize: "18px", color: "#e8f6ff" });
      if (level < upgrade.maxLevel) {
        button.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
          if (save.retainedChips >= cost) {
            save.retainedChips -= cost;
            save.metaUpgrades[upgrade.id] = level + 1;
            saveGame(save);
            chipText.setText(`Retained microchips: ${save.retainedChips}`);
            this.scene.restart();
          }
        });
      }
      button
        .on("pointerover", () => button.setFillStyle(0x20344b))
        .on("pointerout", () => button.setFillStyle(0x172536));
      text.setDepth(1);
    });

    this.button(76, 624, "Back to Menu", () => this.scene.start("MainMenuScene"));
    this.input.keyboard?.once("keydown-ESC", () => this.scene.start("MainMenuScene"));
    this.input.keyboard?.once("keydown-BACKSPACE", () => this.scene.start("MainMenuScene"));
  }

  private button(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 190, 46, 0x172536).setOrigin(0, 0).setStrokeStyle(2, 0x54d6ff, 0.65);
    this.add.text(x + 18, y + 11, label, { fontSize: "20px", color: "#e8f6ff" });
    bg.setInteractive({ useHandCursor: true })
      .on("pointerover", () => bg.setFillStyle(0x20344b))
      .on("pointerout", () => bg.setFillStyle(0x172536))
      .on("pointerdown", onClick);
  }
}
