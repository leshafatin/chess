import { Chess, ChessInstance, Square } from "chess.js";
import ChessBoard from "../game/ChessBoard";
import {
  PromotionOptionSelected,
  PromotionParams,
} from "../game/types/interfaces";
import ChessPiece from "../game/Piece";
import * as C from "../game/shared/consts";
import { SceneKeys } from "../game/types/enums";

export default class MainBoardScene extends Phaser.Scene {
  private chessBoard!: ChessBoard;
  private chessGame: ChessInstance = new Chess();

  private originSquareColor!: number;

  preload() {}

  create() {
    this.chessBoard = new ChessBoard(this, 0, 0);
    this.chessGame = new Chess(this.chessBoard.getFen());

    this.input.dragDistanceThreshold = 16;

    this.input.on("dragstart", this.startDrag, this);
    this.input.on("drag", this.doDrag, this);
    this.input.on("dragend", this.stopDrag, this);

    this.input.on("dragenter", this.onPieceDragEnter, this);
    this.input.on("dragleave", this.onPieceDragLeave, this);
    this.input.on("drop", this.onPieceDrop, this);

    this.events.on("resume", this.finishPromotionMove, this);
  }

  update() {}

  startDrag(_pointer: Phaser.Input.Pointer, dragablePiece: ChessPiece) {
    this.children.bringToTop(dragablePiece);
    const moves = this.chessGame.moves({
      square: dragablePiece.position,
      verbose: true,
    });
    const possibleMoves: Set<Square> = new Set();
    moves.map((move) => possibleMoves.add(move.to));
    const currentBoard = this.chessBoard.getBoard();

    const positionNumber = ChessBoard.getSquareNumberInBoard(
      dragablePiece.position
    );
    this.originSquareColor = currentBoard[positionNumber].rectangle.fillColor;
    currentBoard[positionNumber].rectangle.setFillStyle(C.SQUARE_TO_MOVE_COLOR);

    currentBoard.forEach((square) => {
      if (possibleMoves.has(square.positionName)) {
        const squareRect = square.rectangle;
        squareRect.setInteractive();
        squareRect.input.dropZone = true;
        this.chessBoard.addPossibleMovement(squareRect);
      }
    });
  }

  doDrag(
    _pointer: Phaser.Input.Pointer,
    dragablePiece: ChessPiece,
    posX: number,
    posY: number
  ) {
    const chessBoardXOffset =
      (this.game.canvas.width - this.chessBoard.width) / 2;
    const chessBoardYOffset =
      (this.game.canvas.height - this.chessBoard.height) / 2;
    const chessBoardXhBound = this.chessBoard.x + this.chessBoard.width;
    const chessBoardYBound = this.chessBoard.y + this.chessBoard.height;
    if (
      posX >= this.chessBoard.x - chessBoardXOffset &&
      posX <= chessBoardXhBound - chessBoardXOffset
    ) {
      dragablePiece.x = posX;
    }
    if (
      posY >= this.chessBoard.y - chessBoardYOffset &&
      posY <= chessBoardYBound - chessBoardYOffset
    ) {
      dragablePiece.y = posY;
    }
  }

  stopDrag(
    _pointer: Phaser.Input.Pointer,
    dragablePiece: ChessPiece,
    dropped: boolean
  ) {
    if (!dropped) {
      dragablePiece.x = dragablePiece.input.dragStartX;
      dragablePiece.y = dragablePiece.input.dragStartY;

      const currentBoard = this.chessBoard.getBoard();
      const positionNumber = ChessBoard.getSquareNumberInBoard(
        dragablePiece.position
      );
      currentBoard[positionNumber].rectangle.setFillStyle(
        this.originSquareColor
      );
      this.originSquareColor = 0;
    }
    this.chessBoard.destroyPossibleMovements();
    const moves = this.chessGame.moves({
      square: dragablePiece.position,
      verbose: true,
    });
    const possibleMoves: Set<Square> = new Set();
    moves.map((move) => possibleMoves.add(move.to));
    const currentBoard = this.chessBoard.getBoard();
    currentBoard.forEach((square) => {
      if (possibleMoves.has(square.positionName)) {
        square.rectangle.input.enabled = false;
        square.rectangle.setStrokeStyle(0);
      }
    });
  }

  onPieceDragEnter(
    _pointer: Phaser.Input.Pointer,
    _dragablePiece: ChessPiece,
    rectangle: Phaser.GameObjects.Rectangle
  ) {
    if (rectangle.input.enabled) {
      rectangle.setStrokeStyle(
        C.POSSIBLE_MOVE_BORDER_LINE_WIDTH,
        C.POSSIBLE_MOVE_BORDER_COLOR
      );
    }
  }

  onPieceDragLeave(
    _pointer: Phaser.Input.Pointer,
    _dragablePiece: ChessPiece,
    rectangle: Phaser.GameObjects.Rectangle
  ) {
    if (rectangle.input.enabled) {
      rectangle.setStrokeStyle(0);
    }
  }

  onPieceDrop(
    _pointer: Phaser.Input.Pointer,
    dragablePiece: ChessPiece,
    rectangle: Phaser.GameObjects.Rectangle
  ) {
    const offsetPositionX = rectangle.width / 2;
    const offsetPositionY = rectangle.width / 2;
    dragablePiece.x = rectangle.x + offsetPositionX;
    dragablePiece.y = rectangle.y + offsetPositionY;

    const currentBoard = this.chessBoard.getBoard();

    // Change back the color of the origin Square
    const positionNumber = ChessBoard.getSquareNumberInBoard(
      dragablePiece.position
    );
    currentBoard[positionNumber].rectangle.setFillStyle(this.originSquareColor);
    this.originSquareColor = 0;

    const verboseMoves = this.chessGame.moves({
      square: dragablePiece.position,
      verbose: true,
    });
    const sansMoves = this.chessGame.moves({
      square: dragablePiece.position,
    });
    const possibleSquaresToMove: Set<Square> = new Set();
    verboseMoves.map((move) => possibleSquaresToMove.add(move.to));
    this.chessBoard.destroyPossibleMovements();

    const pieceToMove = ChessPiece.pieceTypeFromNumber(
      ChessPiece.pieceType(dragablePiece.getChessPiece())
    );

    currentBoard.forEach((square) => {
      // Remove possible movement circles
      if (possibleSquaresToMove.has(square.positionName)) {
        square.rectangle.input.enabled = false;
        square.rectangle.setStrokeStyle(0);
      }

      if (
        rectangle.x === square.rectangle.x &&
        rectangle.y === square.rectangle.y
      ) {
        let mutableFinalMove: string = "";
        if (pieceToMove === "") {
          const mutableMoves: string[] = sansMoves.filter((move) =>
            move.includes(square.positionName)
          );
          if (mutableMoves.length === 1) {
            mutableFinalMove = mutableMoves.pop()!;
          } else {
            // Is it a promotion?
            const promotionParams: PromotionParams = {
              rectangle: square.rectangle,
              pieceColor: dragablePiece.getColour(),
              origin: dragablePiece.position,
              target: square.positionName,
              offset: {
                x: (this.game.canvas.width - this.chessBoard.width) / 2,
                y: (this.game.canvas.height - this.chessBoard.height) / 2,
              },
            };
            this.game.scene.pause(SceneKeys.MainBoard);
            this.game.scene.start(SceneKeys.Promotion, promotionParams);
            dragablePiece.x = dragablePiece.input.dragStartX;
            dragablePiece.y = dragablePiece.input.dragStartY;
            return;
          }

          if (square.piece) square.piece.destroy();
        } else {
          if (square.piece) {
            square.piece.destroy();
          }

          const mutableMoves: string[] = sansMoves.filter((move) =>
            move.includes(square.positionName)
          );
          if (mutableMoves.length === 1) {
            mutableFinalMove = mutableMoves.pop()!;
          } else if (mutableMoves.length < 1) {
            // Calculate possible castling O-O
            if (
              pieceToMove === "K" &&
              (square.positionName == "g1" || square.positionName == "g8")
            ) {
              // Set the movement to king side castling
              mutableFinalMove = "O-O";
              // Rook is +ONE position from the square we want to move the King
              const rook = currentBoard[square.positionNumber].piece!;
              // Change Rook's position
              this.chessBoard.removePieceFromCurrentPosition(rook);
              // Get the squares beside the king
              const squareLeftFromKing =
                currentBoard[square.positionNumber - 2];
              // Move rook to king's left
              squareLeftFromKing.piece = rook;
              rook.setPositionInBoard(squareLeftFromKing.positionName);
              // Move Sprite to kings left
              rook.x = squareLeftFromKing.rectangle.x + offsetPositionX;
              rook.y = squareLeftFromKing.rectangle.y + offsetPositionY;

              // Calculate possible castling O-O-O
            } else if (
              pieceToMove === "K" &&
              (square.positionName == "c1" || square.positionName == "c8")
            ) {
              // Set the movement to queen side castling
              mutableFinalMove = "O-O-O";
              // Rook is -ONE position from the square we want to move the King
              const rook = currentBoard[square.positionNumber - 3].piece!;
              // Change Rook's position
              this.chessBoard.removePieceFromCurrentPosition(rook);
              // Get the squares beside the king
              const squareRightFromKing = currentBoard[square.positionNumber];
              // Move rook to king's right
              squareRightFromKing.piece = rook;
              rook.setPositionInBoard(squareRightFromKing.positionName);
              // Move Sprite to kings right
              rook.x = squareRightFromKing.rectangle.x + offsetPositionX;
              rook.y = squareRightFromKing.rectangle.y + offsetPositionY;
            }
          }
        }

        // Remove piece from current position
        this.chessBoard.removePieceFromCurrentPosition(dragablePiece);

        // Set the new position of the piece
        square.piece = dragablePiece;
        square.piece.setPositionInBoard(square.positionName);

        this.chessGame.move(mutableFinalMove);
        this.chessBoard.setFen(this.chessGame.fen());
      }
    });
  }

  finishPromotionMove(
    _scene: Phaser.Scene,
    promotionData: PromotionOptionSelected
  ) {
    const currentBoard = this.chessBoard.getBoard();
    const { origin, target, pieceColor, pieceName } = promotionData;
    const sansMoves = this.chessGame.moves({ square: origin });
    if (pieceName === "close") {
      return;
    }
    const promotionFor = pieceName[0]?.toUpperCase();
    const pieceType = ChessPiece.pieceTypeFromSymbol(promotionFor);
    const originIndex = ChessBoard.getSquareNumberInBoard(origin);
    const targetIndex = ChessBoard.getSquareNumberInBoard(target);
    const originSquare = currentBoard[originIndex];
    const targetSquare = currentBoard[targetIndex];

    let mutableFinalMove = `${target}=${promotionFor}`;
    const possibleMoves = sansMoves.filter(
      (move) => move.indexOf(mutableFinalMove) >= 0
    );
    if (possibleMoves.length > 1) {
      possibleMoves.sort((pMoveA, pMoveB) => pMoveB.length - pMoveA.length);
      mutableFinalMove = possibleMoves.shift() ?? mutableFinalMove;
    } else {
      mutableFinalMove = possibleMoves.shift() ?? mutableFinalMove;
    }

    const newChessPiece = new ChessPiece(
      pieceColor | pieceType,
      target,
      targetSquare.rectangle,
      this
    );

    if (targetSquare.piece) {
      targetSquare.piece.destroy();
    }

    // Remove piece from current position
    originSquare.piece?.destroy();
    this.chessBoard.removePieceFromCurrentPosition(originSquare.piece!);

    // Set the new position of the piece
    targetSquare.piece = newChessPiece;
    this.chessBoard.add(targetSquare.piece);

    this.chessGame.move(mutableFinalMove);
    this.chessBoard.setFen(this.chessGame.fen());
  }
}
