import { writable } from 'svelte/store';
import type { BlogPost } from '../models/interfaces';

// Store para los posts del blog
export const blogPosts = writable<BlogPost[]>([]);
export const latestBlogPosts = writable<BlogPost[]>([]);
export const currentBlogPost = writable<BlogPost | null>(null);

// Datos iniciales para entornos sin conexión
const initialBlogPosts: BlogPost[] = [
  { 
    id: 1, 
    title: 'Inauguración Centro Cultural', 
    content: '<p>Nos complace anunciar la apertura oficial de nuestro Centro Cultural Comunitario. Este espacio ha sido creado con el objetivo de proporcionar recursos educativos y culturales a nuestra comunidad, funcionando completamente en nuestra red local sin necesidad de conexión a internet.</p><p>El centro cuenta con una biblioteca digital, cursos presenciales, y materiales audiovisuales para apoyar el aprendizaje en diversas áreas.</p>',
    excerpt: 'Celebramos la apertura del nuevo centro cultural comunitario',
    publishDate: new Date().toISOString(),
    slug: 'inauguracion',
    authorName: 'Coordinador del Centro' 
  },
  { 
    id: 2, 
    title: 'Nuevos cursos disponibles', 
    content: '<p>Ampliamos nuestra oferta educativa con tres nuevos cursos: Pre Universitario, Computación Básica y Taller de Artesanía. Cada curso cuenta con módulos estructurados y material de apoyo.</p><p>Los estudiantes pueden acceder a estos recursos directamente desde cualquier dispositivo conectado a nuestra red local.</p>',
    excerpt: 'Ampliamos nuestra oferta educativa con tres nuevos cursos',
    publishDate: new Date().toISOString(),
    slug: 'nuevos-cursos',
    authorName: 'Equipo Académico' 
  },
  { 
    id: 3, 
    title: 'Jornada cultural este fin de semana', 
    content: '<p>Este fin de semana organizamos una jornada cultural con actividades para todas las edades. Habrá presentaciones artísticas, talleres prácticos y demostraciones de los trabajos realizados por nuestros estudiantes.</p><p>Toda la comunidad está invitada a participar y conocer más sobre nuestros programas educativos.</p>',
    excerpt: 'Actividades para toda la comunidad este sábado y domingo',
    publishDate: new Date().toISOString(),
    slug: 'jornada-cultural',
    authorName: 'Comité Cultural' 
  }
];

// Función para inicializar datos offline
export function initializeOfflineBlogData() {
  blogPosts.set(initialBlogPosts);
  latestBlogPosts.set(initialBlogPosts);
}

// Función para cargar un post específico
export function loadBlogPost(slug: string) {
  const post = initialBlogPosts.find(p => p.slug === slug);
  if (post) {
    currentBlogPost.set(post);
    return post;
  }
  return null;
}
