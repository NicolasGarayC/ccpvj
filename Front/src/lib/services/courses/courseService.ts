import { initializeOfflineCourseData, loadCourse, loadModule, courses, featuredCourses } from '$lib/data/stores/courseStore';
import type { Course, Module } from '$lib/data/models/interfaces';

class CourseService {
  private isOnline = false;

  constructor() {
    // Intenta detectar si hay conexión al backend
    this.checkConnection();
  }

  private async checkConnection() {
    try {
      const response = await fetch('/api/health-check', { method: 'HEAD', timeout: 1000 });
      this.isOnline = response.ok;
    } catch (error) {
      this.isOnline = false;
      console.log('Modo offline activado para cursos');
      // Si no hay conexión, inicializa con datos locales
      initializeOfflineCourseData();
    }
  }

  async getFeaturedCourses(): Promise<Course[]> {
    try {
      if (this.isOnline) {
        const response = await fetch('/api/courses/featured');
        if (response.ok) {
          const data = await response.json();
          featuredCourses.set(data);
          return data;
        }
      }
      
      // Si estamos offline o la petición falló, usa datos locales
      let localCourses: Course[] = [];
      featuredCourses.subscribe(value => { localCourses = value; })();
      
      if (localCourses.length === 0) {
        initializeOfflineCourseData();
        featuredCourses.subscribe(value => { localCourses = value; })();
      }
      
      return localCourses;
    } catch (error) {
      console.error('Error cargando cursos destacados:', error);
      initializeOfflineCourseData();
      let localCourses: Course[] = [];
      featuredCourses.subscribe(value => { localCourses = value; })();
      return localCourses;
    }
  }

  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      if (this.isOnline) {
        const response = await fetch(`/api/courses/${courseId}`);
        if (response.ok) {
          return await response.json();
        }
      }
      
      // Modo offline
      return loadCourse(courseId);
    } catch (error) {
      console.error(`Error cargando curso ${courseId}:`, error);
      return loadCourse(courseId);
    }
  }

  async getModuleById(courseId: string, moduleId: string): Promise<Module | null> {
    try {
      if (this.isOnline) {
        const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`);
        if (response.ok) {
          return await response.json();
        }
      }
      
      // Modo offline
      return loadModule(courseId, moduleId);
    } catch (error) {
      console.error(`Error cargando módulo ${moduleId}:`, error);
      return loadModule(courseId, moduleId);
    }
  }

  async getAllCourses(): Promise<Course[]> {
    try {
      if (this.isOnline) {
        const response = await fetch('/api/courses');
        if (response.ok) {
          const data = await response.json();
          courses.set(data);
          return data;
        }
      }
      
      // Si estamos offline o la petición falló, usa datos locales
      let localCourses: Course[] = [];
      courses.subscribe(value => { localCourses = value; })();
      
      if (localCourses.length === 0) {
        initializeOfflineCourseData();
        courses.subscribe(value => { localCourses = value; })();
      }
      
      return localCourses;
    } catch (error) {
      console.error('Error cargando todos los cursos:', error);
      initializeOfflineCourseData();
      let localCourses: Course[] = [];
      courses.subscribe(value => { localCourses = value; })();
      return localCourses;
    }
  }
}

// Exportar una instancia única
export const courseService = new CourseService();
