import { writable } from 'svelte/store';
import type { Course, Module } from '../models/interfaces';

// Store para los cursos
export const courses = writable<Course[]>([]);
export const featuredCourses = writable<Course[]>([]);
export const currentCourse = writable<Course | null>(null);
export const currentModule = writable<Module | null>(null);

// Datos iniciales para entornos sin conexión
const initialCourses: Course[] = [
  { 
    id: 'preuniversitario', 
    title: 'Pre Universitario', 
    description: 'Preparación integral para pruebas de admisión universitaria',
    modules: [
      {
        id: 'preuni-mod1',
        title: 'Matemáticas Básicas',
        description: 'Fundamentos matemáticos necesarios para la prueba',
        courseId: 'preuniversitario',
        order: 1,
        materials: []
      },
      {
        id: 'preuni-mod2',
        title: 'Comprensión Lectora',
        description: 'Técnicas de lectura y análisis de textos',
        courseId: 'preuniversitario',
        order: 2,
        materials: []
      },
      {
        id: 'preuni-mod3',
        title: 'Ciencias Básicas',
        description: 'Fundamentos de física, química y biología',
        courseId: 'preuniversitario',
        order: 3,
        materials: []
      }
    ]
  },
  { 
    id: 'computacion', 
    title: 'Computación Básica', 
    description: 'Fundamentos de ofimática y navegación',
    modules: [
      {
        id: 'comp-mod1',
        title: 'Introducción al Computador',
        description: 'Conoce las partes y funcionamiento básico',
        courseId: 'computacion',
        order: 1,
        materials: []
      },
      {
        id: 'comp-mod2',
        title: 'Procesador de Texto',
        description: 'Aprende a usar procesadores de texto',
        courseId: 'computacion',
        order: 2,
        materials: []
      }
    ]
  },
  { 
    id: 'artesania', 
    title: 'Taller de Artesanía', 
    description: 'Técnicas tradicionales de artesanía local',
    modules: [
      {
        id: 'art-mod1',
        title: 'Materiales y Herramientas',
        description: 'Conoce los materiales básicos para artesanía',
        courseId: 'artesania',
        order: 1,
        materials: []
      },
      {
        id: 'art-mod2',
        title: 'Técnicas Básicas',
        description: 'Aprende las técnicas fundamentales',
        courseId: 'artesania',
        order: 2,
        materials: []
      }
    ]
  }
];

// Función para inicializar datos offline
export function initializeOfflineCourseData() {
  courses.set(initialCourses);
  featuredCourses.set(initialCourses);
}

// Función para cargar un curso específico
export function loadCourse(courseId: string) {
  const course = initialCourses.find(c => c.id === courseId);
  if (course) {
    currentCourse.set(course);
    return course;
  }
  return null;
}

// Función para cargar un módulo específico
export function loadModule(courseId: string, moduleId: string) {
  const course = initialCourses.find(c => c.id === courseId);
  if (course) {
    const module = course.modules?.find(m => m.id === moduleId);
    if (module) {
      currentModule.set(module);
      return module;
    }
  }
  return null;
}
