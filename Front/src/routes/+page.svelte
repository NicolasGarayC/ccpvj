<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { t as paraglideT, locale, availableLocales } from '$lib/paraglide/runtime';
	import BlogPostCard from '$lib/components/blog/BlogPostCard.svelte';
	import FeatureCard from '$lib/components/common/FeatureCard.svelte';
	import { blogService } from '$lib/services/blog/blogService';
	import { courseService } from '$lib/services/courses/courseService';
	import type { BlogPost, Course } from '$lib/data/models/interfaces';

	let t = (key: string) => key;

	// Usar el store reactivo de Svelte para el idioma
	$: currentLocale = $locale;

	// Paraglide locale es un store, así que lo usamos como $locale
	// No usar .get() directamente
	// let currentLocale = $locale; // reactivo

	onMount(() => {
		t = paraglideT;
	});

	function switchLocale() {
		// Cambia entre los idiomas disponibles
		const next = availableLocales.find((l) => l !== $locale) || 'es';
		locale.set(next);
	}

	$: isLoggedIn = $page.data.user !== null && $page.data.user !== undefined;
	$: isEducator = isLoggedIn && $page.data.user?.role === 'educator';

	let latestBlogPosts: BlogPost[] = [];
	let featuredCourses: Course[] = [];

	// educationalModules debe ser reactivo al idioma
	$: educationalModules = [
		{ id: 'preuniversitario', title: t('preuniversity'), modules: 3, icon: 'fa-graduation-cap' },
		{ id: 'computacion', title: t('basicComputing'), modules: 4, icon: 'fa-laptop-code' },
		{ id: 'artesania', title: t('craftWorkshop'), modules: 2, icon: 'fa-paint-brush' }
	];

	onMount(async () => {
		try {
			latestBlogPosts = await blogService.getLatestPosts();
			featuredCourses = await courseService.getFeaturedCourses();
		} catch (error) {
			console.error('Error cargando datos iniciales:', error);
		}
	});
</script>

<svelte:head>
	<title>{t('centroTitle')}</title>
	<meta name="description" content={t('centroDescription')} />
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
	/>
</svelte:head>

<!-- Hero Section -->
<section
	class="relative bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-700 py-16 text-white"
>
	<div class="container mx-auto flex flex-col items-center px-4 text-center">
		<h1 class="mb-4 text-5xl font-bold drop-shadow md:text-6xl">{t('welcomeToCentro')}</h1>
		<p class="mx-auto mb-8 max-w-2xl text-xl text-indigo-100 md:text-2xl">{t('centroPurpose')}</p>
		<div class="mt-4 flex flex-wrap justify-center gap-4">
			{#if !isLoggedIn}
				<a
					href="/auth/login"
					class="flex items-center gap-2 rounded-lg bg-white px-8 py-3 font-semibold text-indigo-700 shadow transition-all hover:bg-gray-100"
				>
					<i class="fas fa-sign-in-alt"></i>
					{t('educatorLogin')}
				</a>
				<a
					href="/courses"
					class="flex items-center gap-2 rounded-lg border-2 border-white bg-transparent px-8 py-3 font-semibold text-white transition-all hover:bg-white/20"
				>
					<i class="fas fa-book-open"></i>
					{t('browseMaterials')}
				</a>
			{:else if isEducator}
				<a
					href="/dashboard"
					class="flex items-center gap-2 rounded-lg bg-white px-8 py-3 font-semibold text-indigo-700 shadow transition-all hover:bg-gray-100"
				>
					<i class="fas fa-tachometer-alt"></i>
					{t('educatorDashboard')}
				</a>
				<a
					href="/editor"
					class="flex items-center gap-2 rounded-lg border-2 border-white bg-transparent px-8 py-3 font-semibold text-white transition-all hover:bg-white/20"
				>
					<i class="fas fa-edit"></i>
					{t('createContent')}
				</a>
			{:else}
				<a
					href="/courses"
					class="flex items-center gap-2 rounded-lg bg-white px-8 py-3 font-semibold text-indigo-700 shadow transition-all hover:bg-gray-100"
				>
					<i class="fas fa-graduation-cap"></i>
					{t('myMaterials')}
				</a>
			{/if}
		</div>
		<div class="mt-10 flex justify-center gap-8">
			<div class="text-center">
				<div class="text-3xl font-bold">3</div>
				<div class="text-indigo-100">{t('availableCourses')}</div>
			</div>
			<div class="text-center">
				<div class="text-3xl font-bold">9</div>
				<div class="text-indigo-100">{t('totalModules')}</div>
			</div>
			<div class="text-center">
				<div class="text-3xl font-bold">30+</div>
				<div class="text-indigo-100">{t('studentsServed')}</div>
			</div>
		</div>
	</div>
	<div class="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden leading-none">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 1200 120"
			preserveAspectRatio="none"
			class="h-12 w-full"
		>
			<path
				d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.71C59.71,118.14,130.83,141.06,213.2,56.44Z"
				class="fill-white"
			></path>
		</svg>
	</div>
</section>

<!-- Noticias del blog -->
<section class="bg-gray-50 py-16">
	<div class="container mx-auto px-4">
		<div class="mb-12 text-center">
			<h2 class="mb-3 text-3xl font-bold">{t('latestNews')}</h2>
			<div class="mx-auto h-1 w-20 rounded-full bg-indigo-600"></div>
			<p class="mx-auto mt-4 max-w-2xl text-gray-600">{t('stayUpdated')}</p>
		</div>
		<div class="grid gap-8 md:grid-cols-3">
			{#if latestBlogPosts.length > 0}
				{#each latestBlogPosts as post}
					<div class="transition-all hover:-translate-y-2 hover:shadow-xl">
						<BlogPostCard {post} />
					</div>
				{/each}
			{:else}
				<p class="col-span-3 rounded-lg bg-white py-10 text-center text-gray-500 shadow-sm">
					<i class="fas fa-newspaper mb-3 block text-3xl text-gray-300"></i>
					{t('noBlogPostsYet')}
				</p>
			{/if}
		</div>
		<div class="mt-12 text-center">
			<a
				href="/blog"
				class="inline-flex items-center rounded-lg bg-indigo-600 px-8 py-3 font-medium text-white shadow-md transition-colors hover:bg-indigo-700 hover:shadow-lg"
			>
				{t('viewAllNews')}
				<i class="fas fa-arrow-right ml-2"></i>
			</a>
		</div>
	</div>
</section>

<!-- Materiales educativos -->
<section class="py-16">
	<div class="container mx-auto px-4">
		<div class="mb-12 text-center">
			<h2 class="mb-3 text-3xl font-bold">{t('educationalMaterials')}</h2>
			<div class="mx-auto h-1 w-20 rounded-full bg-indigo-600"></div>
			<p class="mx-auto mt-4 max-w-2xl text-gray-600">{t('accessCourseMaterials')}</p>
		</div>
		<div class="grid gap-8 md:grid-cols-3">
			{#each educationalModules as module}
				<FeatureCard
					title={module.title}
					description={t('moduleCountLabel').replace('{count}', module.modules)}
					icon={module.icon}
				>
					<div class="mt-4 flex items-center justify-between">
						<a
							href={`/courses/${module.id}`}
							class="group inline-flex items-center font-medium text-indigo-600 transition-colors hover:text-indigo-800"
						>
							{t('accessMaterials')}
							<i
								class="fas fa-arrow-right ml-2 transform transition-transform group-hover:translate-x-1"
							></i>
						</a>
						<span class="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-800"
							>{module.modules} {t('modules')}</span
						>
					</div>
				</FeatureCard>
			{/each}
		</div>
	</div>
</section>

<!-- Cursos destacados -->
<section class="bg-gradient-to-b from-gray-50 to-white py-16">
	<div class="container mx-auto px-4">
		<div class="mb-12 text-center">
			<h2 class="mb-3 text-3xl font-bold">{t('featuredCourses')}</h2>
			<div class="mx-auto h-1 w-20 rounded-full bg-indigo-600"></div>
			<p class="mx-auto mt-4 max-w-2xl text-gray-600">{t('exploreCourseOfferings')}</p>
		</div>
		<div class="grid gap-8 md:grid-cols-3">
			{#if featuredCourses.length > 0}
				{#each featuredCourses as course}
					<div
						class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg transition-all hover:-translate-y-2 hover:shadow-xl"
					>
						<div
							class="flex h-36 items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600"
						>
							<span class="text-4xl font-bold text-white opacity-30">{course.title.charAt(0)}</span>
						</div>
						<div class="p-6">
							<h3 class="mb-3 text-xl font-semibold">{course.title}</h3>
							<p class="mb-6 text-gray-600">{course.description}</p>
							<div class="flex items-center justify-between">
								<a
									href={`/courses/${course.id}`}
									class="group inline-flex items-center font-medium text-indigo-600 transition-colors hover:text-indigo-800"
								>
									{t('exploreCourseMaterials')}
									<i
										class="fas fa-arrow-right ml-2 transform transition-transform group-hover:translate-x-1"
									></i>
								</a>
							</div>
						</div>
					</div>
				{/each}
			{:else}
				<p class="col-span-3 rounded-lg bg-white py-10 text-center text-gray-500 shadow-sm">
					<i class="fas fa-book-open mb-3 block text-3xl text-gray-300"></i>
					{t('noCoursesYet')}
				</p>
			{/if}
		</div>
		<div class="mt-12 text-center">
			<a
				href="/courses"
				class="inline-flex items-center rounded-lg border-2 border-indigo-600 bg-white px-8 py-3 font-medium text-indigo-600 shadow-md transition-colors hover:bg-indigo-50 hover:shadow-lg"
			>
				{t('viewAllCourses')}
				<i class="fas fa-arrow-right ml-2"></i>
			</a>
		</div>
	</div>
</section>

<!-- Información del centro -->
<section class="bg-indigo-50 py-16">
	<div class="container mx-auto max-w-4xl px-4">
		<div class="mb-12 text-center">
			<h2 class="mb-3 text-3xl font-bold">{t('aboutCenter')}</h2>
			<div class="mx-auto h-1 w-20 rounded-full bg-indigo-600"></div>
		</div>
		<div class="rounded-xl bg-white p-8 shadow-lg">
			<div class="prose prose-indigo max-w-none">
				<p class="mb-4 text-lg leading-relaxed">{t('centerDescription1')}</p>
				<p class="mb-6 text-lg leading-relaxed">{t('centerDescription2')}</p>
			</div>
			<div
				class="mt-8 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-6"
			>
				<div class="flex items-start">
					<div class="mr-4 text-indigo-600">
						<i class="fas fa-wifi text-3xl"></i>
					</div>
					<div>
						<h3 class="mb-3 text-xl font-semibold text-indigo-800">{t('noInternetRequired')}</h3>
						<p class="leading-relaxed text-gray-700">{t('localNetworkExplanation')}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- CTA Final -->
<section class="bg-gradient-to-br from-indigo-900 to-purple-800 py-16 text-white">
	<div class="container mx-auto px-4 text-center">
		<h2 class="mb-6 text-3xl font-bold">{t('readyToStart')}</h2>
		<p class="mx-auto mb-8 max-w-2xl text-lg text-indigo-100">{t('joinCommunity')}</p>
		<div class="flex flex-wrap justify-center gap-4">
			<a
				href="/courses"
				class="flex transform items-center gap-2 rounded-lg bg-white px-8 py-3 font-medium text-indigo-700 shadow-lg transition-all hover:scale-105 hover:bg-gray-100"
			>
				<i class="fas fa-book-open"></i>
				{t('exploreCourses')}
			</a>
			<a
				href="/blog"
				class="flex items-center gap-2 rounded-lg border-2 border-white bg-transparent px-8 py-3 font-medium text-white transition-all hover:bg-white/20"
			>
				<i class="fas fa-newspaper"></i>
				{t('readLatestNews')}
			</a>
		</div>
	</div>
</section>
	<p class="mb-4 text-lg leading-relaxed">{t('centerDescription1')}</p>
	<p class="mb-6 text-lg leading-relaxed">{t('centerDescription2')}</p>
</div>
<div
	class="mt-8 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-6"
>
	<div class="flex items-start">
		<div class="mr-4 text-indigo-600">
			<i class="fas fa-wifi text-3xl"></i>
		</div>
		<div>
			<h3 class="mb-3 text-xl font-semibold text-indigo-800">{t('noInternetRequired')}</h3>
			<p class="leading-relaxed text-gray-700">{t('localNetworkExplanation')}</p>
		</div>
	</div>
</div>

<!-- CTA Final -->
<section class="bg-gradient-to-br from-indigo-900 to-purple-800 py-16 text-white">
	<div class="container mx-auto px-4 text-center">
		<h2 class="mb-6 text-3xl font-bold">{t('readyToStart')}</h2>
		<p class="mx-auto mb-8 max-w-2xl text-lg text-indigo-100">{t('joinCommunity')}</p>
		<div class="flex flex-wrap justify-center gap-4">
			<a
				href="/courses"
				class="flex transform items-center gap-2 rounded-lg bg-white px-8 py-3 font-medium text-indigo-700 shadow-lg transition-all hover:scale-105 hover:bg-gray-100"
			>
				<i class="fas fa-book-open"></i>
				{t('exploreCourses')}
			</a>
			<a
				href="/blog"
				class="flex items-center gap-2 rounded-lg border-2 border-white bg-transparent px-8 py-3 font-medium text-white transition-all hover:bg-white/20"
			>
				<i class="fas fa-newspaper"></i>
				{t('readLatestNews')}
			</a>
		</div>
	</div>
</section>
