import { writable } from '@dishuostec/svelte-store/deep';
import type { ChessboardPosition } from '@tic-tac-toe/common/src/game';
import type { GameState } from '@tic-tac-toe/common/src/game';
import type {
	PLAYER_INDEX,
	PlayerInfo,
} from '@tic-tac-toe/common/src/room';

export class Game {
	index = writable<PLAYER_INDEX>(null);
	player = writable<PlayerInfo[]>(null);
	state = writable<GameState>(null);
	private socket: GameClient;

	constructor(socket: GameClient) {
		socket
			.on('index', this.index.set)
			.on('players', this.player.set)
			.on('state', this.state.set);

		this.socket = socket;
	}

	ready() {
		this.socket.emit('ready');
	}

	move(position: ChessboardPosition) {
		this.socket.emit('move', position);
	}
}
