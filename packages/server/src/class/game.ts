import type { TouchableReadable } from '@dishuostec/svelte-store/core/readable';
import {
	derived,
	writable,
} from '@dishuostec/svelte-store/deep';
import {
	record,
	RecordStore,
} from '@dishuostec/svelte-store/extends/record';
import {
	ChessboardPosition,
	GameState,
	GameStatus,
	is_win,
	Holding,
	is_full,
} from '@tic-tac-toe/common/src/game';
import { NanoEvents } from '@tic-tac-toe/common/src/NanoEvents';
import {
	AllPlayer,
	GameServerEventsMap,
	get_next_player_index,
	MAX_PLAYERS,
	PLAYER_INDEX,
	PlayerClientEventsMap,
	PlayerInfo,
} from '@tic-tac-toe/common/src/room';
import type {
	CombineString,
	PrependParam,
} from '@tic-tac-toe/common/src/types';
import { get } from 'svelte/store';
import { onceStore } from '../helpers';
import { Player } from './player';

type RoundStatePlayer = {
	first: PLAYER_INDEX | null;
	current: PLAYER_INDEX | null;
	win: PLAYER_INDEX | null;
};

type RoundStatePlayerStore = RecordStore<RoundStatePlayer, RoundStatePlayer>;


interface EventsMap {
	[event: string]: any;
}

type ConvertEventMap<Map extends EventsMap, Prefix extends string = '', Suffix extends string = '', Append extends any = never> = {
	[Ev in keyof Map as Ev extends string ? CombineString<Ev, Prefix, Suffix> : never]: [Append] extends [never] ? Map[Ev] : PrependParam<Append, Map[Ev]>;
}

type GameServerEventsMapSolo<Map extends EventsMap> = ConvertEventMap<Map, 'solo.', '', Player>;
type GameServerEventsMapBroadcast<Map extends EventsMap> = ConvertEventMap<Map, 'broadcast.'>;
type GameServerEventsMapBroadcastExclude<Map extends EventsMap> = ConvertEventMap<Map, 'broadcast.', '.exclude', Player>;

type PlayerClientEventsMapInternal<Map extends EventsMap> = ConvertEventMap<Map, 'client.', '', Player>;


type EmitEventsMap =
	GameServerEventsMapSolo<GameServerEventsMap>
	& GameServerEventsMapBroadcast<GameServerEventsMap>
	& GameServerEventsMapBroadcastExclude<GameServerEventsMap>
	& PlayerClientEventsMapInternal<PlayerClientEventsMap>;


export class Game extends NanoEvents<EmitEventsMap> {
	private players = writable<Player[]>([]);
	private _players_info = writable<PlayerInfo[]>([]);

	private state: RecordStore<{
		holdings: Holding[];
		status: GameStatus;
		player: RoundStatePlayerStore;
	}, GameState>;
	private holdings: TouchableReadable<Holding>;

	constructor() {
		super();

		this._create_state_store();
		this._subscribe_players_data();

		onceStore({
			store: this.players,
			is: list => list.length === MAX_PLAYERS,
			run: () => this.start(),
		});
	}

	addPlayer(): Player | null {
		let player: Player | null = null;

		this.players.update(list => {
			if (list.length < MAX_PLAYERS) {
				player = new Player(list.length);
				return [...list, player];
			} else {
				return list;
			}
		});

		return player;
	}

	_create_state_store() {
		const player: RoundStatePlayerStore = record({
			first: null,
			current: null,
			win: null,
		});

		this.state = record({
			status: GameStatus.Waiting as GameStatus,
			player,
			holdings: [] as Holding[],
		}, ({ status, player, holdings }): GameState => {


			const { first, current } = player;

			if (status === GameStatus.Playing) {
				return {
					status,
					player: {
						first: first!,
						current: current!,
					},
					holdings: holdings as AllPlayer<Holding>,
				};
			}

			if (status === GameStatus.End) {
				return {
					status,
					player: {
						first: first!,
						win: player.win,
					},
					holdings: holdings as AllPlayer<Holding>,
				};
			}

			return { status: GameStatus.Waiting };
		});

		this.holdings = derived(this.state.holdings, list => list.reduce((r, d) => r | d, 0));

		this.state.subscribe(state => {
			this.emit('broadcast.state', state);
		});
	}

	_subscribe_players_data() {
		let dispose_info;
		let dispose_piece;
		this.players.subscribe(list => {

			dispose_info?.();
			dispose_info = derived(list.map(d => d.info), d => [...d])
				.subscribe(this._players_info.set);

			dispose_piece?.();
			dispose_piece = derived(list.map(d => d.holding), d => [...d])
				.subscribe(this.state.holdings.set);
		});

		this._players_info.subscribe(players_info => {
			this.emit('broadcast.players', players_info);
		});
	}

	start() {
		let players = get(this.players);
		if (players.length < MAX_PLAYERS) return false;

		this.newRound();

		return true;
	}

	end(winner?: PLAYER_INDEX) {
		this.state.status.set(GameStatus.End);
		this.state.player.current.set(null);
		this.state.player.win.set(winner ?? null);

		this.newRound();
	}

	listenPlayerClientEvents(player: Player, client: GameClient) {
		client
			.on('fetch_player', () => {
				return get(this._players_info);
			})
			.on('fetch_state', () => {
				return get(this.state);
			})
			.on('ready', () => {
				player.ready.set(true);
			})
			.on('move', (position) => {
				if (this._isWaitingPlayerMove(player) && this._isMoveValid(position)) {
					this.emit('client.move', player, position);
					return true;
				}

				return false;
			});

		client.emit('index', player.index);
		client.emit('players', get(this._players_info));
		client.emit('state', get(this.state));
	}

	newRound() {
		let players = get(this.players);

		for (const player of players) {
			player.ready.set(false);
		}

		onceStore({
			store: derived(players.map(d => d.ready), list => !list.some(ready => !ready)),
			run: () => this._initNewRound(),
		});

	}

	_initNewRound() {
		let players = get(this.players);

		this.state.player.first.set(0);

		for (const player of players) {
			player.newRound();
		}

		this.state.status.set(GameStatus.Playing);

		this.state.player.current.set(null);

		this._roundLoop();
	}

	async _roundLoop() {
		const { player, position } = await this._waitForPlayerMove();
		player.move(position);
		const holding = get(player.holding);

		if (is_win(holding)) {
			this.end(player.index);
			return;
		}
		if (is_full(get(this.holdings))) {
			this.end();
			return;
		}

		this._roundLoop();
	}

	async _waitForPlayerMove() {
		const index = get(this.state.player);
		const next_index = get_next_player_index(index.current ?? (index.first ?? 0 - 1));

		return new Promise<{ player: Player, position: ChessboardPosition }>(resolve => {
			this.once('client.move', (player: Player, position: ChessboardPosition) => {
				resolve({ player, position });
			});

			this.state.player.current.set(next_index);
		});
	}

	_isWaitingPlayerMove(player: Player): boolean {
		return player.index === get(this.state.player.current);
	}

	_isMoveValid(position: ChessboardPosition): boolean {
		const holdings = get(this.state.holdings);
		const conflict = holdings.some(holding => holding & position);
		return !conflict;
	}
}
