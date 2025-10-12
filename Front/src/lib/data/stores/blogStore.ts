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
    title: 'Inauguración Centro Cultural Víctor Jara',
    content: '<p>Nos complace anunciar la apertura oficial de nuestro Centro Cultural Comunitario. Este espacio ha sido creado con el objetivo de proporcionar recursos educativos y culturales a nuestra comunidad.</p><p>El centro cuenta con una biblioteca digital, proyectos presenciales, y materiales audiovisuales para apoyar el aprendizaje en diversas áreas.</p><p>Funcionamos completamente en nuestra red local sin necesidad de conexión a internet, garantizando acceso constante a nuestros recursos.</p>',
    excerpt: 'Celebramos la apertura oficial del Centro Cultural Víctor Jara, un espacio dedicado a la educación y cultura comunitaria.',
    publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'inauguracion-centro-cultural',
    featuredMedia: 'blog/inauguracion-centro.jpg',
    mediaType: 'image',
    authorName: 'Coordinación General',
    tags: ['inauguración', 'centro cultural', 'comunidad'],
    isPublished: true
  },
  {
    id: 2,
    title: 'Nuevos Proyectos y Talleres Disponibles',
    content: '<p>Ampliamos nuestra oferta educativa con tres nuevos proyectos: Pre Universitario, Computación Básica y Taller de Artesanía.</p><p>Cada proyecto cuenta con módulos estructurados, material de apoyo y seguimiento personalizado.</p><p>Los estudiantes pueden acceder a estos recursos desde cualquier dispositivo conectado a nuestra red local.</p>',
    excerpt: 'Conoce los nuevos proyectos disponibles: Pre Universitario, Computación Básica y Taller de Artesanía, diseñados para toda la comunidad.',
    publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'nuevos-proyectos-disponibles',
    featuredMedia: 'blog/nuevos-proyectos.mp4',
    videoPoster: 'blog/nuevos-proyectos-poster.jpg',
    mediaType: 'video',
    authorName: 'Equipo Académico',
    tags: ['proyectos', 'educación', 'talleres'],
    isPublished: true
  },
  { 
    id: 3, 
    title: 'Red Mesh Comunitaria: Conectando Sin Internet', 
    content: '<p>Nuestro centro utiliza una innovadora red mesh que permite el acceso a contenidos educativos sin necesidad de conexión a internet.</p><p>Esta tecnología garantiza que todos los miembros de la comunidad puedan acceder a nuestros recursos de manera constante y gratuita.</p><p>La red mesh funciona mediante la interconexión de dispositivos, creando una red local robusta y confiable.</p>',
    excerpt: 'Descubre cómo nuestra red mesh comunitaria permite el acceso continuo a recursos educativos sin depender de internet.',
    publishDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'red-mesh-comunitaria',
    mediaType: 'text', // Solo texto, sin media
    authorName: 'Equipo Técnico',
    tags: ['tecnología', 'red mesh', 'innovación'],
    isPublished: true
  },
  { 
    id: 4, 
    title: 'Taller de Artesanía: Preservando Tradiciones', 
    content: '<p>El taller de artesanía se enfoca en preservar y transmitir las técnicas tradicionales de nuestra región.</p><p>Los participantes aprenden desde técnicas básicas hasta proyectos avanzados, utilizando materiales locales.</p><p>Este espacio fomenta la creatividad y el emprendimiento comunitario.</p>',
    excerpt: 'Únete a nuestro taller de artesanía y aprende técnicas tradicionales mientras preservas nuestra cultura local.',
    publishDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'taller-artesania-tradiciones',
    featuredMedia: 'blog/taller-artesania.jpg',
    mediaType: 'image',
    authorName: 'Maestra Artesana Carmen López',
    tags: ['artesanía', 'tradición', 'cultura'],
    isPublished: true
  },
  { 
    id: 5, 
    title: 'Jornada Cultural Comunitaria', 
    content: '<p>Este fin de semana realizamos nuestra primera jornada cultural con actividades para toda la familia.</p><p>Contamos con presentaciones musicales, exposición de trabajos estudiantiles y talleres participativos.</p><p>La comunidad demostró gran entusiasmo y participación en todas las actividades programadas.</p>',
    excerpt: 'Gran éxito de nuestra primera jornada cultural con música, arte y participación de toda la comunidad.',
    publishDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    slug: 'jornada-cultural-comunitaria',
    featuredMedia: 'blog/jornada-cultural.mp4',
    videoPoster: 'blog/jornada-cultural-poster.jpg',
    mediaType: 'video',
    authorName: 'Comité Cultural',
    tags: ['cultura', 'comunidad', 'eventos'],
    isPublished: true
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
