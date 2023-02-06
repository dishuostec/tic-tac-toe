import type {
	AllPlayer,
	PLAYER_INDEX,
} from './room';

/**
 *        Col 0   Col 1   Col 2
 *
 * Row 0    x   |   x   |   x
 *        ------ ------- ------
 * Row 1    x   |   x   |   x
 *        ------ ------- ------
 * Row 2    x   |   x   |   x
 */
export enum ChessboardPosition {
	Row0Col0 = 1 << 0,
	Row0Col1 = 1 << 1,
	Row0Col2 = 1 << 2,
	Row1Col0 = 1 << 3,
	Row1Col1 = 1 << 4,
	Row1Col2 = 1 << 5,
	Row2Col0 = 1 << 6,
	Row2Col1 = 1 << 7,
	Row2Col2 = 1 << 8,
}

type ChessboardRow = [ChessboardPosition, ChessboardPosition, ChessboardPosition];
export const CHESSBOARD_POSITIONS: [ChessboardRow, ChessboardRow, ChessboardRow] = [
	[ChessboardPosition.Row0Col0, ChessboardPosition.Row0Col1, ChessboardPosition.Row0Col2],
	[ChessboardPosition.Row1Col0, ChessboardPosition.Row1Col1, ChessboardPosition.Row1Col2],
	[ChessboardPosition.Row2Col0, ChessboardPosition.Row2Col1, ChessboardPosition.Row2Col2],
];

export function debug_board(...holdings: Holding[]): string {
	return CHESSBOARD_POSITIONS
		.map((row) =>
			row
				.map((value) => {
					const index = holdings.findIndex(holding => holding & value);
					return index === -1 ? ' ' : index;
				})
				.join('|'),
		)
		.join('\n- - -\n');
}

const win_patterns = [
	// on row
	ChessboardPosition.Row0Col0 | ChessboardPosition.Row0Col1 | ChessboardPosition.Row0Col2,
	ChessboardPosition.Row1Col0 | ChessboardPosition.Row1Col1 | ChessboardPosition.Row1Col2,
	ChessboardPosition.Row2Col0 | ChessboardPosition.Row2Col1 | ChessboardPosition.Row2Col2,

	// on col
	ChessboardPosition.Row0Col0 | ChessboardPosition.Row1Col0 | ChessboardPosition.Row2Col0,
	ChessboardPosition.Row0Col1 | ChessboardPosition.Row1Col1 | ChessboardPosition.Row2Col1,
	ChessboardPosition.Row0Col2 | ChessboardPosition.Row1Col2 | ChessboardPosition.Row2Col2,

	// on oblique
	ChessboardPosition.Row0Col0 | ChessboardPosition.Row1Col1 | ChessboardPosition.Row2Col2,
	ChessboardPosition.Row2Col0 | ChessboardPosition.Row1Col1 | ChessboardPosition.Row0Col2,
];

export type Holding = number;

export function is_win(holding: Holding): boolean {
	for (const win of win_patterns) {
		if ((holding & win) === win) { return true;}
	}

	return false;
}

export function is_full(holding: Holding): boolean {
	return holding === 0b111111111;
}

export enum GameStatus {
	Waiting,
	Playing,
	End,
}

export interface GameWaitingState {
	status: GameStatus.Waiting,
}

export interface GamePlayingState {
	status: GameStatus.Playing;
	player: {
		first: PLAYER_INDEX;
		current: PLAYER_INDEX;
	},
	holdings: AllPlayer<Holding>;
}

export interface GameEndState {
	status: GameStatus.End;
	player: {
		first: PLAYER_INDEX;
		win: PLAYER_INDEX | null;
	},
	holdings: AllPlayer<Holding>;
}

export type GameState =
	GameWaitingState
	| GamePlayingState
	| GameEndState;


