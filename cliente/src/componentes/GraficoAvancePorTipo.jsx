import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORES = ['#0071E3', '#10B981'];

const etiquetaPersonalizada = ({ cx, cy, midAngle, outerRadius, payload }) => {
  const RADIAN = Math.PI / 180;
  const radio = outerRadius + 32;
  const x = cx + radio * Math.cos(-midAngle * RADIAN);
  const y = cy + radio * Math.sin(-midAngle * RADIAN);
  const anchor = x > cx ? 'start' : 'end';
  return (
    <text fontSize={11} textAnchor={anchor}>
      <tspan x={x} y={y - 7} fontWeight="600" fill="#1D1D1F">{payload.tipo}</tspan>
      <tspan x={x} y={y + 8} fill="#6E6E73">{payload.porcentaje}% · {payload.completados}/{payload.total}</tspan>
    </text>
  );
};

export default function GraficoAvancePorTipo({ datos }) {
  if (datos.length === 0) {
    return (
      <div className="superficie-tarjeta rounded-lg-token p-6 flex flex-col">
        <h3 className="text-etiqueta text-plataformaSecundario uppercase mb-4">Avance por Tipo</h3>
        <div className="flex-1 flex items-center justify-center text-cuerpo-pequeno text-plataformaSecundario">
          Sin proveedores críticos para mostrar.
        </div>
      </div>
    );
  }

  return (
    <div className="superficie-tarjeta rounded-lg-token p-6">
      <h3 className="text-etiqueta text-plataformaSecundario uppercase mb-4">Avance por Tipo</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={82}
              dataKey="completados"
              nameKey="tipo"
              paddingAngle={4}
              strokeWidth={0}
              label={etiquetaPersonalizada}
              labelLine={false}
            >
              {datos.map((_, indice) => (
                <Cell key={indice} fill={COLORES[indice % COLORES.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(valor, nombre, props) => [`${valor}/${props.payload.total} completados`, nombre]}
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
            />
            <Legend verticalAlign="bottom" formatter={(valor) => <span className="text-xs">{valor}</span>} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
