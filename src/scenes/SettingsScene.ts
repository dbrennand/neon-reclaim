import Phaser from "phaser";
import { loadSave, resetSave, saveGame } from "../save";
import { setCurrentSave } from "../state";

export class SettingsScene extends Phaser.Scene {
  private confirmingReset = false;

  constructor() {
    super("SettingsScene");
  }

  create(): void {
    const save = loadSave();
    setCurrentSave(save);
    this.sound.mute = save.muted;

    this.add.rectangle(512, 352, 1024, 704, 0x07090f);
    this.add.rectangle(512, 352, 900, 560, 0x101721, 0.94).setStrokeStyle(2, 0x54d6ff, 0.5);
    this.add.text(92, 84, "SETTINGS", {
      fontFamily: "Arial Black",
      fontSize: "52px",
      color: "#e8f6ff"
    });

    this.add.text(96, 164, "Controls", { fontSize: "26px", color: "#ffd166" });
    [
      ["W, A, S, D", "Move"],
      ["Mouse click", "Aim and fire"],
      ["Space", "Dodge"],
      ["E", "Interact"],
      ["P", "Pause"],
      ["M", "Mute or unmute audio"],
      ["Esc / Backspace", "Leave screens"]
    ].forEach(([input, action], index) => {
      const y = 210 + index * 34;
      this.add.text(98, y, input, {
        fontSize: "19px",
        color: "#e8f6ff",
        fixedWidth: 210
      });
      this.add.text(318, y, action, {
        fontSize: "19px",
        color: "#e8f6ff",
        fixedWidth: 230
      });
    });

    this.button(610, 208, save.muted ? "Unmute Audio" : "Mute Audio", () => {
      save.muted = !save.muted;
      saveGame(save);
      this.sound.mute = save.muted;
      this.confirmingReset = false;
      this.scene.restart();
    });

    this.button(610, 270, "Back to Menu", () => this.scene.start("MainMenuScene"));

    if (this.confirmingReset) {
      this.add.text(610, 350, "Reset all retained chips, upgrades, and run history?", {
        fontSize: "18px",
        color: "#ff8fab",
        fixedWidth: 320,
        wordWrap: { width: 320 }
      });
      this.button(610, 420, "Confirm Reset", () => {
        const nextSave = resetSave();
        setCurrentSave(nextSave);
        this.sound.mute = nextSave.muted;
        this.confirmingReset = false;
        this.scene.restart();
      });
      this.button(610, 482, "Cancel Reset", () => {
        this.confirmingReset = false;
        this.scene.restart();
      });
    } else {
      this.button(610, 394, "Reset Save", () => {
        this.confirmingReset = true;
        this.scene.restart();
      });
    }

    this.input.keyboard?.once("keydown-ESC", () => this.scene.start("MainMenuScene"));
    this.input.keyboard?.once("keydown-BACKSPACE", () => this.scene.start("MainMenuScene"));
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
