import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  UserPlus,
  CheckCircle2,
  Mail,
  X,
  AlertCircle,
  Pencil
} from 'lucide-react';
import {
  listarUsuariosApi,
  crearUsuarioApi,
  cambiarEstadoUsuarioApi,
  editarUsuarioApi,
  listarRolesYPermisosApi,
  actualizarPermisoDeRolApi,
  listarUnidadesApi
} from '../../servicios/servicioApi.js';

export default function GestionUsuariosRoles({ alRegistrarAuditoria }) {
  const [vistaInterna, setVistaInterna] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [matriz, setMatriz] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevaClave, setNuevaClave] = useState('');
  const [nuevoIdRol, setNuevoIdRol] = useState('');
  const [nuevoIdUnidad, setNuevoIdUnidad] = useState('');

  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editIdRol, setEditIdRol] = useState('');
  const [editIdUnidad, setEditIdUnidad] = useState('');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [usuariosRemotos, rolesPermisos, unidadesRemotas] = await Promise.all([
        listarUsuariosApi(),
        listarRolesYPermisosApi(),
        listarUnidadesApi()
      ]);
      setUsuarios(usuariosRemotos);
      setRoles(rolesPermisos.roles);
      setPermisos(rolesPermisos.permisos);
      setMatriz(rolesPermisos.matriz);
      setUnidades(unidadesRemotas);
      setNuevoIdRol((actual) => actual || String(rolesPermisos.roles[0]?.idRol ?? ''));
    } catch (error) {
      setMensajeError(error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const tienePermiso = (idRol, idPermiso) =>
    matriz.some((m) => m.idRol === idRol && m.idPermiso === idPermiso);

  const mostrarAviso = (texto) => {
    setMensajeExito(texto);
    setTimeout(() => setMensajeExito(''), 3000);
  };

  const alternarEstadoUsuario = async (usuario) => {
    try {
      await cambiarEstadoUsuarioApi(usuario.idUsuario, !usuario.estado);
      await cargarDatos();
      if (alRegistrarAuditoria) {
        alRegistrarAuditoria({
          accion: 'Modificación de estado de usuario',
          modulo: 'Seguridad y Roles',
          detalles: `Usuario ${usuario.nombre} cambió su estado a ${!usuario.estado ? 'Activo' : 'Inactivo'}`
        });
      }
      mostrarAviso('Estado de acceso de usuario modificado.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const alternarPermisoDeRol = async (idRol, idPermiso, asignadoActual) => {
    try {
      await actualizarPermisoDeRolApi(idRol, idPermiso, !asignadoActual);
      await cargarDatos();
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const abrirEdicion = (usuario) => {
    setUsuarioEditando(usuario);
    setEditNombre(usuario.nombre);
    setEditIdRol(String(usuario.idRol));
    setEditIdUnidad(usuario.idUnidad ? String(usuario.idUnidad) : '');
  };

  const guardarEdicionUsuario = async (e) => {
    e.preventDefault();
    try {
      await editarUsuarioApi(usuarioEditando.idUsuario, {
        nombre: editNombre,
        idRol: Number(editIdRol),
        idUnidad: editIdUnidad ? Number(editIdUnidad) : null
      });
      setUsuarioEditando(null);
      await cargarDatos();
      if (alRegistrarAuditoria) {
        alRegistrarAuditoria({
          accion: 'Edición de usuario interno',
          modulo: 'Seguridad y Roles',
          detalles: `Se actualizaron los datos de ${editNombre}`
        });
      }
      mostrarAviso('Usuario actualizado exitosamente.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  const agregarUsuario = async (e) => {
    e.preventDefault();
    try {
      await crearUsuarioApi({
        nombre: nuevoNombre,
        correo: nuevoCorreo,
        clave: nuevaClave,
        idRol: Number(nuevoIdRol),
        idUnidad: nuevoIdUnidad ? Number(nuevoIdUnidad) : null
      });
      setMostrarModalNuevo(false);
      await cargarDatos();
      if (alRegistrarAuditoria) {
        alRegistrarAuditoria({
          accion: 'Creación de nuevo usuario interno',
          modulo: 'Seguridad y Roles',
          detalles: `Se registró a ${nuevoNombre} (${nuevoCorreo})`
        });
      }
      setNuevoNombre('');
      setNuevoCorreo('');
      setNuevaClave('');
      mostrarAviso('Usuario incorporado exitosamente.');
    } catch (error) {
      setMensajeError(error.message);
    }
  };

  return (
    <div className="space-y-6">
      {mensajeExito && (
        <div className="toast-notificacion fixed top-20 right-6 z-50 px-5 py-3 rounded-full text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div className="rounded-md-token bg-red-50 border border-red-200/60 p-3 flex items-center gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-etiqueta text-plataformaSecundario block mb-1">
            Módulo de Seguridad y Accesos (RF02, RF03)
          </span>
          <h2 className="text-titulo-seccion">
            Gestión de Usuarios, Roles y Permisos
          </h2>
          <p className="text-cuerpo-pequeno text-plataformaSecundario mt-0.5">
            Administración de cuentas corporativas y matriz de privilegios granulares.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-black/[0.06] mb-4">
        <nav className="flex items-center gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setVistaInterna('usuarios')}
            className={`px-4 py-2 text-cuerpo-pequeno font-medium transition-all cursor-pointer ${
              vistaInterna === 'usuarios'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            Usuarios ({usuarios.length})
          </button>
          <button
            onClick={() => setVistaInterna('permisos')}
            className={`px-4 py-2 text-cuerpo-pequeno font-medium transition-all cursor-pointer ${
              vistaInterna === 'permisos'
                ? 'border-b-2 border-plataformaAzul text-plataformaTexto'
                : 'text-plataformaSecundario hover:text-plataformaTexto'
            }`}
          >
            Matriz de Permisos
          </button>
        </nav>

        {vistaInterna === 'usuarios' && (
          <button
            onClick={() => setMostrarModalNuevo(true)}
            className="boton-primario h-9 px-4 text-xs flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Nuevo usuario</span>
          </button>
        )}
      </div>

      {cargando ? (
        <div className="superficie-tarjeta rounded-lg-token p-10 text-center text-cuerpo-pequeno text-plataformaSecundario">
          Cargando datos reales desde el servidor…
        </div>
      ) : vistaInterna === 'usuarios' ? (
        <div className="superficie-tarjeta rounded-lg-token overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tabla-premium w-full text-left">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo Corporativo</th>
                  <th>Rol Asignado</th>
                  <th>Unidad de Negocio</th>
                  <th className="text-center">Estado</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.idUsuario}>
                    <td className="py-3.5 px-4 font-medium text-plataformaTexto">
                      {u.nombre}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-cuerpo-pequeno text-plataformaSecundario">
                      {u.correo}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 ${
                        u.rol === 'Administrador Corporativo' ? 'insignia-info' : 'insignia-neutra'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {u.rol}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-cuerpo-pequeno text-plataformaTexto">
                      {u.unidad || 'Corporativo'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 ${
                        u.estado ? 'insignia-exito' : 'insignia-peligro'
                      }`}>
                        {u.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirEdicion(u)}
                          className="p-1.5 rounded-full hover:bg-black/[0.04] text-plataformaSecundario hover:text-plataformaTexto transition-colors cursor-pointer"
                          title="Editar usuario"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => alternarEstadoUsuario(u)}
                          className={`text-subtexto font-medium px-3 py-1 rounded-full transition-all cursor-pointer ${
                            u.estado
                              ? 'bg-red-50 hover:bg-red-100 text-red-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.estado ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="superficie-tarjeta rounded-lg-token p-6">
          <h3 className="text-titulo-tarjeta mb-1">
            Matriz de Privilegios Granulares por Perfil
          </h3>
          <p className="text-cuerpo-pequeno text-plataformaSecundario mb-6">
            Control de acceso basado en roles (RBAC). Clic en un ícono para asignar/quitar el permiso — se aplica de inmediato en el backend.
          </p>

          <div className="overflow-x-auto">
            <table className="tabla-premium w-full text-left">
              <thead>
                <tr>
                  <th>Permiso</th>
                  {roles.map((rol) => (
                    <th key={rol.idRol} className="text-center">{rol.nombre}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permisos.map((permiso) => (
                  <tr key={permiso.idPermiso}>
                    <td className="py-3.5 px-4 text-cuerpo-pequeno font-medium text-plataformaTexto">
                      {permiso.descripcion}
                    </td>
                    {roles.map((rol) => {
                      const asignado = tienePermiso(rol.idRol, permiso.idPermiso);
                      return (
                        <td key={rol.idRol} className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => alternarPermisoDeRol(rol.idRol, permiso.idPermiso, asignado)}
                            className="cursor-pointer"
                            title={asignado ? 'Quitar permiso' : 'Asignar permiso'}
                          >
                            {asignado ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-black/20 mx-auto" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mostrarModalNuevo && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <form onSubmit={agregarUsuario} className="contenido-modal max-w-md w-full p-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">
                  Seguridad
                </span>
                <h3 className="text-titulo-seccion mt-1">
                  Registrar Colaborador Interno
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalNuevo(false)}
                className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="ej. Ana Belén Flores"
                  className="campo-entrada w-full"
                />
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Correo corporativo (@intercorpretail.pe)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-plataformaSecundario absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={nuevoCorreo}
                    onChange={(e) => setNuevoCorreo(e.target.value)}
                    placeholder="aflores@intercorpretail.pe"
                    className="campo-entrada campo-entrada-icono w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Contraseña inicial</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={nuevaClave}
                  onChange={(e) => setNuevaClave(e.target.value)}
                  className="campo-entrada w-full"
                />
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Rol de seguridad</label>
                <select
                  value={nuevoIdRol}
                  onChange={(e) => setNuevoIdRol(e.target.value)}
                  className="campo-select w-full"
                >
                  {roles.map((rol) => (
                    <option key={rol.idRol} value={rol.idRol}>{rol.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Unidad de Negocio asignada</label>
                <select
                  value={nuevoIdUnidad}
                  onChange={(e) => setNuevoIdUnidad(e.target.value)}
                  className="campo-select w-full"
                >
                  <option value="">Corporativo (sin unidad)</option>
                  {unidades.map((unidad) => (
                    <option key={unidad.idUnidad} value={unidad.idUnidad}>{unidad.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMostrarModalNuevo(false)}
                className="boton-secundario"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="boton-primario"
              >
                Crear usuario
              </button>
            </div>
          </form>
        </div>
      )}

      {usuarioEditando && (
        <div className="overlay-modal !m-0 flex items-center justify-center p-4">
          <form onSubmit={guardarEdicionUsuario} className="contenido-modal max-w-md w-full p-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-etiqueta text-plataformaAzul block uppercase">
                  Seguridad
                </span>
                <h3 className="text-titulo-seccion mt-1">
                  Editar Usuario
                </h3>
                <p className="text-cuerpo-pequeno text-plataformaSecundario mt-0.5 font-mono">
                  {usuarioEditando.correo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUsuarioEditando(null)}
                className="p-2 rounded-full hover:bg-black/[0.04] text-plataformaSecundario cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="campo-entrada w-full"
                />
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Rol de seguridad</label>
                <select
                  value={editIdRol}
                  onChange={(e) => setEditIdRol(e.target.value)}
                  className="campo-select w-full"
                >
                  {roles.map((rol) => (
                    <option key={rol.idRol} value={rol.idRol}>{rol.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-etiqueta text-plataformaSecundario block mb-1">Unidad de Negocio asignada</label>
                <select
                  value={editIdUnidad}
                  onChange={(e) => setEditIdUnidad(e.target.value)}
                  className="campo-select w-full"
                >
                  <option value="">Corporativo (sin unidad)</option>
                  {unidades.map((unidad) => (
                    <option key={unidad.idUnidad} value={unidad.idUnidad}>{unidad.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUsuarioEditando(null)}
                className="boton-secundario"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="boton-primario"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
