import type {
	PlayerClientEventsMap,
	GameServerEventsMap,
} from '@tic-tac-toe/common/src/room';
import { Socket } from 'socket.io-client';


declare global {
	type GameClient = Socket<GameServerEventsMap, PlayerClientEventsMap>;
}
