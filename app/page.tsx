"use client"
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://enttjeibmwmridctxifn.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudHRqZWlibXdtcmlkY3R4aWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjI4OTksImV4cCI6MjA4OTMzODg5OX0.uv33QIm1GGtnhI0oZ_NwNQyRlE4-m0fXbqddJY0iXhQ'
);

export default function ClienteForm() {
  const [form, setForm] = useState({ 
    cliente: '', perro: '', servicio: '', tamano: 'pequeño', dia: '', horario: '', whatsapp: '' 
  });
  
  const [listaPrecios, setListaPrecios] = useState<any[]>([]);
  const [serviciosUnicos, setServiciosUnicos] = useState<string[]>([]);
  const [precioActual, setPrecioActual] = useState(0);
  const [horasDisponibles, setHorasDisponibles] = useState<any[]>([]);
  const [diasActivos, setDiasActivos] = useState<any[]>([]);
  
  // NUEVO: Estado para saber si la cita se envió con éxito
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: p } = await supabase.from('configuracion_precios').select('*');
      if (p && p.length > 0) {
        setListaPrecios(p);
        const servicios = Array.from(new Set(p.map(item => item.servicio)));
        setServiciosUnicos(servicios);
        setForm(prev => ({ ...prev, servicio: servicios[0] }));
      }
      const { data: h } = await supabase.from('horarios_disponibles').select('*').eq('activo', true).order('hora');
      if (h) setHorasDisponibles(h);
      const { data: d } = await supabase.from('dias_disponibles').select('*').eq('activo', true);
      if (d) setDiasActivos(d);
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    const encontrado = listaPrecios.find(p => p.servicio === form.servicio && p.tamano === form.tamano);
    if (encontrado) setPrecioActual(encontrado.precio);
  }, [form.servicio, form.tamano, listaPrecios]);

  const enviarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('citas').insert([{ 
      cliente_nombre: form.cliente, perro_nombre: form.perro, servicio: form.servicio, 
      tamano: form.tamano, dia: form.dia, horario: form.horario, whatsapp: form.whatsapp, precio: precioActual,
      estado: 'pendiente'
    }]);

    if (!error) {
      setEnviado(true); // Mostramos la tarjeta de éxito
    } else {
      alert("Error: " + error.message);
    }
  };

  // Función para abrir WhatsApp con el mensaje pre-armado
  const abrirWhatsApp = () => {
    const telefonoNegocio = "8096485156"; // ⬅️ PON AQUÍ TU NÚMERO (con código de país sin el +)
    const texto = `¡Hola! Acabo de agendar una cita:
   *Perro:* ${form.perro}
   *Dueño:* ${form.cliente}
   *Servicio:* ${form.servicio} (${form.tamano})
   *Fecha:* ${form.dia}
  *Hora:* ${form.horario}
 *Total:* $${precioActual}
¿Me podrían confirmar?`;
    
    const url = `https://wa.me/${telefonoNegocio}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  // SI YA SE ENVIÓ, MOSTRAR TARJETA DE ÉXITO
  if (enviado) {
    return (
      <div className="p-10 max-w-md mx-auto bg-white shadow-2xl rounded-3xl mt-20 border text-center animate-in fade-in zoom-in duration-300">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">¡Cita Registrada!</h2>
        <p className="text-gray-500 mb-6 text-sm">Tu lugar para <b>{form.perro}</b> está reservado. Para finalizar, envía el comprobante por WhatsApp.</p>
        
        <button onClick={abrirWhatsApp} className="w-full bg-green-500 text-white p-4 rounded-2xl font-bold shadow-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2 mb-3">
          📱 ENVIAR A WHATSAPP
        </button>
        
        <button onClick={() => window.location.reload()} className="text-gray-400 text-xs hover:underline">
          Agendar otra cita
        </button>
      </div>
    );
  }

  // FORMULARIO NORMAL (lo que ya tenías)
  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow-xl rounded-3xl mt-10 border">
      <h1 className="text-2xl font-black text-blue-600 mb-6 text-center">RESERVA TU CITA 🐾</h1>
      <form onSubmit={enviarCita} className="space-y-4">
        <input className="w-full border-2 p-3 rounded-xl" placeholder="Tu Nombre" onChange={e => setForm({...form, cliente: e.target.value})} required />
        <input className="w-full border-2 p-3 rounded-xl" placeholder="Nombre del Perrito" onChange={e => setForm({...form, perro: e.target.value})} required />
        
        <div className="grid grid-cols-2 gap-2">
          <select className="border-2 p-3 rounded-xl bg-white capitalize" value={form.servicio} onChange={e => setForm({...form, servicio: e.target.value})} required>
            {serviciosUnicos.map(srv => <option key={srv} value={srv}>{srv}</option>)}
          </select>
          <select className="border-2 p-3 rounded-xl bg-white" onChange={e => setForm({...form, tamano: e.target.value})} required>
            <option value="pequeño">Pequeño</option>
            <option value="grande">Grande</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select className="border-2 p-3 rounded-xl bg-white text-sm" onChange={e => setForm({...form, dia: e.target.value})} required>
            <option value="">Selecciona Día</option>
            {Array.from({length: 14}).map((_, i) => {
              const f = new Date(); f.setDate(f.getDate() + i);
              const n = f.toLocaleDateString('es-ES', { weekday: 'long' });
              const nombre = n.charAt(0).toUpperCase() + n.slice(1);
              if (diasActivos.some(da => da.dia_nombre === nombre)) {
                return <option key={i} value={f.toISOString().split('T')[0]}>{nombre} {f.getDate()}</option>;
              }
            })}
          </select>

          <select className="border-2 p-3 rounded-xl bg-white text-sm" onChange={e => setForm({...form, horario: e.target.value})} required>
            <option value="">Selecciona Hora</option>
            {horasDisponibles.map(h => <option key={h.id} value={h.hora}>{h.hora}</option>)}
          </select>
        </div>

        <input className="w-full border-2 p-3 rounded-xl" placeholder="Tu WhatsApp" onChange={e => setForm({...form, whatsapp: e.target.value})} required />
        
        <div className="bg-blue-600 p-5 rounded-2xl text-center text-white">
          <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Total a pagar</p>
          <p className="text-4xl font-black">${precioActual}</p>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg">CONFIRMAR CITA</button>
      </form>
    </div>
  );
}