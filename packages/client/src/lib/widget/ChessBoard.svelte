<script lang="ts">
	import {
		CHESSBOARD_POSITIONS,
		GameStatus,
	} from '@tic-tac-toe/common/src/game.js';
	import ChessPosition from './ChessPosition.svelte';
	import { game } from '../client';

	const { index, state } = game;

	$: holdings = $state?.holdings;

	function move_handler({ detail }) {
		game.move(detail);
	}
</script>

<section>
	<div id="chessboard">
		{#each CHESSBOARD_POSITIONS as row, i}
			<div class={`row row_${i}`}>
				{#each row as cell, j}
					<div class={`cell col col_${j}`}>
						{#if holdings}
							<ChessPosition
								value={cell}
								holdings={holdings}
								my_turn={$state?.player.current === $index}
								on:move={move_handler}
							/>
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>

	{#if $state?.status === GameStatus.Playing}
		{#if $state?.player.current === $index}
			<p>It's your turn now.</p>
		{:else}
			<p>Please wait for the opponent to play.</p>
		{/if}
	{/if}
</section>

<style>
	#chessboard {
		display: flex;
		flex-direction: column;
		margin: 0 auto;
		width: 20em;
		height: 20em;
	}

	.row {
		display: flex;
		height: 33.3%;
	}

	.col {
		width: 33.3%;
	}

	.row_1 {
		border-top: 1px solid;
		border-bottom: 1px solid;
	}

	.col_1 {
		border-left: 1px solid;
		border-right: 1px solid;
	}

</style>
