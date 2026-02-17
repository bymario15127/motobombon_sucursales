// backend/routes/reportes.js
import express from "express";
import { getDbFromRequest } from "../database/dbManager.js";
import XLSX from "xlsx";

const router = express.Router();

// GET /api/reportes/promociones-excel?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/promociones-excel", async (req, res) => {
  try {
    const db = getDbFromRequest(req);
    const { from, to, mode } = req.query;

    const filters = [];
    const params = [];

    filters.push("c.promocion_id IS NOT NULL");

    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
      filters.push("c.fecha >= ?");
      params.push(from);
    }
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
      filters.push("c.fecha <= ?");
      params.push(to);
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    // Si se solicita 'summary', agregamos por promoción
    if (mode === 'summary') {
      const rows = await db.all(
        `SELECT 
            p.nombre AS promocion_nombre,
            COUNT(*) AS cantidad,
            SUM(
              CASE 
                WHEN CAST(c.cilindraje AS INTEGER) BETWEEN 50 AND 405 THEN COALESCE(p.precio_cliente_bajo_cc, 0)
                WHEN CAST(c.cilindraje AS INTEGER) > 405 THEN COALESCE(p.precio_cliente_alto_cc, 0)
                ELSE COALESCE(p.precio_cliente_bajo_cc, COALESCE(p.precio_cliente_alto_cc, 0))
              END
            ) AS total_cliente,
            SUM(
              CASE 
                WHEN CAST(c.cilindraje AS INTEGER) BETWEEN 50 AND 405 THEN COALESCE(p.precio_comision_bajo_cc, 0)
                WHEN CAST(c.cilindraje AS INTEGER) > 405 THEN COALESCE(p.precio_comision_alto_cc, 0)
                ELSE COALESCE(p.precio_comision_bajo_cc, COALESCE(p.precio_comision_alto_cc, 0))
              END
            ) AS total_base_comision
         FROM citas c
         INNER JOIN promociones p ON p.id = c.promocion_id
         ${where}
         GROUP BY p.nombre
         ORDER BY total_cliente DESC`,
        params
      );

      const data = rows.map(r => ({
        Promocion: r.promocion_nombre,
        Cantidad: r.cantidad,
        TotalCliente: r.total_cliente,
        TotalBaseComision: r.total_base_comision,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Resumen");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      const filename = `promociones-resumen-${new Date().toISOString().slice(0, 10)}.xlsx`;
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return res.status(200).send(buffer);
    }

    const rows = await db.all(
      `SELECT c.id, c.fecha, c.hora, c.cliente, c.telefono, c.email, c.placa, c.marca, c.modelo, c.cilindraje, c.metodo_pago, c.servicio,
              c.estado, c.promocion_id,
              p.nombre AS promocion_nombre,
              p.precio_cliente_bajo_cc, p.precio_cliente_alto_cc,
              p.precio_comision_bajo_cc, p.precio_comision_alto_cc
       FROM citas c
       INNER JOIN promociones p ON p.id = c.promocion_id
       ${where}
       ORDER BY c.fecha DESC, COALESCE(c.hora, '') DESC, c.id DESC`,
      params
    );

    // Transformar para Excel
    const data = rows.map((r) => {
      const cc = Number(r.cilindraje || 0);
      const bajo = !isNaN(cc) && cc >= 50 && cc <= 405;
      const alto = !isNaN(cc) && cc > 405;

      const precioClienteAplicado = bajo
        ? r.precio_cliente_bajo_cc
        : alto
        ? r.precio_cliente_alto_cc
        : r.precio_cliente_bajo_cc || r.precio_cliente_alto_cc || null;

      const baseComisionAplicada = bajo
        ? r.precio_comision_bajo_cc
        : alto
        ? r.precio_comision_alto_cc
        : r.precio_comision_bajo_cc || r.precio_comision_alto_cc || null;

      return {
        ID: r.id,
        Fecha: r.fecha,
        Hora: r.hora || "",
        Cliente: r.cliente,
        Telefono: r.telefono,
        Email: r.email || "",
        Placa: r.placa || "",
        Marca: r.marca || "",
        Modelo: r.modelo || "",
        Cilindraje: r.cilindraje || "",
        MetodoPago: r.metodo_pago || "",
        Estado: r.estado || "",
        Promocion: r.promocion_nombre,
        PrecioClienteAplicado: precioClienteAplicado || 0,
        BaseComisionAplicada: baseComisionAplicada || 0,
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Promociones");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const filename = `promociones-detallado-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    return res.status(200).send(buffer);
  } catch (err) {
    console.error("Error generando Excel de promociones:", err);
    return res.status(500).json({ error: "No se pudo generar el Excel" });
  }
});

export default router;
