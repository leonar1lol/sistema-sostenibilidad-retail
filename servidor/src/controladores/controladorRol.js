import { consultarBaseDatos } from '../configuracion/baseDatos.js';
import { registrarAuditoria } from '../servicios/servicioAuditoria.js';

export const listarRolesYPermisos = async (peticion, respuesta) => {
  try {
    const roles = await consultarBaseDatos('SELECT id_rol AS "idRol", nombre FROM rol ORDER BY id_rol ASC');
    const permisos = await consultarBaseDatos('SELECT id_permiso AS "idPermiso", codigo, descripcion FROM permiso ORDER BY id_permiso ASC');
    const asignaciones = await consultarBaseDatos('SELECT id_rol AS "idRol", id_permiso AS "idPermiso" FROM rol_permiso');

    return respuesta.status(200).json({
      exito: true,
      roles: roles.rows,
      permisos: permisos.rows,
      matriz: asignaciones.rows
    });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al consultar roles y permisos.' });
  }
};

export const actualizarPermisoDeRol = async (peticion, respuesta) => {
  const { idRol, idPermiso, asignado } = peticion.body;

  if (!idRol || !idPermiso) {
    return respuesta.status(400).json({ exito: false, mensaje: 'idRol e idPermiso son obligatorios.' });
  }

  try {
    if (asignado) {
      await consultarBaseDatos(
        'INSERT INTO rol_permiso (id_rol, id_permiso) VALUES ($1, $2) ON CONFLICT (id_rol, id_permiso) DO NOTHING',
        [idRol, idPermiso]
      );
    } else {
      await consultarBaseDatos('DELETE FROM rol_permiso WHERE id_rol = $1 AND id_permiso = $2', [idRol, idPermiso]);
    }
    await registrarAuditoria({
      idUsuario: peticion.usuario.idUsuario,
      accion: `${asignado ? 'Asignó' : 'Quitó'} el permiso #${idPermiso} al rol #${idRol}`
    });
    return respuesta.status(200).json({ exito: true });
  } catch (error) {
    return respuesta.status(500).json({ exito: false, mensaje: 'Error al actualizar el permiso del rol.' });
  }
};
