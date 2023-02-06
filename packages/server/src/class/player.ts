import {
	derived,
	writable,
} from '@dishuostec/svelte-store/deep';
import { debug_board } from '@tic-tac-toe/common/src/game';
import type { ChessboardPosition } from '@tic-tac-toe/common/src/game';
import type { Holding } from '@tic-tac-toe/common/src/game';
import type {
	PLAYER_INDEX,
	PlayerInfo,
} from '@tic-tac-toe/common/src/room';


export class Player {
	readonly index: PLAYER_INDEX;
	readonly name: string;
	readonly ready = writable<boolean>(false);
	readonly online = writable<boolean>(true);
	readonly info = derived([this.ready, this.online], ([ready, online]) => {
		return {
			index: this.index,
			name: this.name,
			online,
			ready,
		} as PlayerInfo;
	});

	readonly holding = writable<Holding>(0);

	constructor(index) {
		this.index = index;
		this.name = `Player ${index + 1}`;

		// this.info.subscribe(d => {
		// 	console.log(d);
		// });
	}


	move(position: ChessboardPosition) {
		this.holding.update(d => d | position);
	}

	newRound() {
		this.holding.set(0);
	}

}
