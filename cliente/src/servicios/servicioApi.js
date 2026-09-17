const URL_BASE_API = import.meta.env.VITE_API_BASE_URL || 'https://plataforma-sostenibilidad-api-42337725028.us-east1.run.app/api';

async function peticionAutenticada(ruta, opciones = {}) {
  const token = localStorage.getItem('tokenSesionCorporativa');
  const respuesta = await fetch(`${URL_BASE_API}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers
    }
  });
  const datos = await respuesta.json();
  if (!respuesta.ok || !datos.exito) {
    throw new Error(datos.mensaje || 'Ocurrió un error al comunicarse con el servidor.');
  }
  return datos;
}

async function peticionPortal(ruta, opciones = {}) {
  const token = localStorage.getItem('tokenSesionProveedor');
  const respuesta = await fetch(`${URL_BASE_API}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers
    }
  });
  const datos = await respuesta.json();
  if (!respuesta.ok || !datos.exito) {
    const error = new Error(datos.mensaje || 'Ocurrió un error al comunicarse con el servidor.');
    error.itemsFaltantes = datos.itemsFaltantes;
    throw error;
  }
  return datos;
}

export async function solicitarAccesoPortalApi(correo) {
  return peticionPortal('/portal/acceso', { method: 'POST', body: JSON.stringify({ correo }) });
}

export async function verificarAccesoPortalApi(correo, valor) {
  const datos = await peticionPortal('/portal/verificar', { method: 'POST', body: JSON.stringify({ correo, valor }) });
  localStorage.setItem('tokenSesionProveedor', datos.token);
  return datos;
}

export async function registrarProveedorPortalApi(datosRegistro) {
  const datos = await peticionPortal('/portal/registro', { method: 'POST', body: JSON.stringify(datosRegistro) });
  localStorage.setItem('tokenSesionProveedor', datos.token);
  return datos;
}

export async function obtenerCuestionarioPortalApi() {
  return peticionPortal('/portal/cuestionario');
}

export async function guardarRespuestaPortalApi(idItem, idAlternativa) {
  return peticionPortal('/portal/respuesta', { method: 'POST', body: JSON.stringify({ idItem, idAlternativa }) });
}

export async function finalizarEvaluacionPortalApi() {
  return peticionPortal('/portal/finalizar', { method: 'POST' });
}

export async function obtenerResultadoPortalApi() {
  return peticionPortal('/portal/resultado');
}

export async function listarEvidenciaItemPortalApi(idItem) {
  const datos = await peticionPortal(`/portal/items/${idItem}/evidencia`);
  return datos.evidencias;
}

export async function subirEvidenciaPortalApi(idItem, archivo) {
  const token = localStorage.getItem('tokenSesionProveedor');
  const formulario = new FormData();
  formulario.append('archivo', archivo);

  const respuesta = await fetch(`${URL_BASE_API}/portal/items/${idItem}/evidencia`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formulario
  });
  const datos = await respuesta.json();
  if (!respuesta.ok || !datos.exito) {
    throw new Error(datos.mensaje || 'Error al subir la evidencia.');
  }
  return datos.evidencia;
}

export async function eliminarEvidenciaPortalApi(idEvidencia) {
  return peticionPortal(`/portal/evidencia/${idEvidencia}`, { method: 'DELETE' });
}

export async function listarEvidenciaProveedorAdminApi(idProveedor) {
  const datos = await peticionAutenticada(`/proveedores/${idProveedor}/evidencia`);
  return datos.evidencias;
}

export async function obtenerDatosMaestrosPortalApi() {
  const respuesta = await fetch(`${URL_BASE_API}/proveedores/datos-maestros`);
  const datos = await respuesta.json();
  if (!respuesta.ok || !datos.exito) {
    throw new Error(datos.mensaje || 'Error al consultar datos maestros.');
  }
  return datos;
}

export async function iniciarSesionApi(correo, clave) {
  const respuesta = await fetch(`${URL_BASE_API}/autenticacion/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, clave })
  });
  const datos = await respuesta.json();
  if (!respuesta.ok || !datos.exito) {
    throw new Error(datos.mensaje || 'No se pudo iniciar sesión.');
  }
  return datos;
}

export async function listarUsuariosApi() {
  const datos = await peticionAutenticada('/usuarios');
  return datos.usuarios;
}

export async function crearUsuarioApi(datosUsuario) {
  const datos = await peticionAutenticada('/usuarios', { method: 'POST', body: JSON.stringify(datosUsuario) });
  return datos.usuario;
}

export async function cambiarEstadoUsuarioApi(idUsuario, estado) {
  const datos = await peticionAutenticada(`/usuarios/${idUsuario}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado })
  });
  return datos.usuario;
}

export async function editarUsuarioApi(idUsuario, cambios) {
  const datos = await peticionAutenticada(`/usuarios/${idUsuario}`, {
    method: 'PUT',
    body: JSON.stringify(cambios)
  });
  return datos.usuario;
}

export async function listarRolesYPermisosApi() {
  return peticionAutenticada('/roles');
}

export async function actualizarPermisoDeRolApi(idRol, idPermiso, asignado) {
  return peticionAutenticada('/roles/permisos', {
    method: 'PUT',
    body: JSON.stringify({ idRol, idPermiso, asignado })
  });
}

export async function listarUnidadesApi() {
  const datos = await peticionAutenticada('/configuracion/unidades');
  return datos.unidades;
}

export async function crearUnidadApi(datosUnidad) {
  const datos = await peticionAutenticada('/configuracion/unidades', { method: 'POST', body: JSON.stringify(datosUnidad) });
  return datos.unidad;
}

export async function editarUnidadApi(idUnidad, datosUnidad) {
  const datos = await peticionAutenticada(`/configuracion/unidades/${idUnidad}`, { method: 'PUT', body: JSON.stringify(datosUnidad) });
  return datos.unidad;
}

export async function listarIndustriasApi() {
  const datos = await peticionAutenticada('/configuracion/industrias');
  return datos.industrias;
}

export async function crearIndustriaApi(datosIndustria) {
  const datos = await peticionAutenticada('/configuracion/industrias', { method: 'POST', body: JSON.stringify(datosIndustria) });
  return datos.industria;
}

export async function editarIndustriaApi(idIndustria, datosIndustria) {
  const datos = await peticionAutenticada(`/configuracion/industrias/${idIndustria}`, { method: 'PUT', body: JSON.stringify(datosIndustria) });
  return datos.industria;
}

export async function listarDimensionesApi() {
  const datos = await peticionAutenticada('/configuracion/dimensiones');
  return datos.dimensiones;
}

export async function actualizarPesosDimensionesApi(pesos) {
  const datos = await peticionAutenticada('/configuracion/dimensiones', { method: 'PUT', body: JSON.stringify({ pesos }) });
  return datos.dimensiones;
}

export async function listarItemsBancoApi() {
  const datos = await peticionAutenticada('/banco/items');
  return datos.items;
}

export async function crearItemBancoApi(datosItem) {
  return peticionAutenticada('/banco/items', { method: 'POST', body: JSON.stringify(datosItem) });
}

export async function editarItemBancoApi(idItem, datosItem) {
  return peticionAutenticada(`/banco/items/${idItem}`, { method: 'PUT', body: JSON.stringify(datosItem) });
}

export async function actualizarIndustriasItemApi(idItem, idsIndustrias) {
  return peticionAutenticada(`/banco/items/${idItem}/industrias`, { method: 'PUT', body: JSON.stringify({ idsIndustrias }) });
}

export async function agregarAlternativaApi(idItem, datosAlternativa) {
  return peticionAutenticada(`/banco/items/${idItem}/alternativas`, { method: 'POST', body: JSON.stringify(datosAlternativa) });
}

export async function eliminarAlternativaApi(idAlternativa) {
  return peticionAutenticada(`/banco/alternativas/${idAlternativa}`, { method: 'DELETE' });
}

export async function listarReglasCondicionalesApi() {
  const datos = await peticionAutenticada('/banco/reglas');
  return datos.reglas;
}

export async function crearReglaCondicionalApi(datosRegla) {
  return peticionAutenticada('/banco/reglas', { method: 'POST', body: JSON.stringify(datosRegla) });
}

export async function eliminarReglaCondicionalApi(idRegla) {
  return peticionAutenticada(`/banco/reglas/${idRegla}`, { method: 'DELETE' });
}

export async function listarCampaniasApi() {
  const datos = await peticionAutenticada('/campanias');
  return datos.campanias;
}

export async function crearCampaniaApi(datosCampania) {
  const datos = await peticionAutenticada('/campanias', { method: 'POST', body: JSON.stringify(datosCampania) });
  return datos.campania;
}

export async function cambiarEstadoCampaniaApi(idCampania, estado) {
  const datos = await peticionAutenticada(`/campanias/${idCampania}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
  return datos.campania;
}

export async function listarEvaluacionesDeCampaniaApi(idCampania) {
  const datos = await peticionAutenticada(`/campanias/${idCampania}/evaluaciones`);
  return datos.evaluaciones;
}

export async function asignarEvaluacionApi(idCampania, idProveedor) {
  return peticionAutenticada(`/campanias/${idCampania}/evaluaciones`, { method: 'POST', body: JSON.stringify({ idProveedor }) });
}

export async function enviarRecordatorioApi(idEvaluacion) {
  return peticionAutenticada(`/campanias/evaluaciones/${idEvaluacion}/recordatorio`, { method: 'POST' });
}

export async function listarProveedoresAdminApi() {
  const datos = await peticionAutenticada('/proveedores');
  return datos.proveedores;
}

export async function crearProveedorAdminApi(datosProveedor) {
  const datos = await peticionAutenticada('/proveedores', { method: 'POST', body: JSON.stringify(datosProveedor) });
  return datos.proveedor;
}

export async function alternarProveedorCriticoApi(idProveedor, esCritico) {
  const datos = await peticionAutenticada(`/proveedores/${idProveedor}/critico`, {
    method: 'PATCH',
    body: JSON.stringify({ esCritico })
  });
  return datos.proveedor;
}

export async function listarAuditoriaApi() {
  const datos = await peticionAutenticada('/auditoria');
  return datos.registros;
}
