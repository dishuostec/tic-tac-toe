<script lang="ts">
	import {
		ChessboardPosition,
		type Holding,
	} from '@tic-tac-toe/common/src/game';
	import { createEventDispatcher } from 'svelte';

	export let my_turn: boolean;
	export let value: ChessboardPosition;
	export let holdings: Holding[] = [];


	let state;
	$: {
		state = null;

		holdings.some((holding, index) => {
			if (holding & value) {
				state = index;
				return true;
			}
			return false;
		});
	}

	const dispatch = createEventDispatcher();

	function move() {
		if (state !== null) return;

		dispatch('move', value);
	}
</script>

<div
	class="position"
	class:disabled={!my_turn || state!==null}
	class:p1={state===0}
	class:p2={state===1}
	on:click={move}
>
	{#if state !== null}
		<i />
	{/if}
</div>

<style>
	.position {
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
	}

	.position:hover {
		background-color: rgba(97, 203, 55, 0.3);
	}

	.disabled {
		pointer-events: none;
	}

	i {
		display: block;
		width: 50%;
		height: 50%;
		border: 5px solid;
		border-radius: 100%;
	}

	.p1 i {
		border-color: var(--player_1);
	}

	.p2 i {
		border-color: var(--player_2);
	}
</style>

