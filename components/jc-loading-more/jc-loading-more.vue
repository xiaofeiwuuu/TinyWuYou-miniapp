<template>
	<fu-loading-more size="24" iconSize="48" :loadingType="props.loadingType"></fu-loading-more>
</template>

<script setup>
	// props方法
	const props = defineProps({
		loadingType: {
			type: Number,
			default: 0
		}
	})
</script>

<style>

</style>