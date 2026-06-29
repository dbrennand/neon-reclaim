import Phaser from "phaser";

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 704;

export function expandedViewport(scene: Phaser.Scene): Phaser.Geom.Rectangle {
  const width = scene.scale.gameSize.width;
  const height = scene.scale.gameSize.height;
  return new Phaser.Geom.Rectangle(scene.cameras.main.scrollX, scene.cameras.main.scrollY, width, height);
}

export function centerFixedLayout(scene: Phaser.Scene): void {
  const camera = scene.cameras.main;

  const updateCamera = (): void => {
    const width = scene.scale.gameSize.width;
    const height = scene.scale.gameSize.height;
    camera.setScroll((GAME_WIDTH - width) / 2, (GAME_HEIGHT - height) / 2);
  };

  updateCamera();
  scene.scale.on(Phaser.Scale.Events.RESIZE, updateCamera);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, updateCamera);
  });
}
