import { createClient } from '@/lib/supabase/server';
import { Activity, Trash2, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import TransactionForm from './transaction-form';
import { deleteTransaction } from './actions';
import { getExpenseCategoryNames } from '@/services/categories';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; mes?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const filterType = params?.tipo || 'all';
  const filterMonth = params?.mes || '';

  const [
    { data: transactions },
    { data: savings },
    { data: credits },
    categoryNames
  ] = await Promise.all([
    supabase.from('transactions').select('*').order('created_at', { ascending: false }),
    supabase.from('savings').select('id, name'),
    supabase.from('credits').select('id, name'),
    getExpenseCategoryNames()
  ]);

  // Filtrar transacciones
  let filtered = transactions || [];
  if (filterType !== 'all') {
    filtered = filtered.filter(t => t.type === filterType);
  }
  if (filterMonth) {
    filtered = filtered.filter(t => {
      const d = new Date(t.created_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === filterMonth;
    });
  }

  // Totales del filtro actual
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

  const inputStyles = "bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all backdrop-blur-md w-full appearance-none";

  // Meses disponibles para filtro
  const availableMonths = [...new Set((transactions || []).map(t => {
    const d = new Date(t.created_at);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }))].sort().reverse();

  const monthLabels: Record<string, string> = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };

  return (
    <div className="space-y-8 md:space-y-10 pb-20">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md w-fit">
            <Activity size={12} className="text-emerald-400" />
            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Libro Mayor Digital</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic">
            Transacciones<span className="text-indigo-500">.</span>
          </h1>
        </div>

        {/* Resumen rápido */}
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
          <div className="bg-[#0A0C10] border border-white/10 p-4 rounded-[1.5rem] text-center">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Registros</p>
            <p className="text-2xl font-black text-white font-mono">{filtered.length}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-[1.5rem] text-center">
            <p className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Ingresos</p>
            <p className="text-sm font-black text-emerald-400 font-mono">
              {new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(totalIncome)}
            </p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-[1.5rem] text-center">
            <p className="text-[8px] font-black text-rose-500/60 uppercase tracking-widest mb-1">Gastos</p>
            <p className="text-sm font-black text-rose-400 font-mono">
              {new Intl.NumberFormat('es-CL', { notation: 'compact' }).format(totalExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* FORMULARIO */}
      <section className="relative z-20">
        <TransactionForm savings={savings || []} credits={credits || []} categories={categoryNames} inputStyles={inputStyles} />
      </section>

      {/* FILTROS */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-slate-500">
          <Filter size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">Filtrar:</span>
        </div>

        {/* Filtro tipo */}
        {['all', 'income', 'expense'].map((t) => (
          <a
            key={t}
            href={`/finanzas/transactions?tipo=${t}${filterMonth ? `&mes=${filterMonth}` : ''}`}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filterType === t
                ? 'bg-white text-black'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
            }`}
          >
            {t === 'all' ? 'Todos' : t === 'income' ? '🟢 Ingresos' : '🔴 Gastos'}
          </a>
        ))}

        {/* Filtro mes */}
        {availableMonths.length > 1 && (
          <select
            defaultValue={filterMonth}
            onChange={(e) => {
              window.location.href = `/transactions?tipo=${filterType}&mes=${e.target.value}`;
            }}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest appearance-none cursor-pointer hover:bg-white/10 transition-all"
          >
            <option value="">Todos los meses</option>
            {availableMonths.map(m => {
              const [y, mo] = m.split('-');
              return <option key={m} value={m}>{monthLabels[mo]} {y}</option>;
            })}
          </select>
        )}
      </div>

      {/* TABLA */}
      <div className="bg-[#0A0C10] backdrop-blur-md border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="p-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Fecha</th>
                <th className="p-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Descripción</th>
                <th className="p-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Categoría</th>
                <th className="p-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Destino</th>
                <th className="p-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Monto</th>
                <th className="p-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-center w-16">—</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filtered.length > 0 ? (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-all group">
                    <td className="p-5">
                      <span className="text-slate-400 font-mono text-xs">
                        {new Date(t.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </span>
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${t.type === 'income' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                        <span className="font-bold text-slate-200 text-sm group-hover:text-white transition-colors">
                          {t.description}
                        </span>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className="text-[9px] bg-slate-800/80 text-slate-400 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wide">
                        {t.category || 'General'}
                      </span>
                    </td>

                    <td className="p-5 text-center">
                      <span className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wide ${
                        t.destination === 'saving' ? 'border-amber-500/20 bg-amber-500/5 text-amber-400' :
                        t.destination === 'withdraw_saving' ? 'border-orange-500/20 bg-orange-500/5 text-orange-400' :
                        t.destination === 'credit' ? 'border-rose-500/20 bg-rose-500/5 text-rose-400' :
                        'border-slate-700/50 bg-slate-800/30 text-slate-500'
                      }`}>
                        {t.destination === 'saving' ? 'Ahorro' :
                         t.destination === 'withdraw_saving' ? 'Retiro' :
                         t.destination === 'credit' ? 'Crédito' : 'General'}
                      </span>
                    </td>

                    <td className={`p-5 text-right font-mono font-black text-sm ${
                      t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      <div className="flex items-center justify-end gap-1.5">
                        {t.type === 'income'
                          ? <TrendingUp size={14} className="opacity-60" />
                          : <TrendingDown size={14} className="opacity-60" />
                        }
                        {t.type === 'income' ? '+' : '-'}${Math.abs(Number(t.amount)).toLocaleString('es-CL')}
                      </div>
                    </td>

                    <td className="p-5 text-center">
                      <form action={async () => {
                        'use server';
                        await deleteTransaction(t.id);
                      }}>
                        <button
                          type="submit"
                          className="text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 p-2.5 rounded-xl transition-all active:scale-90"
                        >
                          <Trash2 size={15} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Activity size={40} className="text-slate-500" />
                      <p className="text-slate-500 italic text-xs tracking-[0.3em] uppercase font-black">
                        Sin movimientos registrados
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
