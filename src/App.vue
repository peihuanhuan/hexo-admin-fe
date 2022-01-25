<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>
<style type="text/css">
		html,
		body,
		#wrapper {
			height: 100%;
			width: 100%;
			margin: 0;
			padding: 0;
			border: 0;
		}

		table#wrapper {
			height: 75%;
		}

		#wrapper td {
			vertical-align: middle;
			text-align: center;
			cursor: pointer;
		}

		iframe {
			border: 0;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			width: 100%;
			height: 100%
		}
	</style>
