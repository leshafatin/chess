import Phaser from "phaser";
import { GAME_BG_COLOR } from "./game/shared/consts";
import MainBoardScene from "./scenes/MainBoard";
import Preloader from "./scenes/Preloader";
import { SceneKeys } from "./game/types/enums";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 700,
  height: 700,
  backgroundColor: GAME_BG_COLOR,
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 0,
      },
    },
  },
};

export const chessGame = new Phaser.Game(config);

chessGame.scene.add(SceneKeys.Preloader, Preloader);
chessGame.scene.add(SceneKeys.MainBoard, MainBoardScene);

chessGame.scene.start(SceneKeys.Preloader);
