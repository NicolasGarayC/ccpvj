/** @type {import('@inlang/paraglide-js').Config} */
export default {
  project: './project.inlang',
  outdir: './src/lib/paraglide',
  // Idiomas disponibles
  availableLanguageTags: ['es', 'en'],
  // Idioma por defecto
  defaultLanguageTag: 'es',
  // Configuración para evitar recompilaciones excesivas
  watch: false
};
