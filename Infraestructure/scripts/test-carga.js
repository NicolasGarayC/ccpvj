import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 30,           // Usuarios virtuales simultáneos
  duration: '1m',     // Duración total de la prueba
  thresholds: {
    http_req_failed: ['rate<0.01'],   // <1% de fallos
    http_req_duration: ['p(95)<5000'] // 95% de peticiones < 5s
  }
};

// ⚠️ Asegúrate de que la URL sea accesible desde la máquina donde corres k6
const FILE_URL = 'http://192.168.68.101/media/library/d6dce48f-5f28-4293-bd6d-e9f5baee2edc_1761802280897_pdfdeprueba.pdf';

export default function () {
  const res = http.get(FILE_URL, { timeout: '180s' });

  check(res, {
    'status 200': (r) => r.status === 200,
    'recibió contenido': (r) => r.body && r.body.length > 0,
  });

  sleep(1); // opcional: evita sobrecargar con peticiones inmediatas
}
