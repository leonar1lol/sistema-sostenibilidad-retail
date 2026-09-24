import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function GraficoAvancePorUnidad({ datos }) {
  return (
    <div className="superficie-tarjeta rounded-lg-token p-6">
      <h3 className="text-etiqueta text-plataformaSecundario uppercase mb-4">Avance por Unidad</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 8, right: 8, bottom: 40, left: 0 }} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis
              dataKey="unidad"
              tick={{ fontSize: 10, fill: '#6E6E73' }}
              angle={-35}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6E6E73' }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(valor) => [`${valor}%`, 'Avance']}
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
            />
            <Bar dataKey="porcentaje" radius={[6, 6, 0, 0]}>
              {datos.map((fila, indice) => (
                <Cell
                  key={indice}
                  fill={fila.porcentaje === 100 ? '#10B981' : fila.porcentaje >= 50 ? '#0071E3' : '#F59E0B'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
