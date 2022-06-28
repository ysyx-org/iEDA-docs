<script setup lang="ts">
import {
	ClientOnly,
	useRouteLocale,
	useSiteLocaleData,
	withBase,
} from "@vuepress/client";
import { computed, h } from "vue";
import type { FunctionalComponent } from "vue";
import {
	useDarkMode,
	useThemeLocaleData,
} from "@vuepress/theme-default/lib/client/composables";
import Logo from "./Logo.vue";

const routeLocale = useRouteLocale();
const siteLocale = useSiteLocaleData();
const themeLocale = useThemeLocaleData();
const isDarkMode = useDarkMode();

const navbarBrandLink = computed(
	() => themeLocale.value.home || routeLocale.value
);
const navbarBrandTitle = computed(() => siteLocale.value.title);
const navbarBrandLogo = computed(() => {
	if (isDarkMode.value && themeLocale.value.logoDark !== undefined) {
		return themeLocale.value.logoDark;
	}
	return themeLocale.value.logo;
});
</script>

<template>
	<RouterLink
		:to="navbarBrandLink"
		style="display: flex; align-items: center; height: 100%;"
	>
		<Logo style="height: 1.2em" />

		<span
			v-if="navbarBrandTitle"
			class="site-name"
			:class="{ 'can-hide': navbarBrandLogo }"
			style="
				color: var(--ct-gray);
				margin-left: 0.5em;
				padding: 0 0 0 0.5em;
        line-height: 1.4em;
				border-left: 2px solid var(--cb-gray);
			"
		>
			{{ navbarBrandTitle }}
		</span>
	</RouterLink>
</template>
