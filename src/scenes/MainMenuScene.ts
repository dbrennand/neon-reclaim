import Phaser from "phaser";
import { loadSave, resetSave, saveGame } from "../save";
import { setCurrentSave, startNewRun } from "../state";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  create(): void {
    const save = loadSave();
    setCurrentSave(save);
    this.sound.mute = save.muted;

    this.add.rectangle(512, 352, 1024, 704, 0x07090f);
    this.add.rectangle(512, 352, 900, 560, 0x101721, 0.92).setStrokeStyle(2, 0x54d6ff, 0.5);
    this.add.text(92, 86, "NEON RECLAIM", {
      fontFamily: "Arial Black",
      fontSize: "58px",
      color: "#e8f6ff"
    });
    this.add.text(96, 156, "A top-down roguelite about taking cities back from machine rule.", {
      fontSize: "21px",
      color: "#9fb8c9"
    });
    this.add.text(96, 218, `Retained microchips: ${save.retainedChips}`, {
      fontSize: "22px",
      color: "#63f7b4"
    });
    this.add.text(96, 252, `Runs: ${save.totalRuns}    Best district: ${save.bestDungeonReached + 1}/3`, {
      fontSize: "18px",
      color: "#cfe8f5"
    });

    this.button(96, 330, "Start Run", () => {
      startNewRun(save);
      saveGame(save);
      this.scene.start("GameScene");
    });
    this.button(96, 392, "Permanent Upgrades", () => this.scene.start("UpgradeScene"));
    this.button(96, 454, save.muted ? "Unmute Audio" : "Mute Audio", () => {
      save.muted = !save.muted;
      saveGame(save);
      this.scene.restart();
    });
    this.button(96, 516, "Reset Save", () => {
      resetSave();
      this.scene.restart();
    });

    this.add.text(610, 278, "Controls", { fontSize: "24px", color: "#ffd166" });
    this.add.text(610, 322, "WASD move\nMouse aim and fire\nSpace dodge\nE interact\nP pause\nM mute", {
      fontSize: "20px",
      lineSpacing: 12,
      color: "#e8f6ff"
    });
  }

  private button(x: number, y: number, label: string, onClick: () => void): void {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 292, 46, 0x172536).setOrigin(0, 0).setStrokeStyle(2, 0x54d6ff, 0.65);
    const text = this.add.text(18, 11, label, { fontSize: "20px", color: "#e8f6ff" });
    bg.setInteractive({ useHandCursor: true })
      .on("pointerover", () => bg.setFillStyle(0x20344b))
      .on("pointerout", () => bg.setFillStyle(0x172536))
      .on("pointerdown", onClick);
    container.add([bg, text]);
  }
}
