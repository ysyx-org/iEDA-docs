<script setup>
import ColorSchemeSwitch from '@CC/header/ColorSchemeSwitch.vue'
</script>

<template>
	<div
		style="height: 100%; display: flex; margin: 0 0 0 1em; align-items: center"
	>
		<client-only><color-scheme-switch /></client-only>
	</div>
</template>