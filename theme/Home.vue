<script setup>
import Logo from './Logo.vue'
import '@CR/global.css'
</script>

<template>
	<main class="home">
		<v-body style="--header-height: 0px; height: 100%">
			<container flex-column flex-center content-center>
				<container
					flex-column
					flex-center
					content-center
					style="border-bottom: 1px solid var(--cb-gray-light)"
				>
					<Logo style="max-width: 280px; margin: 4em 0 2em 0" />
					<h2 style="color: var(--ct-gray-light); margin-top: 10px">
						开源芯片设计平台
					</h2>
					<h2 style="color: var(--ct-gray-light); margin-top: 10px">
						open-source integrated chip design platform
					</h2>
				</container>
				<container features flex-row flex-center flex-wrap :pad="false">
					<container next-level round>
						<h4>Feature 1</h4>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing
							elit, sed do eiusmod tempor incididunt ut labore et
							dolore magna aliqua.
						</p>
					</container>
					<container next-level round>
						<h4>Feature 2</h4>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing
							elit, sed do eiusmod tempor incididunt ut labore et
							dolore magna aliqua.
						</p>
					</container>
					<container next-level round>
						<h4>Feature 3</h4>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing
							elit, sed do eiusmod tempor incididunt ut labore et
							dolore magna aliqua.
						</p>
					</container>
					<container next-level round>
						<h4>Feature 4</h4>
						<p>
							Lorem ipsum dolor sit amet, consectetur adipiscing
							elit, sed do eiusmod tempor incididunt ut labore et
							dolore magna aliqua.
						</p>
					</container>
				</container>
			</container>
		</v-body>
	</main>
</template>

<script>
// Common components
// HTML Alternatives
import vBody from '@CC/Body.vue'
import vForm from '@CC/Form.vue'
import vFooter from '@CC/Footer.vue'
// UI Building Blocks
import StatusCode from '@CC/StatusCode.vue'
// Register these components locally
export default {
	components: { vBody, vForm, vFooter, StatusCode }
}
</script>

<style lang="scss" scoped>
[features] {
	padding: 0.5em 0;
	& > * {
		color: var(--ct-gray);
		flex-grow: 1;
		padding: 1em;
		margin: 0.5em;
		text-align: left;
		width: 30%;
		min-width: 12em;
	}
}
</style>