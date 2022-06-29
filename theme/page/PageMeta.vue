<script setup lang="ts">
import AutoLink from "@vuepress/theme-default/lib/client/components/AutoLink.vue";
import Container from "@CC/Container.vue";
import { usePageData, usePageFrontmatter } from "@vuepress/client";
import { computed, ref } from "vue";
import type { ComputedRef } from "vue";
import type {
	DefaultThemeNormalPageFrontmatter,
	DefaultThemePageData,
	NavLink,
} from "@vuepress/theme-default/lib/shared";
import { useThemeLocaleData } from "@vuepress/theme-default/lib/client/composables";
import { resolveEditLink } from "@vuepress/theme-default/lib/client/utils";
import PageHistory from "./PageHistory.vue";

interface PageHistoryItem {
	version: string;
	date: string;
	author: string;
	description?: string;
}

interface CustomPageFrontMatter extends DefaultThemeNormalPageFrontmatter {
	// name of the author who is currently in charge of this page
	author?: string;
	// auditing organization
	audition?: string;
	// History file path
	history?: Array<PageHistoryItem>;
	// Switch to hide info banner
	hideMeta?: boolean;
}

const frontmatter = usePageFrontmatter<CustomPageFrontMatter>();
const themeLocale = useThemeLocaleData();
const page = usePageData<DefaultThemePageData>();

const toggleMetaDetails = ref(false);

console.log("page", page.value);
console.log("frontmatter", frontmatter.value);

const useEditNavLink = (): ComputedRef<null | NavLink> => {
	return computed(() => {
		const showEditLink =
			frontmatter.value.editLink ?? themeLocale.value.editLink ?? true;
		if (!showEditLink) {
			return null;
		}
		const {
			repo,
			docsRepo = repo,
			docsBranch = "main",
			docsDir = "",
			editLinkText,
		} = themeLocale.value;
		if (!docsRepo) return null;
		const editLink = resolveEditLink({
			docsRepo,
			docsBranch,
			docsDir,
			filePathRelative: page.value.filePathRelative,
			editLinkPattern:
				frontmatter.value.editLinkPattern ??
				themeLocale.value.editLinkPattern,
		});
		if (!editLink) return null;
		return {
			text: editLinkText ?? "Edit this page",
			link: editLink,
		};
	});
};

const useLastUpdated = (): ComputedRef<null | string> => {
	const frontmatter = usePageFrontmatter<DefaultThemeNormalPageFrontmatter>();
	return computed(() => {
		const showLastUpdated =
			frontmatter.value.lastUpdated ??
			themeLocale.value.lastUpdated ??
			true;
		if (!showLastUpdated) return null;
		const time = page.value.git?.updatedTime || page.value.git?.createdTime;
		if (!time) return null;
		const date = new Date(time);
		return [
			date.toLocaleDateString(),
			[date.getHours(), date.getMinutes()].join(":"),
		].join(" ");
	});
};

const useContributors = (): ComputedRef<
	null | Required<DefaultThemePageData["git"]>["contributors"]
> => {
	const frontmatter = usePageFrontmatter<DefaultThemeNormalPageFrontmatter>();

	return computed(() => {
		const showContributors =
			frontmatter.value.contributors ??
			themeLocale.value.contributors ??
			true;

		if (!showContributors) return null;

		return page.value.git?.contributors ?? null;
	});
};

const editNavLink = useEditNavLink();
const lastUpdated = useLastUpdated();
const contributors = useContributors();
</script>

<template>
	<container
		next-level
		round
		style="margin: 2rem 0 1rem; position: relative"
		v-if="!frontmatter.hideMeta"
	>
		<ul class="meta-info-brief-list">
			<li v-if="frontmatter.author">
				<div class="list-title">内容负责人</div>
				<div class="list-content">{{ frontmatter.author }}</div>
			</li>
			<li v-if="frontmatter.audition">
				<div class="list-title">内容审核</div>
				<div class="list-content">{{ frontmatter.audition }}</div>
			</li>
			<li>
				<div class="list-title">最后修改于</div>
				<div class="list-content" v-if="lastUpdated">
					{{ lastUpdated }}
				</div>
				<div
					class="list-content"
					v-else
					style="font-weight: normal; font-style: italic"
				>
					Not available
				</div>
			</li>
			<template v-if="toggleMetaDetails">
				<li>
					<div class="list-title">贡献者</div>
					<div
						class="list-content"
						style="display: flex; align-items: center"
					>
						<template
							v-for="(contributor, index) in contributors"
							:key="index"
						>
							<div
								:title="`email: ${contributor.email}`"
								style="
									font-size: 0.8em;
									margin: 0.2em 0.5em 0.2em 0;
									border-radius: 0.2em;
									background-color: var(--cf-next-next-level);
									padding: 0 0.5em;
								"
							>
								{{ contributor.name }}
							</div>
						</template>
					</div>
				</li>
				<template v-if="frontmatter.history">
					<div
						style="
							width: 100%;
							margin: 1em 0;
							border-top: 1px solid var(--cb-gray);
						"
					></div>
					<li>
						<div class="list-title">编辑历史</div>
						<div class="list-content">
							<PageHistory
								:history="frontmatter.history"
								style="width: 100%; margin: 0"
							/>
						</div>
					</li>
				</template>
			</template>
		</ul>
		<div
			class="meta-details-button"
			@click="toggleMetaDetails = !toggleMetaDetails"
			:style="{
				'--rotate': toggleMetaDetails ? '0deg' : '90deg',
			}"
		>
			▼
		</div>
	</container>
</template>

<style lang="scss" scoped>
.meta-info-brief-list {
	width: 100%;
	margin: 0;
	padding: 0;
	li::marker,
	li::before {
		content: "";
	}
	li {
		font-size: 0.9rem;
		font-weight: bold;
		display: flex;
		margin: 0.5rem 0;
		& > span {
			display: block;
		}
		.list-title {
			user-select: none;
			min-width: 5em;
			color: var(--ct-gray);
		}
		.list-content {
			padding-left: 0.8em;
			color: var(--ct-gray-dark);
		}
	}
}
.meta-details-button {
	position: absolute;
	top: 50%;
	right: 0;
	color: var(--c-brand);
	padding: 1em;
	transition: 0.1s ease-in-out;
	user-select: none;
	cursor: pointer;
	transform: translateY(-50%) rotate(var(--rotate));
}
</style>