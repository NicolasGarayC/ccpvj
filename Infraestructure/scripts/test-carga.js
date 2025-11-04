import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,           // Usuarios virtuales simultáneos
  duration: '1m',     // Duración total de la prueba
  thresholds: {
    http_req_failed: ['rate<0.01'],   // <1% de fallos
    http_req_duration: ['p(95)<5000'] // 95% de peticiones < 5s
  }
};

// URL para desarrollo (npm run dev): puerto 5173
// URL para producción (pm2/node build): puerto 3000
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const FILE_URL = `${BASE_URL}/media/Arte%20y%20M%C3%BAsica/videos/a_1762152517634.mp4`;

export default function () {
  // IMPORTANTE: responseType: 'none' evita que k6 guarde el archivo en memoria
  // Esto es crítico para archivos grandes (685 MB) con múltiples VUs
  const res = http.get(FILE_URL, {
    timeout: '180s',
    responseType: 'none' // No guardar la respuesta en memoria
  });

  check(res, {
    'status 200': (r) => r.status === 200,
    'conexión exitosa': (r) => r.status !== 0,
  });

  sleep(1);
}
