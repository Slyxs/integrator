<?php
// ============================================================
// /api/maquinaria.php - CRUD de maquinaria (equipos)
// ============================================================
// Gestiona las operaciones sobre la tabla `maquinaria`:
//   GET           → lista toda la maquinaria activa
//   GET ?id=N     → devuelve un equipo por su ID
//   POST          → crea un nuevo equipo (código único)
//   PUT           → actualiza los datos de un equipo existente
//   DELETE        → elimina lógicamente (soft delete: estado = 0)
// ============================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Estados operativos permitidos por el ENUM de la tabla.
const ESTADOS_OPERATIVOS = ['operativa', 'mantenimiento', 'averiada', 'baja'];

// Normaliza los tipos del array de un equipo.
function castMaquina(array $m): array {
    $m['id']     = (int) $m['id'];
    $m['estado'] = (bool) $m['estado'];
    return $m;
}

// Devuelve un estado operativo válido o el valor por defecto.
function estadoOperativoValido($estado): string {
    return in_array($estado, ESTADOS_OPERATIVOS, true) ? $estado : 'operativa';
}

switch ($method) {
    // ----- LEER -----
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare(
                'SELECT id, nombre, codigo, marca, modelo, ubicacion,
                        fecha_adquisicion AS fechaAdquisicion,
                        ultimo_mantenimiento AS ultimoMantenimiento,
                        proximo_mantenimiento AS proximoMantenimiento,
                        estado_operativo AS estadoOperativo, observaciones, estado
                   FROM maquinaria WHERE id = ?'
            );
            $stmt->execute([$_GET['id']]);
            $row = $stmt->fetch();
            if (!$row) jsonError('Equipo no encontrado', 404);
            jsonResponse(castMaquina($row));
        }

        $stmt = $db->query(
            'SELECT id, nombre, codigo, marca, modelo, ubicacion,
                    fecha_adquisicion AS fechaAdquisicion,
                    ultimo_mantenimiento AS ultimoMantenimiento,
                    proximo_mantenimiento AS proximoMantenimiento,
                    estado_operativo AS estadoOperativo, observaciones, estado
               FROM maquinaria WHERE estado = 1 ORDER BY nombre'
        );
        jsonResponse(array_map('castMaquina', $stmt->fetchAll()));
        break;

    // ----- CREAR -----
    case 'POST':
        $input = getInput();
        if (empty($input['nombre'])) jsonError('El nombre es requerido');

        try {
            $stmt = $db->prepare(
                'INSERT INTO maquinaria
                    (nombre, codigo, marca, modelo, ubicacion, fecha_adquisicion,
                     ultimo_mantenimiento, proximo_mantenimiento, estado_operativo, observaciones)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $input['nombre'],
                $input['codigo']    ?? null,
                $input['marca']     ?? null,
                $input['modelo']    ?? null,
                $input['ubicacion'] ?? null,
                !empty($input['fechaAdquisicion'])     ? $input['fechaAdquisicion']     : null,
                !empty($input['ultimoMantenimiento'])  ? $input['ultimoMantenimiento']  : null,
                !empty($input['proximoMantenimiento']) ? $input['proximoMantenimiento'] : null,
                estadoOperativoValido($input['estadoOperativo'] ?? 'operativa'),
                $input['observaciones'] ?? null,
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') jsonError('El código ya está registrado', 409);
            jsonError('Error al crear el equipo', 500);
        }

        jsonResponse(castMaquina([
            'id'                   => (int) $db->lastInsertId(),
            'nombre'               => $input['nombre'],
            'codigo'               => $input['codigo']    ?? null,
            'marca'                => $input['marca']     ?? null,
            'modelo'               => $input['modelo']    ?? null,
            'ubicacion'            => $input['ubicacion'] ?? null,
            'fechaAdquisicion'     => $input['fechaAdquisicion']     ?? null,
            'ultimoMantenimiento'  => $input['ultimoMantenimiento']  ?? null,
            'proximoMantenimiento' => $input['proximoMantenimiento'] ?? null,
            'estadoOperativo'      => estadoOperativoValido($input['estadoOperativo'] ?? 'operativa'),
            'observaciones'        => $input['observaciones'] ?? null,
            'estado'               => 1,
        ]), 201);
        break;

    // ----- ACTUALIZAR -----
    case 'PUT':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        if (empty($input['nombre'])) jsonError('El nombre es requerido');

        try {
            $stmt = $db->prepare(
                'UPDATE maquinaria
                    SET nombre = ?, codigo = ?, marca = ?, modelo = ?, ubicacion = ?,
                        fecha_adquisicion = ?, ultimo_mantenimiento = ?, proximo_mantenimiento = ?,
                        estado_operativo = ?, observaciones = ?
                  WHERE id = ?'
            );
            $stmt->execute([
                $input['nombre'],
                $input['codigo']    ?? null,
                $input['marca']     ?? null,
                $input['modelo']    ?? null,
                $input['ubicacion'] ?? null,
                !empty($input['fechaAdquisicion'])     ? $input['fechaAdquisicion']     : null,
                !empty($input['ultimoMantenimiento'])  ? $input['ultimoMantenimiento']  : null,
                !empty($input['proximoMantenimiento']) ? $input['proximoMantenimiento'] : null,
                estadoOperativoValido($input['estadoOperativo'] ?? 'operativa'),
                $input['observaciones'] ?? null,
                $id,
            ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') jsonError('El código ya está registrado por otro equipo', 409);
            jsonError('Error al actualizar el equipo', 500);
        }

        jsonResponse(castMaquina([
            'id'                   => (int) $id,
            'nombre'               => $input['nombre'],
            'codigo'               => $input['codigo']    ?? null,
            'marca'                => $input['marca']     ?? null,
            'modelo'               => $input['modelo']    ?? null,
            'ubicacion'            => $input['ubicacion'] ?? null,
            'fechaAdquisicion'     => $input['fechaAdquisicion']     ?? null,
            'ultimoMantenimiento'  => $input['ultimoMantenimiento']  ?? null,
            'proximoMantenimiento' => $input['proximoMantenimiento'] ?? null,
            'estadoOperativo'      => estadoOperativoValido($input['estadoOperativo'] ?? 'operativa'),
            'observaciones'        => $input['observaciones'] ?? null,
            'estado'               => 1,
        ]));
        break;

    // ----- ELIMINAR (soft delete) -----
    case 'DELETE':
        $input = getInput();
        $id    = $input['id'] ?? null;
        if (!$id) jsonError('ID requerido');
        $stmt = $db->prepare('UPDATE maquinaria SET estado = 0 WHERE id = ?');
        $stmt->execute([$id]);
        jsonResponse(['message' => 'Equipo eliminado']);
        break;

    default:
        jsonError('Método no permitido', 405);
}
