import Phaser from "phaser";
import { dungeons, itemById, vendorInventories } from "../data";
import { centerFixedLayout, expandedViewport } from "../layout";
import { currentRun } from "../state";

export class VendorScene extends Phaser.Scene {
  constructor() {
    super("VendorScene");
  }

  create(): void {
    centerFixedLayout(this);
    const run = currentRun;
    if (!run) {
      this.scene.stop();
      return;
    }

    const dungeon = dungeons[run.dungeonIndex];
    const inventory = vendorInventories.find((entry) => entry.dungeonId === dungeon.id)?.items ?? [];
    const viewport = expandedViewport(this);
    const shade = this.add
      .rectangle(viewport.centerX, viewport.centerY, viewport.width, viewport.height, 0x03060a, 0.72)
      .setInteractive();
    const panel = this.add.rectangle(512, 352, 760, 520, 0x101721, 0.98).setStrokeStyle(2, 0xffd166, 0.8);
    this.add.text(176, 126, "Field Vendor", {
      fontFamily: "Arial Black",
      fontSize: "36px",
      color: "#ffd166"
    });
    const chipsText = this.add.text(178, 174, `Microchips: ${run.chips}`, { fontSize: "20px", color: "#63f7b4" });
    const feedbackText = this.add.text(178, 200, "", { fontSize: "17px", color: "#ff5f73" });
    let feedbackTween: Phaser.Tweens.Tween | undefined;

    const returnToDungeon = (): void => {
      shade.destroy();
      panel.destroy();
      this.scene.stop();
      this.scene.resume("GameScene");
    };

    const showInsufficientFunds = (
      row: Phaser.GameObjects.Rectangle,
      button: Phaser.GameObjects.Rectangle,
      missingChips: number
    ): void => {
      feedbackTween?.stop();
      feedbackText.setAlpha(1).setText(`Not enough microchips. Need ${missingChips} more.`);
      feedbackTween = this.tweens.add({
        targets: feedbackText,
        alpha: 0.35,
        duration: 90,
        yoyo: true,
        repeat: 2,
        onComplete: () => feedbackText.setAlpha(1)
      });
      row.setStrokeStyle(2, 0xff5f73, 1);
      button.setFillStyle(0x5a2130);
      button.setStrokeStyle(2, 0xff5f73, 1);
      this.time.delayedCall(320, () => {
        row.setStrokeStyle(1, 0x2d4961, 1);
        button.setFillStyle(0x20344b);
        button.setStrokeStyle(1, 0x54d6ff, 0.7);
      });
    };

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
          if (run.chips < item.price) {
            showInsufficientFunds(row, button, item.price - run.chips);
            return;
          }
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

    this.button(176, 570, "Return to Dungeon", returnToDungeon);
    this.input.keyboard?.once("keydown-ESC", returnToDungeon);
  }

  private button(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 220, 42, 0x172536).setOrigin(0, 0).setStrokeStyle(2, 0xffd166, 0.7);
    this.add.text(x + 16, y + 10, label, { fontSize: "18px", color: "#e8f6ff" });
    bg.setInteractive({ useHandCursor: true })
      .on("pointerover", () => bg.setFillStyle(0x20344b))
      .on("pointerout", () => bg.setFillStyle(0x172536))
      .on("pointerdown", onClick);
  }
}
