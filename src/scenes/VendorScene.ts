import Phaser from "phaser";
import { dungeons, itemById, vendorInventories } from "../data";
import { currentRun } from "../state";

export class VendorScene extends Phaser.Scene {
  constructor() {
    super("VendorScene");
  }

  create(): void {
    const run = currentRun;
    if (!run) {
      this.scene.stop();
      return;
    }

    const dungeon = dungeons[run.dungeonIndex];
    const inventory = vendorInventories.find((entry) => entry.dungeonId === dungeon.id)?.items ?? [];
    const shade = this.add.rectangle(512, 352, 1024, 704, 0x03060a, 0.72);
    const panel = this.add.rectangle(512, 352, 760, 520, 0x101721, 0.98).setStrokeStyle(2, 0xffd166, 0.8);
    this.add.text(176, 126, "Field Vendor", {
      fontFamily: "Arial Black",
      fontSize: "36px",
      color: "#ffd166"
    });
    const chipsText = this.add.text(178, 174, `Microchips: ${run.chips}`, { fontSize: "20px", color: "#63f7b4" });
    this.add.text(176, 588, "Esc: return to dungeon", { fontSize: "17px", color: "#9fb8c9" });

    inventory.forEach((id, index) => {
      const item = itemById(id);
      if (!item) return;
      const y = 228 + index * 64;
      const purchased = run.purchasedItemIds.includes(item.id) && item.kind !== "repair";
      const row = this.add
        .rectangle(512, y + 20, 650, 54, purchased ? 0x141b24 : 0x172536)
        .setStrokeStyle(1, purchased ? 0x343a40 : 0x2d4961, 1);
      this.add.text(206, y, item.name, { fontSize: "20px", color: "#e8f6ff" });
      this.add.text(206, y + 25, item.description, { fontSize: "15px", color: "#9fb8c9" });
      const button = this.add
        .rectangle(746, y + 20, 118, 36, purchased ? 0x343a40 : 0x20344b)
        .setStrokeStyle(1, 0x54d6ff, 0.7);
      const label = purchased ? "Owned" : `${item.price}`;
      this.add.text(718, y + 9, label, { fontSize: "17px", color: "#e8f6ff" });
      if (!purchased) {
        const buyItem = (): void => {
          if (run.chips < item.price) return;
          run.chips -= item.price;
          if (item.kind !== "repair") {
            run.purchasedItemIds.push(item.id);
          }
          if (item.effect === "heal") run.hp = Math.min(run.maxHp, run.hp + item.amount);
          if (item.effect === "armor") run.armor += item.amount;
          if (item.effect === "damage") run.damageBonus += item.amount;
          if (item.effect === "speed") run.speedBonus += item.amount;
          if (item.effect === "weapon" && item.weaponId) run.weaponId = item.weaponId;
          chipsText.setText(`Microchips: ${run.chips}`);
          this.scene.restart();
        };

        row
          .setInteractive({ useHandCursor: true })
          .on("pointerover", () => {
            row.setFillStyle(0x20344b);
            button.setFillStyle(0x2a4967);
          })
          .on("pointerout", () => {
            row.setFillStyle(0x172536);
            button.setFillStyle(0x20344b);
          })
          .on("pointerdown", buyItem);
        button.setInteractive({ useHandCursor: true }).on("pointerdown", buyItem);
      }
    });

    this.input.keyboard?.once("keydown-ESC", () => {
      shade.destroy();
      panel.destroy();
      this.scene.stop();
      this.scene.resume("GameScene");
    });
  }
}
