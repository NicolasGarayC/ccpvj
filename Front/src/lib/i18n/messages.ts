// Direct message definitions for reliable imports

export const messages = {
  es: {
    // Auth & Permissions
    "auth.no_permissions_create": "No tienes permisos para crear posts del blog. Necesitas ser Colaborador o Administrador.",
    "auth.no_permissions_edit": "No tienes permisos para editar posts del blog. Necesitas ser Colaborador o Administrador.",
    "auth.no_permissions_delete": "No tienes permisos para eliminar posts.",
    "auth.no_permissions_role_management": "No tienes permisos para gestionar roles de usuarios. Esta función está disponible solo para Administradores.",
    "auth.login_required": "Debes iniciar sesión para realizar esta acción.",
    "auth.own_posts_only": "Solo puedes editar tus propios posts o ser Administrador.",

    // Actions
    "action.create": "Crear",
    "action.edit": "Editar",
    "action.delete": "Eliminar",
    "action.save": "Guardar",
    "action.cancel": "Cancelar",
    "action.update": "Actualizar",

    // Blog
    "blog.create_article": "Crear Nuevo Artículo",
    "blog.edit_article": "Editar Artículo",
    "blog.create_post": "Crear Artículo",
    "blog.update_post": "Actualizar",

    // Errors
    "error.generic": "Error desconocido",
    "error.loading_users": "Error cargando usuarios",
    "error.updating_role": "Error actualizando rol",
    "error.loading_categories": "Error cargando categorías",
    "error.saving_post": "Error al guardar el post",

    // Course Management
    "course.management": "Gestión de Cursos",
    "course.authenticated_as": "Autenticado como",
    "course.not_authenticated": "No autenticado (modo de acceso público)",

    // Common
    "common.loading": "Cargando...",
    "common.success": "Éxito",
    "common.error": "Error",

    // Video and Media
    "videoNotSupported": "Tu navegador no soporta video.",
    "newsPost": "Noticia",
    "readMore": "Leer más",

    // Navigation
    "home": "Inicio",
    "blog": "Blog",
    "calendar": "Calendario",
    "library": "Biblioteca",
    "materialApoyo": "Material de Apoyo",
    "logout": "Cerrar Sesión",
    "login": "Iniciar Sesión",
    "createArticle": "Crear Artículo",
    "footerText": "Todos los derechos reservados",

    // Login/Auth errors
    "loginError": "Error al iniciar sesión",
    "connectionError": "Error de conexión. Verifica que el servidor esté funcionando."
  },

  en: {
    // Auth & Permissions
    "auth.no_permissions_create": "You don't have permission to create blog posts. You need to be a Collaborator or Administrator.",
    "auth.no_permissions_edit": "You don't have permission to edit blog posts. You need to be a Collaborator or Administrator.",
    "auth.no_permissions_delete": "You don't have permission to delete posts.",
    "auth.no_permissions_role_management": "You don't have permission to manage user roles. This function is available only for Administrators.",
    "auth.login_required": "You must log in to perform this action.",
    "auth.own_posts_only": "You can only edit your own posts or be an Administrator.",

    // Actions
    "action.create": "Create",
    "action.edit": "Edit",
    "action.delete": "Delete",
    "action.save": "Save",
    "action.cancel": "Cancel",
    "action.update": "Update",

    // Blog
    "blog.create_article": "Create New Article",
    "blog.edit_article": "Edit Article",
    "blog.create_post": "Create Article",
    "blog.update_post": "Update",

    // Errors
    "error.generic": "Unknown error",
    "error.loading_users": "Error loading users",
    "error.updating_role": "Error updating role",
    "error.loading_categories": "Error loading categories",
    "error.saving_post": "Error saving post",

    // Course Management
    "course.management": "Course Management",
    "course.authenticated_as": "Authenticated as",
    "course.not_authenticated": "Not authenticated (public access mode)",

    // Common
    "common.loading": "Loading...",
    "common.success": "Success",
    "common.error": "Error",

    // Video and Media
    "videoNotSupported": "Your browser does not support video.",
    "newsPost": "News",
    "readMore": "Read more",

    // Navigation
    "home": "Home",
    "blog": "Blog",
    "calendar": "Calendar",
    "library": "Library",
    "materialApoyo": "Support Material",
    "logout": "Logout",
    "login": "Login",
    "createArticle": "Create Article",
    "footerText": "All rights reserved",

    // Login/Auth errors
    "loginError": "Login error",
    "connectionError": "Connection error. Please verify that the server is running."
  }
};

export type MessageKey = keyof typeof messages.es;
export type Locale = 'es' | 'en';