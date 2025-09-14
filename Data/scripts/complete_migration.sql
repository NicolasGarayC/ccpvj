-- Migración completa de base de datos para curso funcional

-- Eliminar vistas problemáticas
DROP VIEW IF EXISTS CourseWithMedia;
DROP VIEW IF EXISTS BlogPostWithMedia;
DROP VIEW IF EXISTS EventWithMedia;
DROP VIEW IF EXISTS WorkItemWithMedia;

-- Eliminar tabla course antigua si existe
DROP TABLE IF EXISTS course;

-- Renombrar course_new si existe
ALTER TABLE course_new RENAME TO course;

-- Si course_new no existía, crear table course desde cero
CREATE TABLE IF NOT EXISTS course (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    subject TEXT NOT NULL,
    image_path TEXT,
    is_active INTEGER DEFAULT 1 NOT NULL,
    is_featured INTEGER DEFAULT 0 NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    educator_id TEXT NOT NULL
);

-- Crear tabla module
CREATE TABLE IF NOT EXISTS module (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    order_number INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    course_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (course_id) REFERENCES course (id) ON DELETE CASCADE
);

-- Crear tabla work_item actualizada
DROP TABLE IF EXISTS work_item;
CREATE TABLE work_item (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    long_text TEXT,
    image_path TEXT,
    video_path TEXT,
    order_number INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    module_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY (module_id) REFERENCES module (id) ON DELETE CASCADE
);

-- Crear usuario de prueba
INSERT OR IGNORE INTO user (id, username, password_hash, role, created_at, updated_at)
VALUES ('educator-1', 'profesor', 'hashed_password', 'Colaborador', strftime('%s', 'now'), strftime('%s', 'now'));

-- Insertar datos de prueba en course
INSERT OR IGNORE INTO course (id, title, description, subject, is_active, is_featured, created_at, educator_id)
VALUES
    ('course-1', 'Matemáticas Básicas', 'Curso introductorio de matemáticas para estudiantes principiantes', 'Matemáticas', 1, 1, strftime('%s', 'now'), 'educator-1'),
    ('course-2', 'Física I', 'Principios fundamentales de la física', 'Física', 1, 0, strftime('%s', 'now'), 'educator-1'),
    ('course-3', 'Historia de Colombia', 'Recorrido por la historia nacional', 'Sociales', 1, 1, strftime('%s', 'now'), 'educator-1');

-- Insertar módulos
INSERT OR IGNORE INTO module (id, title, description, order_number, course_id, created_at)
VALUES
    ('module-1', 'Aritmética Básica', 'Operaciones fundamentales con números', 1, 'course-1', strftime('%s', 'now')),
    ('module-2', 'Álgebra Elemental', 'Introducción a las ecuaciones', 2, 'course-1', strftime('%s', 'now')),
    ('module-3', 'Geometría', 'Figuras y espacios', 3, 'course-1', strftime('%s', 'now')),
    ('module-4', 'Cinemática', 'Movimiento y velocidad', 1, 'course-2', strftime('%s', 'now')),
    ('module-5', 'Dinámica', 'Fuerzas y aceleración', 2, 'course-2', strftime('%s', 'now')),
    ('module-6', 'Época Precolombina', 'Culturas indígenas', 1, 'course-3', strftime('%s', 'now')),
    ('module-7', 'Conquista y Colonia', 'Periodo colonial', 2, 'course-3', strftime('%s', 'now'));

-- Insertar work items
INSERT OR IGNORE INTO work_item (id, title, description, order_number, module_id, created_at)
VALUES
    ('work-1', 'Suma y Resta', 'Aprende las operaciones básicas de suma y resta', 1, 'module-1', strftime('%s', 'now')),
    ('work-2', 'Multiplicación', 'Domina las tablas de multiplicar', 2, 'module-1', strftime('%s', 'now')),
    ('work-3', 'División', 'División con números enteros', 3, 'module-1', strftime('%s', 'now')),
    ('work-4', 'Ecuaciones de primer grado', 'Resolver ecuaciones lineales básicas', 1, 'module-2', strftime('%s', 'now')),
    ('work-5', 'Sistema de ecuaciones', 'Métodos de solución', 2, 'module-2', strftime('%s', 'now')),
    ('work-6', 'Perímetros y áreas', 'Cálculo de figuras planas', 1, 'module-3', strftime('%s', 'now')),
    ('work-7', 'Movimiento uniforme', 'Velocidad constante', 1, 'module-4', strftime('%s', 'now')),
    ('work-8', 'Movimiento acelerado', 'Cambios de velocidad', 2, 'module-4', strftime('%s', 'now')),
    ('work-9', 'Segunda ley de Newton', 'F = ma', 1, 'module-5', strftime('%s', 'now')),
    ('work-10', 'Culturas Muisca y Tairona', 'Civilizaciones precolombinas', 1, 'module-6', strftime('%s', 'now')),
    ('work-11', 'Llegada de los españoles', 'Conquista del territorio', 1, 'module-7', strftime('%s', 'now'));

-- Verificar resultados
SELECT 'Courses:' as table_name, COUNT(*) as count FROM course
UNION ALL
SELECT 'Modules:', COUNT(*) FROM module
UNION ALL
SELECT 'Work Items:', COUNT(*) FROM work_item;