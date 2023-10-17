import { SceneKeys } from "../game/types/enums";

export default class Preloader extends Phaser.Scene {
  preload() {
    this.load.atlas(
      "chess-pieces-atlas",
      "assets/chess-pieces/chess-pieces-atlas.png",
      "assets/chess-pieces/chess-pieces-atlas.json"
    );
  }

  create() {
    this.scene.start(SceneKeys.MainBoard);
  }
}
