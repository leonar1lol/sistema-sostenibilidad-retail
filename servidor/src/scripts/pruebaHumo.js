import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

const directorioActual = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(directorioActual, '../../.env') });

const base = 'https://plataforma-sostenibilidad-api-42337725028.us-east1.run.app/api';

const token = jwt.sign(
  {
    idUsuario: 1,
    nombre: 'Prueba de Humo',
    correo: 'prueba-humo@local.test',
    rol: 'Administrador Corporativo',
    idUnidad: null,
    unidad: null,
    permisos: ['marcar_critico', 'configurar_banco_items', 'ver_dashboard_corporativo', 'exportar_reportes', 'crear_publicar_campanias', 'asignar_evaluaciones', 'administrar_usuarios_roles']
  },
  process.env.CLAVE_SECRETA_JWT,
  { expiresIn: '5m' }
);

async function llamar(nombre, ruta, opciones = {}) {
  const r = await fetch(base + ruta, {
    ...opciones,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opciones.headers || {}) }
  });
  const texto = await r.text();
  console.log(`${nombre}: ${r.status} ${texto}`);
}

const [, , accion, ...args] = process.argv;

if (accion === 'listar-items') {
  const r = await fetch(base + '/banco/items?incluirInactivos=true', { headers: { Authorization: `Bearer ${token}` } });
  const data = await r.json();
  for (const item of data.items) {
    console.log(item.idItem, item.codigo, 'activo=' + item.activo, JSON.stringify(item.enunciado).slice(0, 60));
  }
} else if (accion === 'desactivar-item') {
  await llamar('desactivar', `/banco/items/${args[0]}/estado`, { method: 'PATCH', body: JSON.stringify({ activo: false }) });
} else if (accion === 'desactivar-proveedor') {
  await llamar('desactivar', `/proveedores/${args[0]}/estado`, { method: 'PATCH', body: JSON.stringify({ activo: false }) });
} else if (accion === 'llamar') {
  await llamar(args[0], args[0], { method: args[1] || 'GET', body: args[2] });
} else {
  await llamar('proveedores', '/proveedores');
  await llamar('configuracion/criticidad', '/configuracion/criticidad');
  await llamar('configuracion/unidades', '/configuracion/unidades');
  await llamar('configuracion/industrias', '/configuracion/industrias');
  await llamar('banco/items', '/banco/items');
}
