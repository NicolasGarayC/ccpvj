// ============================================
// SISTEMA I18N ÚNICO - Centro Cultural Víctor Jara
// ============================================

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// ============================================
// DEFINICIÓN DE TIPOS
// ============================================

export type Locale = 'es' | 'en';
export type MessageKey = keyof typeof messages.es;

// ============================================
// MENSAJES COMPLETOS (ES y EN)
// ============================================

export const messages = {
  es: {
    // ========================================
    // SITE METADATA & BRANDING
    // ========================================
    "centroTitle": "Centro Cultural Víctor Jara",
    "centroDescription": "Centro Cultural Víctor Jara - Red Comunitaria de Aprendizaje",
    "centroPurpose": "Explora, aprende y crea en nuestra red comunitaria de aprendizaje",

    // ========================================
    // NAVIGATION
    // ========================================
    "home": "Inicio",
    "blog": "Blog",
    "calendar": "Calendario",
    "library": "Biblioteca",
    "materialApoyo": "Material de Apoyo",
    "logout": "Salir",
    "login": "Entrar",
    "panel": "Panel",
    "panelAdmin": "Panel Admin",

    // ========================================
    // AUTH & PERMISSIONS
    // ========================================
    "auth.no_permissions_create": "No tienes permisos para crear posts del blog. Necesitas ser Colaborador o Administrador.",
    "auth.no_permissions_edit": "No tienes permisos para editar posts del blog. Necesitas ser Colaborador o Administrador.",
    "auth.no_permissions_delete": "No tienes permisos para eliminar posts.",
    "auth.no_permissions_role_management": "No tienes permisos para gestionar roles de usuarios. Esta función está disponible solo para Administradores.",
    "auth.no_permissions_create_events": "No tienes permisos para crear eventos. Contacta al administrador.",
    "auth.login_required": "Debes iniciar sesión para realizar esta acción.",
    "auth.own_posts_only": "Solo puedes editar tus propios posts o ser Administrador.",

    // LOGIN
    "login.title": "Iniciar Sesión",
    "login.subtitle": "Accede con tu cuenta del Centro Cultural, solo para administradores y colaboradores.",
    "login.usernameLabel": "Usuario",
    "login.passwordLabel": "Contraseña",
    "login.usernamePlaceholder": "Ingresa tu usuario",
    "login.passwordPlaceholder": "Ingresa tu contraseña",
    "login.submit": "Iniciar Sesión",
    "login.submitting": "Iniciando sesión...",
    "login.errorMissingCredentials": "Por favor ingresa usuario y contraseña.",
    "login.errorGeneric": "Error al iniciar sesión. Intenta nuevamente.",
    "login.errorConnection": "Error de conexión. Intenta nuevamente.",
    "login.sessionExpired": "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    "login.supportMessage": "¿Problemas para acceder? Contacta al administrador.",

    // ========================================
    // ACTIONS
    // ========================================
    "action.create": "Crear",
    "action.edit": "Editar",
    "action.delete": "Eliminar",
    "action.save": "Guardar",
    "action.cancel": "Cancelar",
    "action.update": "Actualizar",
    "action.close": "Cerrar",
    "action.retry": "Reintentar",
    "action.back": "Volver",
    "action.clearFilters": "Limpiar filtros y empezar de nuevo",

    // ========================================
    // HOME PAGE
    // ========================================
    "welcome": "¡Bienvenido!",
    "startLearning": "Comenzar a Aprender",
    "educatorLogin": "Acceso Educadores",
    "educatorDashboard": "Panel Educador",
    "createContent": "Crear Contenido",
    "myMaterials": "Mis Materiales",
    "exploreLibrary": "Explorar Biblioteca",
    "availableCourses": "Proyectos Disponibles",
    "totalModules": "Módulos Totales",
    "recentNews": "Noticias Recientes",
    "uniqueVisitors": "Visitantes Únicos",
    "latestNews": "Últimas Noticias",
    "stayUpdated": "Mantente al día con las últimas novedades del centro",
    "noBlogPostsYet": "Aún no hay noticias",
    "noBlogPostsMessage": "¡Estamos trabajando en contenido súper genial para compartir contigo muy pronto!",
    "viewAllNews": "Ver Todas las Noticias",
    "upcomingEvents": "Próximos Eventos",
    "upcomingEventsMessage": "¡No te pierdas los eventos más divertidos del centro!",
    "viewCalendar": "Ver Calendario Completo",
    "educationalMaterials": "Materiales Educativos",
    "accessCourseMaterials": "Accede a recursos súper geniales para aprender y crear",
    "accessMaterials": "Acceder Materiales",
    "quickActions": "Acciones Rápidas",
    "exploreAllProjects": "Explorar Todos los Proyectos",
    "viewLibrary": "Ver Biblioteca",
    "featuredCourses": "Proyectos Destacados",
    "exploreCourseOfferings": "Explora nuestra selección de proyectos más populares e increíbles",
    "exploreCourseMaterials": "Explorar Materiales del Proyecto",
    "viewAllCourses": "Ver Todos los Proyectos",
    "viewResource": "Ver Recurso",
    "noCoursesYet": "Aún no hay proyectos",
    "noCoursesMessage": "¡Estamos preparando materiales educativos increíbles para ti!",
    "noLibraryItemsYet": "No hay recursos todavía",
    "noLibraryItemsMessage": "Pronto agregaremos recursos educativos a la biblioteca",
    "aboutCenter": "Acerca del Centro",
    "centerDescription1": "El Centro Cultural Víctor Jara es una red comunitaria de aprendizaje dedicada a promover la educación, la cultura y el arte en nuestra comunidad.",
    "centerDescription2": "Ofrecemos una amplia variedad de cursos, talleres y recursos educativos diseñados para apoyar el desarrollo personal y profesional de todos nuestros miembros.",
    "noInternetRequired": "Sin Necesidad de Internet",
    "localNetworkExplanation": "Todos los recursos están disponibles en la red local del centro, facilitando el acceso sin conexión a internet.",
    "readyForAdventure": "¿Listo para la Aventura?",
    "joinCommunityText": "Únete a nuestra comunidad de aprendizaje y comienza tu viaje educativo hoy mismo",
    "exploreCourses": "Explorar Proyectos",
    "readLatestNews": "Leer Últimas Noticias",
    "adventureStartsNow": "¡Tu aventura de aprendizaje comienza AHORA!",
    "modules": "módulos",
    "module": "módulo",

    // ========================================
    // BLOG
    // ========================================
    "newsAndAnnouncements": "Noticias y Anuncios",
    "blogDescription": "Mantente informado con las últimas noticias y anuncios del Centro Cultural Víctor Jara",
    "newsArticle": "Artículo",
    "articleNotFound": "Artículo no encontrado",
    "backToNews": "Volver a noticias",
    "videoNotSupported": "Tu navegador no soporta video.",
    "audioNotSupported": "Tu navegador no soporta audio.",
    "newsPost": "Noticia",
    "readMore": "Leer más",
    "readMoreNews": "Leer más noticias",
    "relatedEvents": "Eventos Relacionados",
    "featured": "Destacado",

    // Blog Page
    "blog.article_deleted_success": "Artículo eliminado exitosamente",
    "blog.error_deleting_article": "Error al eliminar el artículo",
    "blog.delete_article_title": "Eliminar Artículo",
    "blog.delete_article_confirm": "¿Estás seguro de que deseas eliminar el artículo '{title}'? Esta acción no se puede deshacer.",
    "blog.untitled": "Sin título",

    // Blog Post Card
    "blog.news_badge": "📰 NOTICIA",
    "blog.media_file": "Archivo multimedia",
    "blog.edit_post": "Editar post",
    "blog.delete_post": "Eliminar post",

    // Blog Post List
    "blog.error_loading_posts": "Error cargando posts",
    "blog.article_management": "Gestión de Artículos",
    "blog.article_singular": "artículo",
    "blog.article_plural": "artículos",
    "blog.create_article": "Crear Artículo",
    "blog.loading_articles": "Cargando artículos...",
    "blog.error_loading_articles_header": "Error al cargar artículos",
    "blog.retry": "Intentar de nuevo",
    "blog.no_articles_yet": "No hay artículos todavía",
    "blog.create_first_article_description": "Comienza creando tu primer artículo del blog",
    "blog.create_first_article": "Crear Primer Artículo",

    // Blog Post Form - Validation
    "blog.title_required": "⚠️ El título es requerido",
    "blog.complete_required_fields": "❌ Por favor completa todos los campos requeridos",
    "blog.add_at_least_one_element": "⚠️ Debe agregar al menos un elemento al artículo",
    "blog.article_needs_content": "❌ El artículo necesita contenido para ser publicado",
    "blog.text_elements_not_empty": "⚠️ Los elementos de texto no pueden estar vacíos",
    "blog.some_elements_incomplete": "❌ Algunos elementos están incompletos",
    "blog.multimedia_requires_file": "⚠️ Los elementos multimedia requieren un archivo",
    "blog.missing_required_files": "❌ Falta subir algunos archivos requeridos",

    // Blog Post Form - Success Messages
    "blog.article_updated_success": "✅ Artículo \"{title}\" actualizado exitosamente",
    "blog.article_created_success": "✅ Artículo \"{title}\" creado exitosamente",

    // Blog Post Form - Error Messages
    "blog.session_expired": "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    "blog.article_duplicate_title": "⚠️ Ya existe un artículo con ese título. Por favor, usa un título diferente.",
    "blog.article_slug_error": "⚠️ Error con el título del artículo. Por favor, elige un título diferente.",
    "blog.error_saving_article": "❌ Error al {action} el artículo",

    // Blog Post Form - UI Elements
    "blog.edit_article": "Editar Artículo",
    "blog.create_new_article": "Crear Nuevo Artículo",
    "blog.new_title": "Nuevo título",
    "blog.new_text": "Nuevo texto",
    "blog.article_information": "Información del Artículo",
    "blog.article_title": "Título del Artículo *",
    "blog.article_title_placeholder": "Título del artículo",
    "blog.article_content": "Contenido del Artículo",
    "blog.add_elements_instruction": "Agrega elementos para crear el contenido de tu artículo",
    "blog.elements_hint": "Puedes agregar títulos, texto, imágenes, videos, audios y documentos en cualquier orden",
    "blog.no_content": "Sin contenido",
    "blog.files_organized_hint": "💡 Los archivos se organizarán automáticamente cuando guardes el artículo.",
    "blog.related_events_section": "Eventos Relacionados",
    "blog.related_events_description": "Relaciona este artículo con eventos del calendario para que los visitantes puedan ver el contenido vinculado.",
    "blog.uploading_files": "Subiendo archivos... ({count})",
    "blog.updating": "Actualizando...",
    "blog.creating": "Creando...",
    "blog.update_article": "Actualizar Artículo",
    "blog.cancel": "Cancelar",

    // Blog Post Form - Element Types
    "blog.title_button": "Título",
    "blog.text_button": "Texto",
    "blog.image_button": "Imagen",
    "blog.video_button": "Video",
    "blog.audio_button": "Audio",
    "blog.document_button": "Documento",
    "blog.title_badge": "Título",
    "blog.text_badge": "Texto",
    "blog.image_badge": "Imagen",
    "blog.video_badge": "Video",
    "blog.audio_badge": "Audio",
    "blog.document_badge": "Documento",
    "blog.enter_title": "Ingresa el título...",
    "blog.enter_text": "Ingresa el texto...",

    // Blog Event Relations
    "blog.error_loading_events": "Error cargando eventos",
    "blog.related_events_count": "Eventos Relacionados ({count})",
    "blog.remove_event": "Quitar evento",
    "blog.relate_to_events": "Relacionar con Eventos",
    "blog.add_more_events": "Agregar Más Eventos",
    "blog.search_events": "Buscar eventos por título...",
    "blog.no_events_found": "No se encontraron eventos",
    "blog.no_events_available": "No hay eventos disponibles",
    "blog.selected": "✓ Seleccionado",
    "blog.select_events_help": "Selecciona los eventos que deseas relacionar con este artículo del blog",

    // Media Uploader
    "blog.invalid_file_type": "Tipo de archivo no válido para {mediaType}",
    "blog.file_too_large": "Archivo muy grande (máx. {maxSize}MB para {mediaType})",
    "blog.error_uploading_file": "Error al subir el archivo",
    "blog.error_deleting_image": "Error al eliminar la imagen",
    "blog.video_not_supported": "Video no soportado",
    "blog.audio_not_supported": "Audio no soportado",
    "blog.pdf_document": "Documento PDF",
    "blog.view_document": "Ver documento",
    "blog.word_document": "Documento Word",
    "blog.excel_spreadsheet": "Hoja de Excel",
    "blog.powerpoint_presentation": "Presentación PowerPoint",
    "blog.document": "Documento",
    "blog.download_file": "Descargar archivo",
    "blog.uploaded_file": "Archivo subido",
    "blog.remove": "Eliminar",
    "blog.uploading": "Subiendo {mediaType}...",
    "blog.select_file": "Selecciona un archivo de {mediaType}",
    "blog.formats_image": "Formatos: JPG, PNG, GIF, WebP, SVG, AVIF, BMP, TIFF (máx. 200MB)",
    "blog.formats_video": "Formatos: MP4, WebM, MOV, AVI, MKV (máx. 500MB)",
    "blog.formats_audio": "Formatos: MP3, WAV, OGG, FLAC, AAC (máx. 100MB)",
    "blog.formats_pdf": "Formato: PDF (máx. 50MB)",
    "blog.formats_document": "Formatos: PDF, Word (DOC/DOCX), Excel (XLS/XLSX), PowerPoint (PPT/PPTX) (máx. 1GB)",
    "blog.select_media": "Seleccionar {mediaType}",
    "blog.change_media": "Cambiar {mediaType}",

    // ========================================
    // CALENDAR & EVENTS
    // ========================================
    "calendarTitle": "Calendario de Eventos",
    "calendarDescription": "Descubre todas las actividades, clases y eventos increíbles que tenemos preparados para ti en nuestro centro cultural",
    "createEvent": "Crear Evento",
    "list": "Lista",
    "today": "Hoy",
    "calendar.form.create_title": "Crear Nuevo Evento",
    "calendar.form.create_subtitle": "Programa una nueva actividad en el calendario del centro cultural",
    "calendar.form.edit_title": "Editar Evento",
    "calendar.form.edit_subtitle": "Modifica los detalles de tu evento",
    "calendar.form.section_basic": "Información Básica",
    "calendar.form.title_label": "Título del evento",
    "calendar.form.title_placeholder": "Ej: Taller de Teatro Infantil",
    "calendar.form.characters": "caracteres",
    "calendar.form.event_type": "Tipo de Evento",
    "calendar.form.location": "Ubicación",
    "calendar.form.location_placeholder": "Ej: Aula Principal, Salón de Eventos",
    "calendar.form.description_label": "Descripción",
    "calendar.form.description_placeholder": "Describe el evento, actividades, objetivos y todo lo que los participantes deben saber...",
    "calendar.form.section_schedule": "Fechas y Horarios",
    "calendar.form.all_day": "Evento de todo el día",
    "calendar.form.start_label": "Fecha de Inicio",
    "calendar.form.end_label_optional": "Fecha/Hora de Fin (opcional)",
    "calendar.form.end_label_recurring": "Repetir Hasta",
    "calendar.form.end_help_recurring": "Fecha límite hasta la cual se repetirá este evento",
    "calendar.form.end_help_single": "Cuándo termina este evento (ej: taller de 10am a 12pm)",
    "calendar.form.section_recurrence": "Recurrencia",
    "calendar.form.recurrence_toggle": "Evento recurrente",
    "calendar.form.recurrence_help": "Los eventos recurrentes se repetirán automáticamente según el patrón configurado",
    "calendar.form.recurrence_pattern": "Patrón de Recurrencia",
    "calendar.form.recurrence_interval": "Cada",
    "calendar.form.recurrence_interval_hint": "Define cada cuántos periodos se repite según el patrón seleccionado.",
    "calendar.form.recurrence_days_label": "Días de la Semana",
    "calendar.form.recurrence_days_help": "Selecciona los días en que se repetirá el evento",
    "calendar.form.section_links": "Enlaces Relacionados",
    "calendar.form.project_label": "Proyecto Relacionado",
    "calendar.form.project_help": "Vincula este evento con un proyecto específico",
    "calendar.form.blog_label": "Artículo de Blog Relacionado",
    "calendar.form.blog_help": "Vincula este evento con un artículo de blog (anuncios, contexto, etc.)",
    "calendar.form.section_special": "Configuración Especial",
    "calendar.form.featured_label": "Marcar como evento destacado",
    "calendar.form.featured_help": "Los eventos destacados aparecerán en la página principal y tendrán mayor visibilidad",
    "calendar.form.none": "Ninguno",
    "calendar.form.cancel": "Cancelar",
    "calendar.form.save_create": "Crear Evento",
    "calendar.form.save_update": "Actualizar Evento",
    "calendar.form.saving": "Guardando...",
    "calendar.form.error_title_required": "El título es obligatorio",
    "calendar.form.error_start_required": "La fecha de inicio es obligatoria",
    "calendar.form.error_end_required_recurring": "Para eventos recurrentes, debes especificar hasta cuándo se repite",
    "calendar.form.error_end_after_start": "La fecha final debe ser posterior a la fecha de inicio",
    "calendar.form.error_recurrence_pattern": "Debe seleccionar un patrón de recurrencia",
    "calendar.create.meta_description": "Crear un nuevo evento en el calendario del Centro Cultural Víctor Jara",
    "calendar.create.breadcrumb_current": "Crear Evento",
    "calendar.create.error_heading": "Error al crear el evento",
    "calendar.create.error_generic": "Error al crear el evento",
    "calendar.create.loading": "Creando evento...",
    "calendar.create.tips_title": "Consejos para crear un evento exitoso",
    "calendar.create.tip_1": "Usa un título descriptivo y atractivo que capture la atención",
    "calendar.create.tip_2": "Incluye una descripción detallada del contenido y objetivos",
    "calendar.create.tip_3": "Especifica claramente la ubicación y horarios",
    "calendar.create.tip_4": "Si requiere registro, establece una fecha límite apropiada",
    "calendar.create.tip_5": "Relaciona el evento con proyectos o posts del blog cuando sea relevante",
    "calendar.create.tip_6": "Considera marcar como destacado eventos especiales o importantes",
    "calendar.create.tip_7": "Para eventos recurrentes, revisa bien el patrón de repetición",
    "calendar.months.0": "Enero",
    "calendar.months.1": "Febrero",
    "calendar.months.2": "Marzo",
    "calendar.months.3": "Abril",
    "calendar.months.4": "Mayo",
    "calendar.months.5": "Junio",
    "calendar.months.6": "Julio",
    "calendar.months.7": "Agosto",
    "calendar.months.8": "Septiembre",
    "calendar.months.9": "Octubre",
    "calendar.months.10": "Noviembre",
    "calendar.months.11": "Diciembre",
    "calendar.days.0": "Dom",
    "calendar.days.1": "Lun",
    "calendar.days.2": "Mar",
    "calendar.days.3": "Mie",
    "calendar.days.4": "Jue",
    "calendar.days.5": "Vie",
    "calendar.days.6": "Sab",
    "eventTypes": "Tipos de Eventos",
    "eventType.class": "Clase",
    "eventType.workshop": "Taller",
    "eventType.conference": "Conferencia",
    "eventType.event": "Evento",
    "eventType.general": "General",
    "eventType.other": "Otro",
    "calendar.recurrence.none": "No recurrente",
    "calendar.recurrence.daily": "Diario",
    "calendar.recurrence.weekly": "Semanal",
    "calendar.recurrence.monthly": "Mensual",
    "calendar.recurrence.yearly": "Anual",
    "calendar.days.long.0": "Domingo",
    "calendar.days.long.1": "Lunes",
    "calendar.days.long.2": "Martes",
    "calendar.days.long.3": "Miércoles",
    "calendar.days.long.4": "Jueves",
    "calendar.days.long.5": "Viernes",
    "calendar.days.long.6": "Sábado",
    "calendar.recurrenceIntervalUnit.daily": "días",
    "calendar.recurrenceIntervalUnit.weekly": "semanas",
    "calendar.recurrenceIntervalUnit.monthly": "meses",
    "calendar.recurrenceIntervalUnit.yearly": "años",
    "featuredEvents": "Eventos Destacados",
    "upcomingEventsTitle": "Próximos Eventos",
    "viewAllEvents": "Ver todos los eventos",
    "loadingCalendar": "Cargando calendario...",
    "errorLoadingCalendar": "Error al cargar el calendario",
    "noEventsScheduled": "No hay eventos programados para este período.",
    "eventsFound": "evento(s) encontrado(s)",

    // ========================================
    // LIBRARY
    // ========================================
    "library.title": "Biblioteca Digital",
    "library.description": "¡Explora un mundo de conocimiento increíble! Encuentra libros, videos, audios y recursos súper geniales para aprender y crear cosas asombrosas",
    "library.addResource": "Agregar Recurso Genial",
    "library.stats": "¡Datos Súper Geniales!",
    "library.statsDescription": "Mira todo lo increíble que tenemos en nuestra biblioteca",
    "library.totalResources": "Total Recursos",
    "library.documents": "Documentos",
    "library.videos": "Videos",
    "library.downloads": "Descargas",
    "library.searchPlaceholder": "Busca recursos, autores, tags súper geniales...",
    "library.viewGrid": "Grid",
    "library.viewList": "Lista",
    "library.sortMostRecent": "Más recientes",
    "library.sortNameAZ": "Nombre A-Z",
    "library.sortMostPopular": "Más populares",
    "library.sortMostViewed": "Más vistos",
    "library.sortByYear": "Por año",
    "library.orderAsc": "Orden ascendente",
    "library.orderDesc": "Orden descendente",
    "library.findWhat": "¡Encuentra lo que Buscas!",
    "library.exploreResources": "Explora entre todos nuestros recursos increíbles",
    "library.nothingFound": "No encontramos nada súper genial",
    "library.showing": "Mostrando",
    "library.of": "de",
    "library.resources": "recursos súper geniales",
    "library.loading": "¡Cargando Recursos Increíbles!",
    "library.loadingMessage": "Preparando la mejor experiencia de aprendizaje para ti",
    "library.searchingContent": "Buscando contenido súper genial",
    "library.noResults": "¡Oops! No encontramos nada súper genial",
    "library.tryOtherTerms": "Intenta con otros términos de búsqueda o ajusta los filtros para encontrar algo súper genial.",
    "library.tags": "Etiquetas",
    "library.waitingForContent": "Biblioteca esperando contenido increíble",
    "library.soonContent": "Pronto tendremos recursos súper geniales para que explores y aprendas cosas increíbles.",
    "library.beFirst": "¡Sé el primero en compartir conocimiento increíble! Agrega el primer recurso y dale vida a esta biblioteca.",
    "library.addFirstResource": "Agregar el primer recurso genial",
    "library.epicDocuments": "¡Documentos épicos!",
    "library.amazingVideos": "¡Videos increíbles!",
    "library.superPopular": "¡Súper populares!",
    "library.awesomeResources": "¡Recursos geniales!",
    "library.resourceDetails": "Detalles del recurso",
    "library.resourceNotFound": "Recurso no encontrado",
    "library.editResource": "Editar recurso",
    "library.fileType": "Tipo de archivo",
    "library.fileSize": "Tamaño del archivo",
    "library.author": "Autor",
    "library.language": "Idioma",
    "library.year": "Año",
    "library.views": "Visualizaciones",
    "library.openResource": "Abrir recurso",
    "library.downloadResource": "Descargar recurso",
    "library.preview": "Vista previa",
    "library.audioPreview": "Escucha el recurso de audio",
    "library.previewUnavailable": "Vista previa no disponible",
    "library.previewUnavailableDescription": "Utiliza los botones para abrir o descargar el archivo en una nueva ventana.",
    "library.filePath": "Ruta del archivo",

    // ========================================
    // MATERIAL DE APOYO
    // ========================================
    "material.title": "Material de Apoyo",
    "material.description": "Explora nuestros proyectos educativos",
    "material.noMaterials": "No hay materiales disponibles",
    "material.createMaterial": "Crear Material de Apoyo",
    "material.pageTitle": "Proyectos",
    "material.pageDescription": "¡Descubre proyectos increíbles! Explora iniciativas que te ayudarán a aprender, crear y brillar como nunca antes",
    "material.createProject": "Crear Proyecto",
    "material.statisticsTitle": "¡Estadísticas Increíbles!",
    "material.statisticsSubtitle": "Mira todos los proyectos increíbles disponibles",
    "material.totalProjects": "Total Proyectos",
    "material.awesomeProjects": "¡Proyectos geniales!",
    "material.featured": "Destacados",
    "material.superPopular": "¡Súper populares!",
    "material.modules": "Módulos",
    "material.amazingModules": "¡Módulos increíbles!",
    "material.findPerfect": "¡Encuentra Tu Proyecto Perfecto!",
    "material.exploreAll": "Explora todos nuestros proyectos súper geniales",
    "material.searchPlaceholder": "🎓 Busca proyectos increíbles, encargados geniales...",
    "material.clearSearch": "Limpiar búsqueda",
    "material.onlyFeatured": "Solo destacados",
    "material.sortMostRecent": "🆕 Más recientes",
    "material.sortNameAZ": "🔤 Nombre A-Z",
    "material.sortByEducator": "👨‍🏫 Por encargado",
    "material.sortByModules": "📊 Por módulos",
    "material.orderAsc": "⬆️ Orden ascendente",
    "material.orderDesc": "⬇️ Orden descendente",
    "material.clearFilters": "Limpiar",
    "material.noProjectsFound": "No encontramos proyectos súper geniales",
    "material.showing": "Mostrando",
    "material.of": "de",
    "material.projectsIncredible": "proyectos increíbles",
    "material.totals": "totales",
    "material.loadingTitle": "¡Cargando Proyectos Increíbles!",
    "material.loadingSubtitle": "Preparando la mejor experiencia de aprendizaje para ti",
    "material.searchingProjects": "Buscando proyectos súper geniales",
    "material.emptyNoMatch": "¡Oops! No encontramos proyectos súper geniales",
    "material.emptyTryAgain": "Intenta con otros términos de búsqueda o ajusta los filtros para encontrar proyectos súper geniales.",
    "material.emptyWaitingTitle": "Esperando proyectos increíbles",
    "material.emptyBeFirst": "¡Sé el primero en crear un proyecto increíble! Agrega el primer proyecto y dale vida a esta plataforma.",
    "material.emptySoon": "Pronto tendremos proyectos súper geniales para que aprendas cosas increíbles y te conviertas en un experto.",
    "material.clearFiltersButton": "Limpiar filtros y empezar de nuevo",
    "material.createFirstProject": "Crear el primer proyecto",
    "material.projectsWaiting": "¡Proyectos Increíbles Esperándote!",
    "material.chooseAdventure": "Elige tu próxima aventura de aprendizaje",
    "material.goToFirstPage": "Ir a la primera página",
    "material.goToLastPage": "Ir a la última página",
    "material.previousPage": "Página anterior",
    "material.nextPage": "Página siguiente",
    "material.errorLoading": "Error al cargar el material de apoyo",

    // ========================================
    // DASHBOARD
    // ========================================
    "dashboard.welcome": "¡Bienvenido",
    "dashboard.accessMessage": "Accede a todos los recursos y actividades del centro cultural.",
    "dashboard.projects": "Proyectos",
    "dashboard.projectsDescription": "Material de apoyo educativo",
    "dashboard.blogTitle": "Blog",
    "dashboard.blogDescription": "Noticias y artículos",
    "dashboard.eventsTitle": "Eventos",
    "dashboard.eventsDescription": "Calendario de actividades",
    "dashboard.libraryTitle": "Biblioteca",
    "dashboard.libraryDescription": "Recursos y documentos",
    "dashboard.adminPanel": "Panel de Administración",
    "dashboard.userManagement": "Gestión de Usuarios",
    "dashboard.userManagementDescription": "Crear, editar y administrar usuarios",
    "dashboard.userManagementSupport": "Administra los usuarios que pueden acceder y colaborar en la plataforma",
    "dashboard.newUser": "Nuevo Usuario",
    "dashboard.userSearchPlaceholder": "Buscar usuarios...",
    "dashboard.userCreateButton": "Crear Usuario",
    "dashboard.userRetryButton": "Intentar de nuevo",
    "dashboard.userCreateFirstButton": "Crear primer usuario",
    "dashboard.userFilters.allRoles": "Todos los roles",
    "dashboard.userFilters.assistants": "Asistentes",
    "dashboard.userFilters.collaborators": "Colaboradores",
    "dashboard.userFilters.admins": "Administradores",
    "dashboard.userFilters.allStatuses": "Todos los estados",
    "dashboard.userFilters.active": "Activos",
    "dashboard.userFilters.inactive": "Inactivos",
    "dashboard.userSort.mostRecent": "Más recientes",
    "dashboard.userSort.oldest": "Más antiguos",
    "dashboard.userSort.nameAZ": "Nombre (A-Z)",
    "dashboard.userSort.usernameAZ": "Usuario (A-Z)",
    "dashboard.userSort.roleAZ": "Rol (A-Z)",
    "dashboard.createUser": "Crear Nuevo Usuario",
    "dashboard.editUser": "Editar Usuario",
    "dashboard.accessDenied": "Acceso Denegado",
    "dashboard.userManagementNoAccess": "No tienes permisos para gestionar usuarios.",
    "dashboard.userManagementBack": "Volver al Dashboard",
    "dashboard.analytics": "Estadísticas",
    "dashboard.analyticsDescription": "Análisis de uso y métricas",
    "dashboard.yourProfile": "Tu Perfil",
    "dashboard.username": "Usuario",
    "dashboard.fullName": "Nombre completo",
    "dashboard.role": "Rol",
    "dashboard.phone": "Teléfono",
    "dashboard.closeSession": "Cerrar Sesión",

    // ========================================
    // ANALYTICS
    // ========================================
    "analytics.metaTitle": "Estadísticas - Centro Cultural Víctor Jara",
    "analytics.backToDashboard": "Volver al Dashboard",
    "analytics.loading": "Cargando estadísticas...",
    "analytics.totalVisitors": "Total Visitantes",
    "analytics.totalDownloads": "Total Descargas",
    "analytics.totalResources": "Total Recursos",
    "analytics.totalResourcesHint": "Eventos, Proyectos, Módulos y Biblioteca",
    "analytics.visitorsChartTitle": "Visitantes (Últimos 30 días)",
    "analytics.topResourcesTitle": "Recursos Más Descargados",
    "analytics.tooltip.visitors": "{date}: {count} visitantes",
    "analytics.info.title": "Información sobre las estadísticas",
    "analytics.info.source": "Los datos se cargan directamente de la base de datos.",
    "analytics.info.visitors": "Total Visitantes: Visitantes únicos registrados en el sistema (basado en IP).",
    "analytics.info.downloads": "Total Descargas: Archivos multimedia descargados desde la plataforma.",
    "analytics.info.resources": "Total Recursos: Suma de eventos, proyectos, módulos e ítems de biblioteca activos.",

    // ========================================
    // USERS FORM
    // ========================================
    "users.form.username.label": "Nombre de Usuario",
    "users.form.username.placeholder": "Ej: juan.perez",
    "users.form.username.available": "Nombre de usuario disponible",
    "users.form.errors.usernameTaken": "Este nombre de usuario ya está en uso",
    "users.form.errors.usernameRequired": "El nombre de usuario es obligatorio",
    "users.form.errors.usernameTooShort": "El nombre de usuario debe tener al menos 3 caracteres",
    "users.form.errors.passwordRequired": "La contraseña es obligatoria",
    "users.form.errors.passwordTooShort": "La contraseña debe tener al menos 6 caracteres",
    "users.form.errors.passwordMismatch": "Las contraseñas no coinciden",
    "users.form.errors.nameRequired": "El nombre es obligatorio",
    "users.form.errors.lastNameRequired": "El apellido es obligatorio",
    "users.form.errors.roleRequired": "Debe seleccionar un rol",
    "users.form.name.label": "Nombre",
    "users.form.name.placeholder": "Ej: Juan",
    "users.form.lastName.label": "Apellido",
    "users.form.lastName.placeholder": "Ej: Pérez",
    "users.form.phone.label": "Teléfono",
    "users.form.phone.placeholder": "Ej: +57 300 123 4567",
    "users.form.password.sectionTitleCreate": "Contraseña",
    "users.form.password.sectionTitleEdit": "Cambiar Contraseña",
    "users.form.password.labelCreate": "Contraseña",
    "users.form.password.labelEdit": "Nueva Contraseña",
    "users.form.password.placeholder": "Mínimo 6 caracteres",
    "users.form.password.toggleChange": "Cambiar contraseña",
    "users.form.password.confirmLabel": "Confirmar Contraseña",
    "users.form.password.confirmPlaceholder": "Repetir contraseña",
    "users.form.permissions.title": "Permisos y Estado",
    "users.form.role.label": "Rol",
    "users.form.status.label": "Estado",
    "users.form.status.active": "Activo",
    "users.form.status.inactive": "Inactivo",
    "users.form.cancel": "Cancelar",
    "users.form.submitCreate": "Crear Usuario",
    "users.form.submitUpdate": "Actualizar Usuario",
    "users.form.submittingCreate": "Creando...",
    "users.form.submittingUpdate": "Actualizando...",
    "users.form.closeModal": "Cerrar formulario",

    // ========================================
    // USERS ACTIONS
    // ========================================
    "users.actions.activate": "Activar",
    "users.actions.deactivate": "Desactivar",
    "users.actions.resetPassword": "Restablecer contraseña",

    // ========================================
    // COMMON UI ELEMENTS
    // ========================================
    "common.loading": "Cargando...",
    "loading": "Cargando...",
    "common.success": "Éxito",
    "common.error": "Error",
    "common.search": "Buscar",
    "common.filter": "Filtrar",
    "common.sort": "Ordenar",
    "common.view": "Ver",
    "common.download": "Descargar",
    "common.clearSearch": "Limpiar búsqueda",
    "common.openMenu": "Abrir menú",
    "common.closeMenu": "Cerrar menú",
    "common.goToFirstPage": "Ir a la primera página",
    "common.goToLastPage": "Ir a la última página",
    "common.previousPage": "Página anterior",
    "common.nextPage": "Página siguiente",
    "common.closeError": "Cerrar mensaje de error",

    // ========================================
    // ERRORS
    // ========================================
    "error.generic": "Error desconocido",
    "error.loading_users": "Error cargando usuarios",
    "error.updating_role": "Error actualizando rol",
    "error.loading_categories": "Error cargando categorías",
    "error.saving_post": "Error al guardar el post",
    "error.loading_resources": "Error al cargar recursos de la biblioteca",
    "error.loading_resource_details": "Error al cargar los detalles del recurso",
    "error.downloading_file": "Error al descargar el archivo",
    "error.deleting_resource": "Error al eliminar el recurso",
    "error.loading_calendar": "Error al cargar el calendario",
    "error.loading_news": "Error al cargar la noticia",
    "error.loading_initial_data": "Error cargando datos iniciales",
    "error.loading_analytics": "Error cargando analytics",
    "error.loading_upcoming_events": "Error al cargar eventos próximos",
    "error.loading_featured_events": "Error al cargar eventos destacados",
    "loginError": "Error al iniciar sesión",
    "connectionError": "Error de conexión. Verifica que el servidor esté funcionando.",

    // ========================================
    // FOOTER
    // ========================================
    "footer.copyright": "Centro Cultural Víctor Jara",
    "footer.tagline": "Creando momentos mágicos de aprendizaje",
    "footerText": "Todos los derechos reservados",

    // ========================================
    // COURSE MANAGEMENT
    // ========================================
    "course.management": "Gestión de Proyectos",
    "course.authenticated_as": "Autenticado como",
    "course.not_authenticated": "No autenticado (modo de acceso público)",

    // ========================================
    // MODALS
    // ========================================
    "modal.sessionExpired": "Sesión Expirada",
    "modal.sessionExpiredMessage": "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    "modal.sessionWarning": "Advertencia de Sesión",
    "modal.sessionWarningMessage": "Tu sesión está a punto de expirar por inactividad. ¿Deseas continuar conectado?",
    "modal.sessionWarningCountdown": "La sesión se cerrará automáticamente si no respondes",
    "modal.continueSession": "Continuar Conectado",
    "modal.logout": "Cerrar Sesión",
    "modal.backToHome": "Volver al Inicio",
    "modal.closeModal": "Cerrar modal",
    "modal.confirmAction": "¿Confirmar acción?",
    "modal.confirmMessage": "¿Estás seguro de que deseas continuar?",
    "modal.confirm": "Confirmar",

    // ========================================
    // FILTERS
    // ========================================
    "filters.title": "Filtros Súper Geniales",
    "filters.active": "activos",
    "filters.clearAll": "Limpiar Todo",
    "filters.show": "Mostrar",
    "filters.hide": "Ocultar",
    "filters.activeFilters": "Filtros Activos",
    "filters.fileType": "Tipo de Archivo",
    "filters.category": "Categoría",
    "filters.author": "Autor",
    "filters.language": "Idioma",
    "filters.year": "Año de Publicación",
    "filters.tags": "Etiquetas",
    "filters.allAuthors": "Todos los autores",
    "filters.allLanguages": "Todos los idiomas",
    "filters.allYears": "Todos los años",
    "filters.noTags": "No hay etiquetas disponibles",
    "filters.fileType.image": "🖼️ Imágenes",
    "filters.fileType.video": "🎥 Videos",
    "filters.fileType.audio": "🎵 Audio",
    "filters.fileType.document": "📄 Documentos",
    "filters.category.victorJara": "🎸 Víctor Jara",
    "filters.category.nuevaCancion": "🎶 Nueva Canción",
    "filters.category.educacionPopular": "📚 Educación Popular",
    "filters.category.memoriaHistorica": "🏛️ Memoria Histórica",
    "filters.category.talleresEventos": "🎭 Talleres y Eventos",
    "filters.category.archivoPrensa": "📰 Archivo de Prensa",
    "filters.category.audiovisual": "🎬 Audiovisual",
    "filters.category.literatura": "📖 Literatura",
    "filters.category.general": "📁 General",
    "filters.category.historia": "📜 Historia",
    "filters.category.musica": "🎵 Música",
    "filters.category.arte": "🎨 Arte",
    "filters.category.cine": "🎬 Cine",

    // ========================================
    // EVENTS WIDGET
    // ========================================
    "events.upcoming": "Próximos Eventos",
    "events.viewAll": "Ver todo",
    "events.viewFullCalendar": "Ver calendario completo",
    "events.noUpcoming": "No hay eventos próximos",
    "events.today": "Hoy",
    "events.tomorrow": "Mañana",
    "events.organizer": "Por",
    "events.viewAllMonth": "Ver todos los eventos del mes",

    // ========================================
    // MISC
    // ========================================
    "createArticle": "Crear Artículo",
    "deleteConfirm": "¿Estás seguro de que quieres eliminar este recurso?"
  },

  en: {
    // ========================================
    // SITE METADATA & BRANDING
    // ========================================
    "centroTitle": "Víctor Jara Cultural Center",
    "centroDescription": "Víctor Jara Cultural Center - Community Learning Network",
    "centroPurpose": "Explore, learn and create in our community learning network",

    // ========================================
    // NAVIGATION
    // ========================================
    "home": "Home",
    "blog": "Blog",
    "calendar": "Calendar",
    "library": "Library",
    "materialApoyo": "Support Material",
    "logout": "Logout",
    "login": "Login",
    "panel": "Panel",
    "panelAdmin": "Admin Panel",

    // ========================================
    // AUTH & PERMISSIONS
    // ========================================
    "auth.no_permissions_create": "You don't have permission to create blog posts. You need to be a Collaborator or Administrator.",
    "auth.no_permissions_edit": "You don't have permission to edit blog posts. You need to be a Collaborator or Administrator.",
    "auth.no_permissions_delete": "You don't have permission to delete posts.",
    "auth.no_permissions_role_management": "You don't have permission to manage user roles. This function is available only for Administrators.",
    "auth.no_permissions_create_events": "You don't have permission to create events. Contact the administrator.",
    "auth.login_required": "You must log in to perform this action.",
    "auth.own_posts_only": "You can only edit your own posts or be an Administrator.",

    // LOGIN
    "login.title": "Log In",
    "login.subtitle": "Access with your Cultural Center account, only for authorized users",
    "login.usernameLabel": "Username",
    "login.passwordLabel": "Password",
    "login.usernamePlaceholder": "Enter your username",
    "login.passwordPlaceholder": "Enter your password",
    "login.submit": "Log In",
    "login.submitting": "Signing in...",
    "login.errorMissingCredentials": "Please enter both username and password.",
    "login.errorGeneric": "Unable to sign in. Please try again.",
    "login.errorConnection": "Connection error. Please try again.",
    "login.sessionExpired": "Your session has expired. Please log in again.",
    "login.supportMessage": "Having trouble accessing? Contact the administrator.",

    // ========================================
    // ACTIONS
    // ========================================
    "action.create": "Create",
    "action.edit": "Edit",
    "action.delete": "Delete",
    "action.save": "Save",
    "action.cancel": "Cancel",
    "action.update": "Update",
    "action.close": "Close",
    "action.retry": "Retry",
    "action.back": "Back",
    "action.clearFilters": "Clear filters and start over",

    // ========================================
    // HOME PAGE
    // ========================================
    "welcome": "Welcome!",
    "startLearning": "Start Learning",
    "educatorLogin": "Educator Access",
    "educatorDashboard": "Educator Dashboard",
    "createContent": "Create Content",
    "myMaterials": "My Materials",
    "exploreLibrary": "Explore Library",
    "availableCourses": "Available Projects",
    "totalModules": "Total Modules",
    "recentNews": "Recent News",
    "uniqueVisitors": "Unique Visitors",
    "latestNews": "Latest News",
    "stayUpdated": "Stay up to date with the latest news from the center",
    "noBlogPostsYet": "No news yet",
    "noBlogPostsMessage": "We're working on super cool content to share with you very soon!",
    "viewAllNews": "View All News",
    "upcomingEvents": "Upcoming Events",
    "upcomingEventsMessage": "Don't miss the most fun events at the center!",
    "viewCalendar": "View Full Calendar",
    "educationalMaterials": "Educational Materials",
    "accessCourseMaterials": "Access super cool resources to learn and create",
    "accessMaterials": "Access Materials",
    "quickActions": "Quick Actions",
    "exploreAllProjects": "Explore All Projects",
    "viewLibrary": "View Library",
    "featuredCourses": "Featured Projects",
    "exploreCourseOfferings": "Explore our selection of the most popular and amazing projects",
    "exploreCourseMaterials": "Explore Project Materials",
    "viewAllCourses": "View All Projects",
    "viewResource": "View Resource",
    "noCoursesYet": "No projects yet",
    "noCoursesMessage": "We're preparing amazing educational materials for you!",
    "noLibraryItemsYet": "No resources yet",
    "noLibraryItemsMessage": "We'll add educational resources to the library soon",
    "aboutCenter": "About the Center",
    "centerDescription1": "The Víctor Jara Cultural Center is a community learning network dedicated to promoting education, culture and art in our community.",
    "centerDescription2": "We offer a wide variety of courses, workshops and educational resources designed to support the personal and professional development of all our members.",
    "noInternetRequired": "No Internet Required",
    "localNetworkExplanation": "All resources are available on the center's local network, facilitating access without an internet connection.",
    "readyForAdventure": "Ready for Adventure?",
    "joinCommunityText": "Join our learning community and start your educational journey today",
    "exploreCourses": "Explore Projects",
    "readLatestNews": "Read Latest News",
    "adventureStartsNow": "Your learning adventure starts NOW!",
    "modules": "modules",
    "module": "module",

    // ========================================
    // BLOG
    // ========================================
    "newsAndAnnouncements": "News and Announcements",
    "blogDescription": "Stay informed with the latest news and announcements from Víctor Jara Cultural Center",
    "newsArticle": "Article",
    "articleNotFound": "Article not found",
    "backToNews": "Back to news",
    "videoNotSupported": "Your browser does not support video.",
    "audioNotSupported": "Your browser does not support audio.",
    "newsPost": "News",
    "readMore": "Read more",
    "readMoreNews": "Read more news",
    "relatedEvents": "Related Events",
    "featured": "Featured",

    // Blog Page
    "blog.article_deleted_success": "Article deleted successfully",
    "blog.error_deleting_article": "Error deleting article",
    "blog.delete_article_title": "Delete Article",
    "blog.delete_article_confirm": "Are you sure you want to delete the article '{title}'? This action cannot be undone.",
    "blog.untitled": "Untitled",

    // Blog Post Card
    "blog.news_badge": "📰 NEWS",
    "blog.media_file": "Media file",
    "blog.edit_post": "Edit post",
    "blog.delete_post": "Delete post",

    // Blog Post List
    "blog.error_loading_posts": "Error loading posts",
    "blog.article_management": "Article Management",
    "blog.article_singular": "article",
    "blog.article_plural": "articles",
    "blog.create_article": "Create Article",
    "blog.loading_articles": "Loading articles...",
    "blog.error_loading_articles_header": "Error loading articles",
    "blog.retry": "Try again",
    "blog.no_articles_yet": "No articles yet",
    "blog.create_first_article_description": "Start by creating your first blog article",
    "blog.create_first_article": "Create First Article",

    // Blog Post Form - Validation
    "blog.title_required": "⚠️ Title is required",
    "blog.complete_required_fields": "❌ Please complete all required fields",
    "blog.add_at_least_one_element": "⚠️ Must add at least one element to the article",
    "blog.article_needs_content": "❌ The article needs content to be published",
    "blog.text_elements_not_empty": "⚠️ Text elements cannot be empty",
    "blog.some_elements_incomplete": "❌ Some elements are incomplete",
    "blog.multimedia_requires_file": "⚠️ Multimedia elements require a file",
    "blog.missing_required_files": "❌ Some required files are missing",

    // Blog Post Form - Success Messages
    "blog.article_updated_success": "✅ Article \"{title}\" updated successfully",
    "blog.article_created_success": "✅ Article \"{title}\" created successfully",

    // Blog Post Form - Error Messages
    "blog.session_expired": "Your session has expired. Please log in again.",
    "blog.article_duplicate_title": "⚠️ An article with that title already exists. Please use a different title.",
    "blog.article_slug_error": "⚠️ Error with article title. Please choose a different title.",
    "blog.error_saving_article": "❌ Error {action} article",

    // Blog Post Form - UI Elements
    "blog.edit_article": "Edit Article",
    "blog.create_new_article": "Create New Article",
    "blog.new_title": "New title",
    "blog.new_text": "New text",
    "blog.article_information": "Article Information",
    "blog.article_title": "Article Title *",
    "blog.article_title_placeholder": "Article title",
    "blog.article_content": "Article Content",
    "blog.add_elements_instruction": "Add elements to create your article content",
    "blog.elements_hint": "You can add titles, text, images, videos, audios and documents in any order",
    "blog.no_content": "No content",
    "blog.files_organized_hint": "💡 Files will be organized automatically when you save the article.",
    "blog.related_events_section": "Related Events",
    "blog.related_events_description": "Relate this article with calendar events so visitors can see linked content.",
    "blog.uploading_files": "Uploading files... ({count})",
    "blog.updating": "Updating...",
    "blog.creating": "Creating...",
    "blog.update_article": "Update Article",
    "blog.cancel": "Cancel",

    // Blog Post Form - Element Types
    "blog.title_button": "Title",
    "blog.text_button": "Text",
    "blog.image_button": "Image",
    "blog.video_button": "Video",
    "blog.audio_button": "Audio",
    "blog.document_button": "Document",
    "blog.title_badge": "Title",
    "blog.text_badge": "Text",
    "blog.image_badge": "Image",
    "blog.video_badge": "Video",
    "blog.audio_badge": "Audio",
    "blog.document_badge": "Document",
    "blog.enter_title": "Enter title...",
    "blog.enter_text": "Enter text...",

    // Blog Event Relations
    "blog.error_loading_events": "Error loading events",
    "blog.related_events_count": "Related Events ({count})",
    "blog.remove_event": "Remove event",
    "blog.relate_to_events": "Relate to Events",
    "blog.add_more_events": "Add More Events",
    "blog.search_events": "Search events by title...",
    "blog.no_events_found": "No events found",
    "blog.no_events_available": "No events available",
    "blog.selected": "✓ Selected",
    "blog.select_events_help": "Select the events you want to relate to this blog article",

    // Media Uploader
    "blog.invalid_file_type": "Invalid file type for {mediaType}",
    "blog.file_too_large": "File too large (max. {maxSize}MB for {mediaType})",
    "blog.error_uploading_file": "Error uploading file",
    "blog.error_deleting_image": "Error deleting image",
    "blog.video_not_supported": "Video not supported",
    "blog.audio_not_supported": "Audio not supported",
    "blog.pdf_document": "PDF Document",
    "blog.view_document": "View document",
    "blog.word_document": "Word Document",
    "blog.excel_spreadsheet": "Excel Spreadsheet",
    "blog.powerpoint_presentation": "PowerPoint Presentation",
    "blog.document": "Document",
    "blog.download_file": "Download file",
    "blog.uploaded_file": "Uploaded file",
    "blog.remove": "Remove",
    "blog.uploading": "Uploading {mediaType}...",
    "blog.select_file": "Select a {mediaType} file",
    "blog.formats_image": "Formats: JPG, PNG, GIF, WebP, SVG, AVIF, BMP, TIFF (max. 200MB)",
    "blog.formats_video": "Formats: MP4, WebM, MOV, AVI, MKV (max. 500MB)",
    "blog.formats_audio": "Formats: MP3, WAV, OGG, FLAC, AAC (max. 100MB)",
    "blog.formats_pdf": "Format: PDF (max. 50MB)",
    "blog.formats_document": "Formats: PDF, Word (DOC/DOCX), Excel (XLS/XLSX), PowerPoint (PPT/PPTX) (max. 1GB)",
    "blog.select_media": "Select {mediaType}",
    "blog.change_media": "Change {mediaType}",

    // ========================================
    // CALENDAR & EVENTS
    // ========================================
    "calendarTitle": "Events Calendar",
    "calendarDescription": "Discover all the amazing activities, classes and events we have prepared for you at our cultural center",
    "createEvent": "Create Event",
    "list": "List",
    "today": "Today",
    "calendar.form.create_title": "Create New Event",
    "calendar.form.create_subtitle": "Schedule a new activity on the cultural center calendar",
    "calendar.form.edit_title": "Edit Event",
    "calendar.form.edit_subtitle": "Update your event details",
    "calendar.form.section_basic": "Basic Information",
    "calendar.form.title_label": "Event title",
    "calendar.form.title_placeholder": "Ex: Kids Theater Workshop",
    "calendar.form.characters": "characters",
    "calendar.form.event_type": "Event Type",
    "calendar.form.location": "Location",
    "calendar.form.location_placeholder": "Ex: Main Hall, Events Room",
    "calendar.form.description_label": "Description",
    "calendar.form.description_placeholder": "Describe the event, activities, goals, and anything participants should know...",
    "calendar.form.section_schedule": "Dates & Times",
    "calendar.form.all_day": "All-day event",
    "calendar.form.start_label": "Start Date",
    "calendar.form.end_label_optional": "End Date/Time (optional)",
    "calendar.form.end_label_recurring": "Repeat Until",
    "calendar.form.end_help_recurring": "Final date through which this event will repeat",
    "calendar.form.end_help_single": "When this event ends (e.g., workshop from 10am to 12pm)",
    "calendar.form.section_recurrence": "Recurrence",
    "calendar.form.recurrence_toggle": "Recurring event",
    "calendar.form.recurrence_help": "Recurring events will repeat automatically based on the selected pattern",
    "calendar.form.recurrence_pattern": "Recurrence Pattern",
    "calendar.form.recurrence_interval": "Every",
    "calendar.form.recurrence_interval_hint": "Set how many periods should pass between each occurrence.",
    "calendar.form.recurrence_days_label": "Days of the Week",
    "calendar.form.recurrence_days_help": "Select the days on which the event will repeat",
    "calendar.form.section_links": "Related Links",
    "calendar.form.project_label": "Related Project",
    "calendar.form.project_help": "Link this event to a specific project",
    "calendar.form.blog_label": "Related Blog Article",
    "calendar.form.blog_help": "Link this event to a blog article (announcements, context, etc.)",
    "calendar.form.section_special": "Special Settings",
    "calendar.form.featured_label": "Mark as featured event",
    "calendar.form.featured_help": "Featured events appear on the homepage and gain more visibility",
    "calendar.form.none": "None",
    "calendar.form.cancel": "Cancel",
    "calendar.form.save_create": "Create Event",
    "calendar.form.save_update": "Update Event",
    "calendar.form.saving": "Saving...",
    "calendar.form.error_title_required": "Title is required",
    "calendar.form.error_start_required": "Start date is required",
    "calendar.form.error_end_required_recurring": "For recurring events, specify until when it repeats",
    "calendar.form.error_end_after_start": "The end date must be after the start date",
    "calendar.form.error_recurrence_pattern": "Please choose a recurrence pattern",
    "calendar.create.meta_description": "Create a new event for the Centro Cultural Víctor Jara calendar",
    "calendar.create.breadcrumb_current": "Create Event",
    "calendar.create.error_heading": "Error creating the event",
    "calendar.create.error_generic": "Error creating the event",
    "calendar.create.loading": "Creating event...",
    "calendar.create.tips_title": "Tips to create an awesome event",
    "calendar.create.tip_1": "Use a descriptive and attractive title that grabs attention",
    "calendar.create.tip_2": "Include a detailed description of the content and goals",
    "calendar.create.tip_3": "Clearly specify the location and schedule",
    "calendar.create.tip_4": "If registration is required, set an appropriate deadline",
    "calendar.create.tip_5": "Link the event to projects or blog posts when relevant",
    "calendar.create.tip_6": "Consider marking special or important events as featured",
    "calendar.create.tip_7": "For recurring events, double-check the recurrence pattern",
    "calendar.months.0": "January",
    "calendar.months.1": "February",
    "calendar.months.2": "March",
    "calendar.months.3": "April",
    "calendar.months.4": "May",
    "calendar.months.5": "June",
    "calendar.months.6": "July",
    "calendar.months.7": "August",
    "calendar.months.8": "September",
    "calendar.months.9": "October",
    "calendar.months.10": "November",
    "calendar.months.11": "December",
    "calendar.days.0": "Sun",
    "calendar.days.1": "Mon",
    "calendar.days.2": "Tue",
    "calendar.days.3": "Wed",
    "calendar.days.4": "Thu",
    "calendar.days.5": "Fri",
    "calendar.days.6": "Sat",
    "eventTypes": "Event Types",
    "eventType.class": "Class",
    "eventType.workshop": "Workshop",
    "eventType.conference": "Conference",
    "eventType.event": "Event",
    "eventType.general": "General",
    "eventType.other": "Other",
    "calendar.recurrence.none": "Not recurring",
    "calendar.recurrence.daily": "Daily",
    "calendar.recurrence.weekly": "Weekly",
    "calendar.recurrence.monthly": "Monthly",
    "calendar.recurrence.yearly": "Yearly",
    "calendar.days.long.0": "Sunday",
    "calendar.days.long.1": "Monday",
    "calendar.days.long.2": "Tuesday",
    "calendar.days.long.3": "Wednesday",
    "calendar.days.long.4": "Thursday",
    "calendar.days.long.5": "Friday",
    "calendar.days.long.6": "Saturday",
    "calendar.recurrenceIntervalUnit.daily": "days",
    "calendar.recurrenceIntervalUnit.weekly": "weeks",
    "calendar.recurrenceIntervalUnit.monthly": "months",
    "calendar.recurrenceIntervalUnit.yearly": "years",
    "featuredEvents": "Featured Events",
    "upcomingEventsTitle": "Upcoming Events",
    "viewAllEvents": "View all events",
    "loadingCalendar": "Loading calendar...",
    "errorLoadingCalendar": "Error loading calendar",
    "noEventsScheduled": "No events scheduled for this period.",
    "eventsFound": "event(s) found",

    // ========================================
    // LIBRARY
    // ========================================
    "library.title": "Digital Library",
    "library.description": "Explore an incredible world of knowledge! Find books, videos, audios and super cool resources to learn and create amazing things",
    "library.addResource": "Add Cool Resource",
    "library.stats": "Super Cool Stats!",
    "library.statsDescription": "See all the amazing things we have in our library",
    "library.totalResources": "Total Resources",
    "library.documents": "Documents",
    "library.videos": "Videos",
    "library.downloads": "Downloads",
    "library.searchPlaceholder": "Search for resources, authors, super cool tags...",
    "library.viewGrid": "Grid",
    "library.viewList": "List",
    "library.sortMostRecent": "Most recent",
    "library.sortNameAZ": "Name A-Z",
    "library.sortMostPopular": "Most popular",
    "library.sortMostViewed": "Most viewed",
    "library.sortByYear": "By year",
    "library.orderAsc": "Ascending order",
    "library.orderDesc": "Descending order",
    "library.findWhat": "Find What You're Looking For!",
    "library.exploreResources": "Explore all our incredible resources",
    "library.nothingFound": "We didn't find anything super cool",
    "library.showing": "Showing",
    "library.of": "of",
    "library.resources": "super cool resources",
    "library.loading": "Loading Incredible Resources!",
    "library.loadingMessage": "Preparing the best learning experience for you",
    "library.searchingContent": "Searching for super cool content",
    "library.noResults": "Oops! We didn't find anything super cool",
    "library.tryOtherTerms": "Try other search terms or adjust the filters to find something super cool.",
    "library.tags": "Tags",
    "library.waitingForContent": "Library waiting for incredible content",
    "library.soonContent": "We'll soon have super cool resources for you to explore and learn amazing things.",
    "library.beFirst": "Be the first to share incredible knowledge! Add the first resource and bring this library to life.",
    "library.addFirstResource": "Add the first cool resource",
    "library.epicDocuments": "Epic documents!",
    "library.amazingVideos": "Amazing videos!",
    "library.superPopular": "Super popular!",
    "library.awesomeResources": "Awesome resources!",
    "library.resourceDetails": "Resource details",
    "library.resourceNotFound": "Resource not found",
    "library.editResource": "Edit resource",
    "library.fileType": "File type",
    "library.fileSize": "File size",
    "library.author": "Author",
    "library.language": "Language",
    "library.year": "Year",
    "library.views": "Views",
    "library.openResource": "Open resource",
    "library.downloadResource": "Download resource",
    "library.preview": "Preview",
    "library.audioPreview": "Listen to the audio resource",
    "library.previewUnavailable": "Preview not available",
    "library.previewUnavailableDescription": "Use the buttons to open or download the file in a new window.",
    "library.filePath": "File path",

    // ========================================
    // MATERIAL DE APOYO
    // ========================================
    "material.title": "Support Material",
    "material.description": "Explore our educational projects",
    "material.noMaterials": "No materials available",
    "material.createMaterial": "Create Support Material",
    "material.pageTitle": "Projects",
    "material.pageDescription": "Discover amazing projects! Explore initiatives that will help you learn, create and shine like never before",
    "material.createProject": "Create Project",
    "material.statisticsTitle": "Incredible Statistics!",
    "material.statisticsSubtitle": "See all the amazing projects available",
    "material.totalProjects": "Total Projects",
    "material.awesomeProjects": "Awesome projects!",
    "material.featured": "Featured",
    "material.superPopular": "Super popular!",
    "material.modules": "Modules",
    "material.amazingModules": "Amazing modules!",
    "material.findPerfect": "Find Your Perfect Project!",
    "material.exploreAll": "Explore all our super cool projects",
    "material.searchPlaceholder": "🎓 Search amazing projects, awesome educators...",
    "material.clearSearch": "Clear search",
    "material.onlyFeatured": "Only featured",
    "material.sortMostRecent": "🆕 Most recent",
    "material.sortNameAZ": "🔤 Name A-Z",
    "material.sortByEducator": "👨‍🏫 By educator",
    "material.sortByModules": "📊 By modules",
    "material.orderAsc": "⬆️ Ascending order",
    "material.orderDesc": "⬇️ Descending order",
    "material.clearFilters": "Clear",
    "material.noProjectsFound": "We didn't find any super cool projects",
    "material.showing": "Showing",
    "material.of": "of",
    "material.projectsIncredible": "amazing projects",
    "material.totals": "total",
    "material.loadingTitle": "Loading Amazing Projects!",
    "material.loadingSubtitle": "Preparing the best learning experience for you",
    "material.searchingProjects": "Searching for super cool projects",
    "material.emptyNoMatch": "Oops! We didn't find any super cool projects",
    "material.emptyTryAgain": "Try other search terms or adjust the filters to find super cool projects.",
    "material.emptyWaitingTitle": "Waiting for amazing projects",
    "material.emptyBeFirst": "Be the first to create an amazing project! Add the first project and bring this platform to life.",
    "material.emptySoon": "We'll soon have super cool projects for you to learn amazing things and become an expert.",
    "material.clearFiltersButton": "Clear filters and start over",
    "material.createFirstProject": "Create the first project",
    "material.projectsWaiting": "Amazing Projects Waiting for You!",
    "material.chooseAdventure": "Choose your next learning adventure",
    "material.goToFirstPage": "Go to first page",
    "material.goToLastPage": "Go to last page",
    "material.previousPage": "Previous page",
    "material.nextPage": "Next page",
    "material.errorLoading": "Error loading support material",

    // ========================================
    // DASHBOARD
    // ========================================
    "dashboard.welcome": "Welcome",
    "dashboard.accessMessage": "Access all the center's resources and activities.",
    "dashboard.projects": "Projects",
    "dashboard.projectsDescription": "Educational support material",
    "dashboard.blogTitle": "Blog",
    "dashboard.blogDescription": "News and articles",
    "dashboard.eventsTitle": "Events",
    "dashboard.eventsDescription": "Activities calendar",
    "dashboard.libraryTitle": "Library",
    "dashboard.libraryDescription": "Resources and documents",
    "dashboard.adminPanel": "Administration Panel",
    "dashboard.userManagement": "User Management",
    "dashboard.userManagementDescription": "Create, edit and manage users",
    "dashboard.userManagementSupport": "Manage the users who can access and collaborate in the platform",
    "dashboard.newUser": "New User",
    "dashboard.userSearchPlaceholder": "Search users...",
    "dashboard.userCreateButton": "Create User",
    "dashboard.userRetryButton": "Try again",
    "dashboard.userCreateFirstButton": "Create first user",
    "dashboard.userFilters.allRoles": "All roles",
    "dashboard.userFilters.assistants": "Assistants",
    "dashboard.userFilters.collaborators": "Collaborators",
    "dashboard.userFilters.admins": "Administrators",
    "dashboard.userFilters.allStatuses": "All statuses",
    "dashboard.userFilters.active": "Active",
    "dashboard.userFilters.inactive": "Inactive",
    "dashboard.userSort.mostRecent": "Most recent",
    "dashboard.userSort.oldest": "Oldest",
    "dashboard.userSort.nameAZ": "Name (A-Z)",
    "dashboard.userSort.usernameAZ": "Username (A-Z)",
    "dashboard.userSort.roleAZ": "Role (A-Z)",
    "dashboard.createUser": "Create New User",
    "dashboard.editUser": "Edit User",
    "dashboard.accessDenied": "Access Denied",
    "dashboard.userManagementNoAccess": "You do not have permission to manage users.",
    "dashboard.userManagementBack": "Back to Dashboard",
    "dashboard.analytics": "Analytics",
    "dashboard.analyticsDescription": "Usage analysis and metrics",
    "dashboard.yourProfile": "Your Profile",
    "dashboard.username": "Username",
    "dashboard.fullName": "Full name",
    "dashboard.role": "Role",
    "dashboard.phone": "Phone",
    "dashboard.closeSession": "Close Session",

    // ========================================
    // ANALYTICS
    // ========================================
    "analytics.metaTitle": "Analytics - Centro Cultural Víctor Jara",
    "analytics.backToDashboard": "Back to Dashboard",
    "analytics.loading": "Loading analytics...",
    "analytics.totalVisitors": "Total Visitors",
    "analytics.totalDownloads": "Total Downloads",
    "analytics.totalResources": "Total Resources",
    "analytics.totalResourcesHint": "Events, Projects, Modules and Library",
    "analytics.visitorsChartTitle": "Visitors (Last 30 days)",
    "analytics.topResourcesTitle": "Most Downloaded Resources",
    "analytics.tooltip.visitors": "{date}: {count} visitors",
    "analytics.info.title": "Statistics information",
    "analytics.info.source": "Data is loaded directly from the database.",
    "analytics.info.visitors": "Total Visitors: Unique visitors registered in the system (based on IP).",
    "analytics.info.downloads": "Total Downloads: Media files downloaded from the platform.",
    "analytics.info.resources": "Total Resources: Sum of active events, projects, modules and library items.",

    // ========================================
    // USERS FORM
    // ========================================
    "users.form.username.label": "Username",
    "users.form.username.placeholder": "Eg: john.doe",
    "users.form.username.available": "Username available",
    "users.form.errors.usernameTaken": "That username is already in use",
    "users.form.errors.usernameRequired": "Username is required",
    "users.form.errors.usernameTooShort": "Username must be at least 3 characters",
    "users.form.errors.passwordRequired": "Password is required",
    "users.form.errors.passwordTooShort": "Password must be at least 6 characters",
    "users.form.errors.passwordMismatch": "Passwords do not match",
    "users.form.errors.nameRequired": "First name is required",
    "users.form.errors.lastNameRequired": "Last name is required",
    "users.form.errors.roleRequired": "You must select a role",
    "users.form.name.label": "First Name",
    "users.form.name.placeholder": "Eg: John",
    "users.form.lastName.label": "Last Name",
    "users.form.lastName.placeholder": "Eg: Doe",
    "users.form.phone.label": "Phone",
    "users.form.phone.placeholder": "Eg: +57 300 123 4567",
    "users.form.password.sectionTitleCreate": "Password",
    "users.form.password.sectionTitleEdit": "Change Password",
    "users.form.password.labelCreate": "Password",
    "users.form.password.labelEdit": "New Password",
    "users.form.password.placeholder": "Minimum 6 characters",
    "users.form.password.toggleChange": "Change password",
    "users.form.password.confirmLabel": "Confirm Password",
    "users.form.password.confirmPlaceholder": "Repeat password",
    "users.form.permissions.title": "Permissions and Status",
    "users.form.role.label": "Role",
    "users.form.status.label": "Status",
    "users.form.status.active": "Active",
    "users.form.status.inactive": "Inactive",
    "users.form.cancel": "Cancel",
    "users.form.submitCreate": "Create User",
    "users.form.submitUpdate": "Update User",
    "users.form.submittingCreate": "Creating...",
    "users.form.submittingUpdate": "Updating...",
    "users.form.closeModal": "Close form",

    // ========================================
    // USERS ACTIONS
    // ========================================
    "users.actions.activate": "Activate",
    "users.actions.deactivate": "Deactivate",
    "users.actions.resetPassword": "Reset password",

    // ========================================
    // COMMON UI ELEMENTS
    // ========================================
    "common.loading": "Loading...",
    "loading": "Loading...",
    "common.success": "Success",
    "common.error": "Error",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.sort": "Sort",
    "common.view": "View",
    "common.download": "Download",
    "common.clearSearch": "Clear search",
    "common.openMenu": "Open menu",
    "common.closeMenu": "Close menu",
    "common.goToFirstPage": "Go to first page",
    "common.goToLastPage": "Go to last page",
    "common.previousPage": "Previous page",
    "common.nextPage": "Next page",
    "common.closeError": "Close error message",

    // ========================================
    // ERRORS
    // ========================================
    "error.generic": "Unknown error",
    "error.loading_users": "Error loading users",
    "error.updating_role": "Error updating role",
    "error.loading_categories": "Error loading categories",
    "error.saving_post": "Error saving post",
    "error.loading_resources": "Error loading library resources",
    "error.loading_resource_details": "Error loading resource details",
    "error.downloading_file": "Error downloading file",
    "error.deleting_resource": "Error deleting resource",
    "error.loading_calendar": "Error loading calendar",
    "error.loading_news": "Error loading news",
    "error.loading_initial_data": "Error loading initial data",
    "error.loading_analytics": "Error loading analytics",
    "error.loading_upcoming_events": "Error loading upcoming events",
    "error.loading_featured_events": "Error loading featured events",
    "loginError": "Login error",
    "connectionError": "Connection error. Please verify that the server is running.",

    // ========================================
    // FOOTER
    // ========================================
    "footer.copyright": "Víctor Jara Cultural Center",
    "footer.tagline": "Creating magical learning moments",
    "footerText": "All rights reserved",

    // ========================================
    // COURSE MANAGEMENT
    // ========================================
    "course.management": "Project Management",
    "course.authenticated_as": "Authenticated as",
    "course.not_authenticated": "Not authenticated (public access mode)",

    // ========================================
    // MODALS
    // ========================================
    "modal.sessionExpired": "Session Expired",
    "modal.sessionExpiredMessage": "Your session has expired. Please log in again.",
    "modal.sessionWarning": "Session Warning",
    "modal.sessionWarningMessage": "Your session is about to expire due to inactivity. Do you want to stay connected?",
    "modal.sessionWarningCountdown": "The session will close automatically if you don't respond",
    "modal.continueSession": "Stay Connected",
    "modal.logout": "Log Out",
    "modal.backToHome": "Back to Home",
    "modal.closeModal": "Close modal",
    "modal.confirmAction": "Confirm action?",
    "modal.confirmMessage": "Are you sure you want to continue?",
    "modal.confirm": "Confirm",

    // ========================================
    // FILTERS
    // ========================================
    "filters.title": "Super Cool Filters",
    "filters.active": "active",
    "filters.clearAll": "Clear All",
    "filters.show": "Show",
    "filters.hide": "Hide",
    "filters.activeFilters": "Active Filters",
    "filters.fileType": "File Type",
    "filters.category": "Category",
    "filters.author": "Author",
    "filters.language": "Language",
    "filters.year": "Publication Year",
    "filters.tags": "Tags",
    "filters.allAuthors": "All authors",
    "filters.allLanguages": "All languages",
    "filters.allYears": "All years",
    "filters.noTags": "No tags available",
    "filters.fileType.image": "🖼️ Images",
    "filters.fileType.video": "🎥 Videos",
    "filters.fileType.audio": "🎵 Audio",
    "filters.fileType.document": "📄 Documents",
    "filters.category.victorJara": "🎸 Víctor Jara",
    "filters.category.nuevaCancion": "🎶 Nueva Canción",
    "filters.category.educacionPopular": "📚 Popular Education",
    "filters.category.memoriaHistorica": "🏛️ Historical Memory",
    "filters.category.talleresEventos": "🎭 Workshops and Events",
    "filters.category.archivoPrensa": "📰 Press Archive",
    "filters.category.audiovisual": "🎬 Audiovisual",
    "filters.category.literatura": "📖 Literature",
    "filters.category.general": "📁 General",
    "filters.category.historia": "📜 History",
    "filters.category.musica": "🎵 Music",
    "filters.category.arte": "🎨 Art",
    "filters.category.cine": "🎬 Cinema",

    // ========================================
    // EVENTS WIDGET
    // ========================================
    "events.upcoming": "Upcoming Events",
    "events.viewAll": "View all",
    "events.viewFullCalendar": "View full calendar",
    "events.noUpcoming": "No upcoming events",
    "events.today": "Today",
    "events.tomorrow": "Tomorrow",
    "events.organizer": "By",
    "events.viewAllMonth": "View all events this month",

    // ========================================
    // MISC
    // ========================================
    "createArticle": "Create Article",
    "deleteConfirm": "Are you sure you want to delete this resource?"
  }
};

// ============================================
// STORE REACTIVO PARA EL IDIOMA ACTUAL
// ============================================

const STORAGE_KEY = 'ccpvj_locale';
const DEFAULT_LOCALE: Locale = 'es';

// Obtener idioma inicial
function getInitialLocale(): Locale {
  if (browser) {
    // Intentar obtener de localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'es' || stored === 'en') {
      return stored;
    }
  }
  return DEFAULT_LOCALE;
}

// Store reactivo
export const locale = writable<Locale>(getInitialLocale());

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

/**
 * Obtiene el idioma actual
 */
export function getLocale(): Locale {
  let currentLocale: Locale = DEFAULT_LOCALE;
  locale.subscribe(value => currentLocale = value)();
  return currentLocale;
}

/**
 * Cambia el idioma y recarga la página
 * La recarga es necesaria para que los componentes con traducciones no reactivas
 * se actualicen correctamente al nuevo idioma
 */
export function setLocale(newLocale: Locale): void {
  locale.set(newLocale);
  if (browser) {
    localStorage.setItem(STORAGE_KEY, newLocale);
    // Recargar página para aplicar el nuevo idioma en componentes
    window.location.reload();
  }
}

/**
 * Función de traducción NO reactiva (para usar en scripts TypeScript)
 * Para uso en templates, usar el store: {$t('key')}
 */
export function translate(key: MessageKey): string {
  const currentLocale = getLocale();
  return messages[currentLocale][key] || messages.es[key] || key;
}

/**
 * Store derivado reactivo para traducciones
 * Uso en templates: {$t('home')}
 * El $ es la sintaxis de Svelte para suscribirse automáticamente al store
 */
export const t = derived(locale, ($locale) => {
  return (key: MessageKey): string => {
    return messages[$locale][key] || messages.es[key] || key;
  };
});

/**
 * Función de traducción con parámetros (NO reactiva)
 */
export function translate_params(key: MessageKey, params: Record<string, string | number>): string {
  let translated = translate(key);

  // Reemplazar placeholders {param}
  Object.entries(params).forEach(([param, value]) => {
    translated = translated.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
  });

  return translated;
}

/**
 * Store derivado reactivo para traducciones con parámetros
 * Uso: {$tParams('moduleCountLabel', { count: 5 })}
 */
export const tParams = derived(locale, ($locale) => {
  return (key: MessageKey, params: Record<string, string | number>): string => {
    let translated = messages[$locale][key] || messages.es[key] || key;

    Object.entries(params).forEach(([param, value]) => {
      translated = translated.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
    });

    return translated;
  };
});

// ============================================
// EXPORTS
// ============================================

export default translate;
