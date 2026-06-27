import Phaser from "phaser";
import "./style.css";
import { BootScene } from "./scenes/BootScene";
import { DeathScene } from "./scenes/DeathScene";
import { GameScene } from "./scenes/GameScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { SettingsScene } from "./scenes/SettingsScene";
import { UpgradeScene } from "./scenes/UpgradeScene";
import { VendorScene } from "./scenes/VendorScene";
import { VictoryScene } from "./scenes/VictoryScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  backgroundColor: "#07090f",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 704
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  scene: [BootScene, MainMenuScene, SettingsScene, UpgradeScene, GameScene, VendorScene, DeathScene, VictoryScene]
};

new Phaser.Game(config);
