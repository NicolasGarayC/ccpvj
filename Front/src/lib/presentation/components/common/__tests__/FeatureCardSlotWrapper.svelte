<script lang="ts">
	import FeatureCard from '../FeatureCard.svelte';

	export let title = '';
	export let description = '';
</script>

<FeatureCard {title} {description}>
	<button type="button">Ver más</button>
</FeatureCard>
