"use client"
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://enttjeibmwmridctxifn.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudHRqZWlibXdtcmlkY3R4aWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjI4OTksImV4cCI6MjA4OTMzODg5OX0.uv33QIm1GGtnhI0oZ_NwNQyRlE4-m0fXbqddJY0iXhQ'
);

export default function AdminPanel() {
  const [precios, setPrecios] = useState<any[]>([]);
  const [dias, setDias] = useState<any[]>([]);
  const [horas, setHoras] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);

  useEffect(() => { 
    cargarTodo(); 
  }, []);

  async function cargarTodo() {
    const { data: p } = await supabase.from('configuracion_precios').select('*').order('id');
    const { data: d } = await supabase.from('dias_disponibles').select('*').order('id');
    const { data: h } = await supabase.from('horarios_disponibles').select('*').order('hora');
    
    // Traemos las citas ordenadas: las más nuevas primero
    const { data: c } = await supabase.from('citas').select('*').order('created_at', { ascending: false });
    
    if (p) setPrecios(p);
    if (d) setDias(d);
    if (h) setHoras(h);
    if (c) setCitas(c);
  }

  // FUNCIÓN PARA CAMBIAR EL ESTADO (Pendiente, Realizada, Cancelada)
  async function cambiarEstado(id: string, nuevoEstado: string) {
    const { error } = await supabase
      .from('citas')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (!error) {
      cargarTodo(); // Recargamos la lista para ver el cambio visual
    } else {
      alert("Error al actualizar: " + error.message);
    }
  }

  const toggleEstado = async (tabla: string, id: number, actual: boolean) => {
    await supabase.from(tabla).update({ activo: !actual }).eq('id', id);
    cargarTodo();
  };

  const actualizarPrecio = async (id: number, nuevo: string) => {
    await supabase.from('configuracion_precios').update({ precio: parseFloat(nuevo) }).eq('id', id);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-3xl font-black mb-8 text-gray-800">Panel de Control Spa Canino 🐾</h1>
      
      {/* SECCIÓN DE CONFIGURACIÓN RÁPIDA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* CONFIGURAR PRECIOS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold mb-4 text-blue-600 flex items-center gap-2">💰 Precios</h2>
          {precios.map(p => (
            <div key={p.id} className="flex justify-between items-center mb-2">
              <span className="text-sm capitalize">{p.servicio} ({p.tamano})</span>
              <input type="number" defaultValue={p.precio} onBlur={(e) => actualizarPrecio(p.id, e.target.value)}
                className="w-20 border rounded p-1 text-right text-sm font-bold text-blue-700 focus:ring-2 ring-blue-100 outline-none"/>
            </div>
          ))}
        </div>

        {/* CONFIGURAR DÍAS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold mb-4 text-green-600">📅 Días de Atención</h2>
          <div className="flex flex-wrap gap-2">
            {dias.map(d => (
              <button key={d.id} onClick={() => toggleEstado('dias_disponibles', d.id, d.activo)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${d.activo ? 'bg-green-500 text-white shadow-md' : 'bg-gray-200 text-gray-400'}`}>
                {d.dia_nombre}
              </button>
            ))}
          </div>
        </div>

        {/* CONFIGURAR HORARIOS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold mb-4 text-purple-600">⏰ Horas Activas</h2>
          <div className="grid grid-cols-4 gap-2">
            {horas.map(h => (
              <button key={h.id} onClick={() => toggleEstado('horarios_disponibles', h.id, h.activo)}
                className={`p-1 rounded text-[10px] font-bold transition-colors ${h.activo ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                {h.hora}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECCIÓN DE CITAS RECIBIDAS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 text-gray-800 tracking-tight">Citas Registradas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-widest">
                <th className="px-4 py-2">Mascota / Dueño</th>
                <th className="px-4 py-2">Servicio</th>
                <th className="px-4 py-2">Fecha y Hora</th>
                <th className="px-4 py-2 text-center">Estado</th>
                <th className="px-4 py-2 text-center">Acción</th>
                <th className="px-4 py-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id} className={`group transition-all ${
                  c.estado === 'cancelada' ? 'opacity-50 grayscale' : ''
                }`}>
                  <td className="px-4 py-4 bg-gray-50 rounded-l-xl">
                    <div className="font-black text-gray-700">{c.cliente_nombre}</div>
                    <div className="text-xs text-blue-500 font-bold">🐶 {c.perro_nombre}</div>
                  </td>
                  <td className="px-4 py-4 bg-gray-50 capitalize text-sm font-medium text-gray-600">
                    {c.servicio} <span className="text-[10px] opacity-50">({c.tamano})</span>
                  </td>
                  <td className="px-4 py-4 bg-gray-50 text-sm">
                    <div className="font-bold text-gray-700">{c.dia}</div>
                    <div className="text-xs text-gray-400">{c.horario}</div>
                  </td>
                  
                  {/* SELECTOR DE ESTADO DINÁMICO */}
                  <td className="px-4 py-4 bg-gray-50 text-center">
                    <select 
                      value={c.estado || 'pendiente'} 
                      onChange={(e) => cambiarEstado(c.id, e.target.value)}
                      className={`text-[10px] font-black uppercase p-1.5 rounded-lg border-2 outline-none cursor-pointer transition-all ${
                        c.estado === 'realizada' ? 'border-green-400 text-green-600 bg-green-50' :
                        c.estado === 'cancelada' ? 'border-red-400 text-red-600 bg-red-50' :
                        'border-yellow-400 text-yellow-600 bg-yellow-50'
                      }`}
                    >
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="realizada">✅ Realizada</option>
                      <option value="cancelada">❌ Cancelada</option>
                    </select>
                  </td>

                  <td className="px-4 py-4 bg-gray-50 text-center">
                    {c.whatsapp ? (
                      <a 
                        href={`https://wa.me/${c.whatsapp.replace(/\D/g,'')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 shadow-sm"
                      >
                        📱 WhatsApp
                      </a>
                    ) : <span className="text-gray-300 text-xs">-</span>}
                  </td>
                  <td className="px-4 py-4 bg-gray-50 text-right rounded-r-xl font-black text-gray-800">
                    ${c.precio}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {citas.length === 0 && (
            <div className="text-center py-20 text-gray-400 font-medium italic">
              Aún no hay citas registradas en la base de datos...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}