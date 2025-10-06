// Simple static i18n system to replace dynamic Paraglide imports

// Default translations in Spanish
const translations = {
  // Main titles
  'centroTitle': 'Centro Cultural Víctor Jara',
  'centroDescription': 'Centro Cultural Víctor Jara - Red Comunitaria de Aprendizaje',
  'welcomeToCentro': '¡Bienvenido al Centro Cultural! 🎉',
  'centroPurpose': '✨ Tu espacio de aprendizaje y creatividad ✨',

  // Action buttons
  'educatorLogin': '👨‍🏫 Acceso Educadores',
  'browseMaterials': '📚 Explorar Materiales',
  'educatorDashboard': '📊 Panel Educador',
  'createContent': '✨ Crear Contenido',
  'myMaterials': '🎒 Mis Materiales',
  'startLearning': '🚀 ¡Empezar a Aprender!',
  'joinCommunity': '🤝 Unirse a la Comunidad',
  'exploreLibrary': '📖 Explorar Biblioteca',

  // Statistics
  'availableCourses': '📚 Cursos Disponibles',
  'totalModules': '📝 Módulos Totales',
  'studentsServed': '👥 Estudiantes Atendidos',
  'activeProjects': '🎨 Proyectos Activos',
  'communityMembers': '🌟 Miembros Activos',

  // Subjects and courses
  'preuniversity': '🎓 Preuniversitario',
  'basicComputing': '💻 Computación Básica',
  'craftWorkshop': '🎨 Taller de Artesanías',
  'mathematics': '🔢 Matemáticas',
  'physics': '⚛️ Física',
  'socialStudies': '🌍 Ciencias Sociales',
  'economics': '💰 Economía',
  'digitalArt': '🎨 Arte Digital',
  'music': '🎵 Música',

  // News and blog
  'latestNews': '📰 ¡Últimas Noticias!',
  'stayUpdated': 'Mantente al día con las últimas actividades del centro',
  'noBlogPostsYet': '¡Próximamente tendremos noticias increíbles!',
  'viewAllNews': '👀 Ver Todas las Noticias',
  'readMore': '📖 Leer Más',
  'newsAndAnnouncements': 'Noticias y Anuncios',
  'blogDescription': 'Mantente informado con las últimas noticias y anuncios del Centro Cultural Víctor Jara',
  'allNews': 'Todas las noticias',
  'loading': 'Cargando...',
  'tryAgain': 'Intentar de nuevo',
  'noNewsInCategory': 'No hay noticias en esta categoría',
  'tryDifferentCategory': 'Prueba con una categoría diferente o ve todas las noticias',
  'checkBackSoon': 'Vuelve pronto para ver las últimas novedades de nuestra comunidad',
  'seeAllNews': 'Ver todas las noticias',
  'createArticle': 'Crear Artículo',

  // Events and calendar
  'upcomingEvents': '🎪 ¡Próximos Eventos Geniales!',
  'noEventsYet': '¡Estamos preparando eventos súper divertidos!',
  'viewCalendar': 'Ver Calendario Completo',
  'registerEvent': '✅ ¡Inscríbete Ya!',

  // Educational materials
  'educationalMaterials': '🎒 ¡Materiales de Aprendizaje!',
  'accessCourseMaterials': 'Descubre recursos increíbles para aprender y crear',
  'moduleCountLabel': '📚 {count} módulos súper geniales',
  'accessMaterials': ' ¡Acceder Ya!',
  'modules': 'módulos',

  // Featured courses
  'featuredCourses': '⭐ ¡Cursos Más Populares!',
  'exploreCourseOfferings': 'Los cursos que más les gustan a nuestros estudiantes',
  'noCoursesYet': '¡Estamos creando cursos increíbles para ti!',
  'exploreCourseMaterials': '🎮 ¡Explorar Curso!',
  'viewAllCourses': '🌟 Ver Todos los Cursos',

  // Center information
  'aboutCenter': '🏛️ Sobre Nuestro Centro',
  'centerDescription1': '¡Somos un espacio donde la educación se vuelve una aventura! Aquí puedes aprender desde matemáticas hasta arte digital, todo en un ambiente divertido y colaborativo.',
  'centerDescription2': 'Nuestro centro está diseñado especialmente para jóvenes como tú, donde cada día es una nueva oportunidad para descubrir algo genial y compartirlo con tus amigos.',
  'noInternetRequired': '📶 ¡Sin Internet, Sin Problema!',
  'localNetworkExplanation': 'Todo funciona en nuestra red local, así puedes acceder a todos los recursos sin necesidad de internet. ¡Perfecto para concentrarte en aprender!',

  // Final call to action
  'readyToStart': '🎯 ¿Listo para la Aventura?',
  'joinCommunityText': '¡Únete a nuestra comunidad de jóvenes creativos y empezemos juntos esta increíble experiencia de aprendizaje!',
  'exploreCourses': 'Explorar Cursos',
  'readLatestNews': 'Leer Noticias',

  // Special sections
  'quickActions': '⚡ Acciones Rápidas',
  'popularContent': '🔥 Contenido Popular',
  'achievements': '🏆 Logros y Reconocimientos',
  'communitySpotlight': '🌟 Destacados de la Comunidad',

  // Auth related
  'login': 'Iniciar Sesión',
  'username': 'Usuario',
  'password': 'Contraseña',
  'loginSubtitle': 'Red Comunitaria de Aprendizaje',
  'usernamePlaceholder': 'Ingresa tu usuario',
  'passwordPlaceholder': 'Ingresa tu contraseña',
  'loggingIn': 'Iniciando sesión...',
  'redirecting': 'Redirigiendo...',
  'loginSuccess': 'Inicio de sesión exitoso. Redirigiendo...',
  'loginError': 'Error al iniciar sesión',
  'connectionError': 'Error de conexión. Verifica que el servidor esté funcionando.',
  'backToHome': 'Volver al inicio',

  // Blog post page
  'newsArticle': 'Artículo',
  'articleNotFound': 'Artículo no encontrado',
  'backToNews': 'Volver a noticias',
  'videoNotSupported': 'Tu navegador no soporta video.',
  'readMoreNews': 'Leer más noticias'
};

/**
 * Simple translation function
 * @param key - Translation key
 * @returns Translated string or the key if not found
 */
export function t(key: string): string {
  return translations[key as keyof typeof translations] || key;
}

/**
 * Translation function with placeholder replacement
 * @param key - Translation key
 * @param params - Object with values to replace placeholders
 * @returns Translated string with placeholders replaced
 */
export function t_params(key: string, params: Record<string, string | number>): string {
  let translated = t(key);

  // Replace placeholders like {count}, {name}, etc.
  Object.entries(params).forEach(([param, value]) => {
    translated = translated.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
  });

  return translated;
}

export default t;