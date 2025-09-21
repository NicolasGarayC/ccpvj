<script lang="ts">
	import { onMount } from 'svelte';
	import { courseService } from '$lib/services/courseService';
	import { authService } from '$lib/services/authService';

	let testResults = [];
	let loading = false;
	let isAuthenticated = false;
	let user = null;

	onMount(() => {
		isAuthenticated = authService.isAuthenticated();
		if (isAuthenticated) {
			user = authService.getUser();
		}
	});

	async function testCourseDetail() {
		loading = true;
		testResults = [];

		// Test course IDs from database
		const courseIds = ['curso-001', 'curso-002', 'curso-003'];

		for (const courseId of courseIds) {
			try {
				const course = await courseService.getCourse(courseId);
				testResults = [...testResults, {
					courseId,
					success: true,
					data: course,
					error: null
				}];
			} catch (error) {
				testResults = [...testResults, {
					courseId,
					success: false,
					data: null,
					error: error.message
				}];
			}
		}

		loading = false;
	}

	function navigateToCourseDetail(courseId) {
		window.location.href = `/courses/${courseId}`;
	}
</script>

<svelte:head>
	<title>Test Course Detail - Centro Cultural Víctor Jara</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-6xl">
		<div class="bg-white rounded-lg shadow-lg p-6 mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-4">🧪 Test Course Detail Functionality</h1>

			<div class="mb-6">
				<h2 class="text-lg font-semibold mb-2">Authentication Status:</h2>
				{#if isAuthenticated}
					<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
						✅ Authenticated as: {user?.nombre} {user?.apellido} ({user?.role})
					</div>
				{:else}
					<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
						⚠️ Not authenticated (public access mode)
					</div>
				{/if}
			</div>

			<div class="mb-6">
				<button
					class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50"
					on:click={testCourseDetail}
					disabled={loading}
				>
					{#if loading}
						⏳ Testing Course Details...
					{:else}
						🔍 Test Course Detail API
					{/if}
				</button>
			</div>

			{#if testResults.length > 0}
				<div class="space-y-4">
					<h2 class="text-xl font-bold">Test Results:</h2>
					{#each testResults as result}
						<div class="border rounded-lg p-4 {result.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}">
							<div class="flex items-center justify-between mb-3">
								<h3 class="font-semibold">
									{result.success ? '✅' : '❌'} Course ID: {result.courseId}
								</h3>
								{#if result.success}
									<button
										class="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
										on:click={() => navigateToCourseDetail(result.courseId)}
									>
										🚀 Ver Página de Detalles
									</button>
								{/if}
							</div>

							{#if result.success && result.data}
								<div class="bg-white rounded p-3 border">
									<h4 class="font-bold text-lg text-emerald-600 mb-2">{result.data.title}</h4>
									<div class="grid grid-cols-2 gap-4 text-sm">
										<div><strong>Subject:</strong> {result.data.subject}</div>
										<div><strong>Educator:</strong> {result.data.educatorName || 'N/A'}</div>
										<div><strong>Modules:</strong> {result.data.moduleCount || 0}</div>
										<div><strong>Work Items:</strong> {result.data.workItemCount || 0}</div>
										<div><strong>Active:</strong> {result.data.isActive ? 'Yes' : 'No'}</div>
										<div><strong>Featured:</strong> {result.data.isFeatured ? 'Yes' : 'No'}</div>
									</div>
									<div class="mt-3">
										<strong>Description:</strong>
										<p class="text-gray-700 mt-1">{result.data.description}</p>
									</div>
								</div>
							{:else if result.error}
								<div class="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded">
									<strong>Error:</strong> {result.error}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<h3 class="font-semibold text-blue-900 mb-2">Test Instructions:</h3>
			<ol class="list-decimal list-inside text-blue-800 space-y-1">
				<li>Click "Test Course Detail API" to verify data loading</li>
				<li>Check that course data is loaded correctly</li>
				<li>Click "Ver Página de Detalles" for successful courses</li>
				<li>Verify the course detail page loads properly</li>
				<li>Test navigation and all UI elements</li>
			</ol>
		</div>
	</div>
</div>