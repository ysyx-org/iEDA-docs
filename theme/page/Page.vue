<script setup>
import PageMeta from "./PageMeta.vue";
import PageNav from "./PageNav.vue";
</script>

<template>
	<main class="page">
		<slot name="top" />

		<div class="theme-default-content">

			<PageMeta />
			
			<slot name="content-top" />

			<Content />

			<slot name="content-bottom" />
		</div>

		<PageNav />

		<slot name="bottom" />
	</main>
</template>
