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

const syncViewportSize = (): void => {
  const viewport = window.visualViewport;
  const width = viewport?.width ?? window.innerWidth;
  const height = viewport?.height ?? window.innerHeight;

  document.documentElement.style.setProperty("--app-width", `${width}px`);
  document.documentElement.style.setProperty("--app-height", `${height}px`);
};

syncViewportSize();
window.addEventListener("resize", syncViewportSize);
window.addEventListener("orientationchange", () => window.setTimeout(syncViewportSize, 250));
window.visualViewport?.addEventListener("resize", syncViewportSize);
window.visualViewport?.addEventListener("scroll", syncViewportSize);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  backgroundColor: "#07090f",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 704
  },
  input: {
    activePointers: 4,
    touch: {
      capture: true
    }
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
