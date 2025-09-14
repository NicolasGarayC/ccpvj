<script lang="ts">
	import { onMount } from 'svelte';
	import { courseService } from '$lib/services/courseService';
	import { authService } from '$lib/services/authService';
	import CourseCard from '$lib/components/course/CourseCard.svelte';

	let courses = [];
	let loading = true;
	let error = '';
	let user = null;
	let isAuthenticated = false;

	onMount(async () => {
		// Check authentication
		isAuthenticated = authService.isAuthenticated();
		if (isAuthenticated) {
			user = authService.getUser();
		}

		// Load courses
		await loadCourses();
	});

	async function loadCourses() {
		try {
			loading = true;
			error = '';
			courses = await courseService.getAllCourses();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Error cargando cursos';
		} finally {
			loading = false;
		}
	}

	function handleCourseDeleted(event) {
		const deletedId = event.detail;
		courses = courses.filter(course => course.id !== deletedId);
	}
</script>

<svelte:head>
	<title>Test Course Management</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4 max-w-6xl">
		<div class="bg-white rounded-lg shadow-lg p-6 mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-4">🧪 Test Course Management</h1>

			<div class="mb-6">
				<h2 class="text-lg font-semibold mb-2">Authentication Status:</h2>
				{#if isAuthenticated}
					<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
						✅ Authenticated as: {user?.firstName} {user?.lastName} ({user?.role})
					</div>
				{:else}
					<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
						❌ Not authenticated
					</div>
				{/if}
			</div>

			<div class="mb-6">
				<h2 class="text-lg font-semibold mb-2">Available Actions:</h2>
				<div class="space-y-2">
					<div class="flex items-center">
						<span class="text-green-600 mr-2">✅</span>
						<span>View courses</span>
					</div>
					{#if user?.role === 'administrador' || user?.role === 'colaborador'}
						<div class="flex items-center">
							<span class="text-green-600 mr-2">✅</span>
							<span>Edit courses</span>
						</div>
						<div class="flex items-center">
							<span class="text-green-600 mr-2">✅</span>
							<span>Delete courses</span>
						</div>
						<div class="flex items-center">
							<span class="text-green-600 mr-2">✅</span>
							<span>Create courses</span>
						</div>
					{:else}
						<div class="flex items-center">
							<span class="text-gray-400 mr-2">❌</span>
							<span class="text-gray-500">Edit/Delete/Create (insufficient permissions)</span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		{#if loading}
			<div class="text-center py-8">
				<div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<p class="mt-2">Loading courses...</p>
			</div>
		{:else if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
				Error: {error}
			</div>
		{:else}
			<div class="mb-6">
				<h2 class="text-2xl font-bold mb-4">Courses ({courses.length})</h2>
				{#if courses.length === 0}
					<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
						No courses found in database
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each courses as course (course.id)}
							<CourseCard
								{course}
								showActions={user?.role === 'administrador' || user?.role === 'colaborador'}
								on:deleted={handleCourseDeleted}
							/>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<h3 class="font-semibold text-blue-900 mb-2">Test Instructions:</h3>
			<ol class="list-decimal list-inside text-blue-800 space-y-1">
				<li>Check if courses are displayed correctly</li>
				<li>If authenticated with proper permissions, try editing a course</li>
				<li>Test the delete confirmation modal</li>
				<li>Check if course deletion works and updates the list</li>
				<li>Verify navigation to create/edit pages works</li>
			</ol>
		</div>
	</div>
</div>