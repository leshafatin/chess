import { Square } from "chess.js";
import { isNaN, toNumber, parseInt } from "lodash";
import ChessPiece from "./Piece";
import * as C from "./shared/consts";
import { Piece } from "./types/enums";
import { ChessBoardSquare } from "./types/interfaces";

export default class ChessBoard extends Phaser.GameObjects.Container {
  private fen: string =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  private board: ChessBoardSquare[] = [];
  private blackColor = C.BLACK_SQUARE_COLOR;
  private whiteColor = C.WHITE_SQUARE_COLOR;
  private possibleMovementCircleColor = 0x0a3e5c;
  private possibleMovementCircleSize = 0.35;
  private possibleMovements: Phaser.GameObjects.Arc[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, startingFen?: string) {
    super(scene, x, y);

    const chessboardOffset = 133;
    const canvasWidth = scene.game.canvas.width;
    this.width = canvasWidth - chessboardOffset;
    this.height = canvasWidth - chessboardOffset;
    const squareSize = this.width / C.SQUARES_IN_WIDTH;
    let mutableSquareColorCounter = 1;
    const chessSquares: Phaser.GameObjects.GameObject[] = [];

    // BOARD CREATION
    for (let numberRow = 0; numberRow < C.SQUARES_IN_WIDTH; numberRow++) {
      for (
        let letterColumn = 0;
        letterColumn < C.SQUARES_IN_WIDTH;
        letterColumn++
      ) {
        mutableSquareColorCounter *= -1;
        const squareColor =
          mutableSquareColorCounter < 0 ? this.whiteColor : this.blackColor;
        const xCoord = letterColumn * squareSize;
        const yCoord = numberRow * squareSize;
        const rect = scene.add.rectangle(
          xCoord,
          yCoord,
          squareSize,
          squareSize,
          squareColor
        );
        rect.setOrigin(0, 0);
        scene.physics.world.enable(rect);
        this.board.push({
          positionName: `${C.chessColumns[letterColumn]}${
            C.SQUARES_IN_WIDTH - numberRow
          }` as Square,
          positionNumber: numberRow * C.SQUARES_IN_WIDTH + letterColumn + 1,
          rectangle: rect,
        });

        chessSquares.push(rect);
      }
      mutableSquareColorCounter *= -1;
    }

    this.add(chessSquares);
    scene.add.existing(this);

    // LOAD STARTING PIECES
    this.loadPositionFromFen(startingFen || this.fen);

    const newXposition = (scene.game.canvas.width - this.width) / 2;
    const newYposition = (scene.game.canvas.height - this.height) / 2;
    this.setPosition(newXposition, newYposition);
  }

  static getSquareNumberInBoard(square: string) {
    const positionNumber =
      (C.SQUARES_IN_WIDTH - parseInt(square[1])) * C.SQUARES_IN_WIDTH +
      (C.chessColumns.indexOf(square[0]) + 1);
    return positionNumber - 1;
  }

  getBoard() {
    return this.board;
  }

  getFen() {
    return this.fen;
  }

  setFen(fen: string) {
    this.fen = fen;
  }

  getPossibleMovements() {
    return this.possibleMovements;
  }

  addPossibleMovement(squareRect: Phaser.GameObjects.Rectangle) {
    const offsetPositionX =
      this.scene.game.canvas.width / 2 - this.width / 2 + squareRect.width / 2;
    const offsetPositionY =
      this.scene.game.canvas.height / 2 -
      this.height / 2 +
      squareRect.width / 2;

    const possibleMovementCircle = this.scene.add.circle(
      squareRect.x + offsetPositionX,
      squareRect.y + offsetPositionY,
      squareRect.width * 0.2,
      this.possibleMovementCircleColor,
      this.possibleMovementCircleSize
    );
    this.possibleMovements.push(possibleMovementCircle);
  }

  setPossibleMovements(possibleMovements: Phaser.GameObjects.Arc[]) {
    this.possibleMovements = possibleMovements;
  }

  destroyPossibleMovements() {
    this.possibleMovements.forEach((movement) => movement.destroy());
    this.possibleMovements = [];
  }

  loadPositionFromFen(fen: string) {
    const fenBoard = fen.split(" ").shift();

    if (!fenBoard) {
      return;
    }

    let mutableFile = 0;
    let mutableRank = 0;

    for (let i = 0; i < fenBoard.length; i++) {
      const symbol = fenBoard[i];

      if (symbol === "/") {
        mutableFile = 0;
        mutableRank++;
      } else {
        if (!isNaN(toNumber(symbol))) {
          mutableFile += toNumber(symbol);
        } else {
          const pieceColor =
            symbol === symbol.toUpperCase() ? Piece.White : Piece.Black;
          const pieceType = ChessPiece.pieceTypeFromSymbol(symbol);
          const SQUARES_IN_CHESS = 8;
          const chessBoardSquare =
            this.board[mutableRank * SQUARES_IN_CHESS + mutableFile];
          chessBoardSquare.piece = new ChessPiece(
            pieceColor | pieceType,
            chessBoardSquare.positionName,
            chessBoardSquare.rectangle,
            this.scene
          );
          this.add(chessBoardSquare.piece);
          mutableFile++;
        }
      }
    }
  }

  removePieceFromCurrentPosition(piece: ChessPiece) {
    const currentPositionName = piece.position! as string;

    const currentPositionNumber =
      (C.SQUARES_IN_WIDTH - parseInt(currentPositionName[1])) *
        C.SQUARES_IN_WIDTH +
      (C.chessColumns.indexOf(currentPositionName[0]) + 1);
    this.board[currentPositionNumber - 1].piece = undefined;
  }
}
