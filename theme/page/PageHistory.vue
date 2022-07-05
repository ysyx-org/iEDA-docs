<script setup>
const props = defineProps({ history: Object })
</script>

<template>
	<table>
		<thead>
			<tr>
				<td>版本号</td>
				<td>提交日期</td>
				<td>作者</td>
				<td>内容概要</td>
			</tr>
		</thead>
		<tbody>
			<tr v-for="(el, i) in props.history" :key="i">
				<td>{{ el.version }}</td>
				<td>{{ new Date(el.date).toLocaleDateString() || "-" }}</td>
				<td>{{ el.author || "-" }}</td>
				<td>{{ el.description || "-" }}</td>
			</tr>
		</tbody>
	</table>
</template>