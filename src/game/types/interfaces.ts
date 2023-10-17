import { Square } from "chess.js";
import { Piece } from "./enums";
import ChessPiece from "../Piece";

export interface PromotionParams {
  rectangle: Phaser.GameObjects.Rectangle;
  pieceColor: Piece.Black | Piece.White;
  origin: Square;
  target: Square;
  offset?: {
    x: number;
    y: number;
  };
}

export interface ChessBoardSquare {
  positionNumber: number;
  positionName: Square;
  rectangle: Phaser.GameObjects.Rectangle;
  piece?: ChessPiece;
}

export interface PromotionOptionSelected {
  fullName: string;
  pieceName: string;
  origin: Square;
  target: Square;
  pieceColor: Piece.Black | Piece.White;
}
