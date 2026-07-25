import { createClient } from '@/lib/supabase/server';
import { Trash2, Calendar, AlertCircle, CreditCard, Layers, Zap } from 'lucide-react';
import ExpenseForm from './ExpenseForm';
import { 
  addExpenseAction, 
  deleteExpenseAction, 
  payFixedExpenseAction,
  payAllFixedExpensesAction 
} from './actions';

export default async function FixedExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ pagos?: string }>;
}) {
  const supabase = await createClient();

  const { data: fixedExpenses } = await supabase
    .from('fixed_expenses')
    .select('*')
    .order('due_day', { ascending: true });

  const params = await searchParams;
  const pagosAgregados = params?.pagos;

  const totalMensual = fixedExpenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

  return (
    // Reducción de padding en móvil para ganar área de trabajo
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24 p-4 md:p-8">
      
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic leading-none">
            Gastos <span className="text-indigo-500">Fijos.</span>
          </h1>
          <p className="text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-[0.4em] ml-1">
            Estructura de costos mensuales
          </p>
        </div>

        {/* Card de Total: Más compacta en móvil */}
        <div className="bg-indigo-500/5 border border-indigo-500/10 p-5 md:px-8 md:py-6 rounded-[2rem] backdrop-blur-md flex items-center gap-4 md:gap-6 self-start md:self-auto w-full md:w-auto">
          <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Carga Total Mes</p>
            <p className="text-2xl md:text-4xl font-black text-white font-mono leading-none tracking-tighter">
              ${totalMensual.toLocaleString('es-CL')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        
        {/* COLUMNA FORMULARIO */}
        <div className="lg:col-span-4 h-fit lg:sticky lg:top-8">
          <div className="bg-slate-900/40 border border-white/5 p-6 md:p-8 rounded-[2.5rem] backdrop-blur-xl">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Layers size={16} className="text-indigo-400" />
                <h2 className="text-white font-black text-lg uppercase tracking-tighter">Nueva Obligación</h2>
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                Configura un pago recurrente
              </p>
            </div>
            <ExpenseForm addExpenseAction={addExpenseAction} />
          </div>
        </div>

        {/* COLUMNA LISTADO */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">
              Compromisos Registrados
            </h2>
            <span className="text-[10px] bg-white/5 text-slate-400 border border-white/10 px-4 py-1.5 rounded-full font-black uppercase tracking-tighter">
              {fixedExpenses?.length || 0} Items
            </span>
          </div>

          {pagosAgregados && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] px-6 py-4 rounded-2xl text-center animate-in fade-in slide-in-from-top-4 duration-500">
              🚀 {pagosAgregados} PAGOS PROCESADOS EN EL LIBRO MAYOR
            </div>
          )}

          {(!fixedExpenses || fixedExpenses.length === 0) && (
            <div className="border-2 border-dashed border-slate-800/50 rounded-[3rem] p-12 md:p-24 flex flex-col items-center justify-center text-center gap-4 bg-slate-950/20">
              <AlertCircle size={40} className="text-slate-800" />
              <p className="text-slate-600 font-black uppercase text-xs tracking-widest">
                No hay gastos fijos registrados
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {fixedExpenses?.map((expense) => (
              <div
                key={expense.id}
                className="bg-slate-900/20 border border-white/5 p-5 md:p-6 rounded-[2.2rem] flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-800/40 transition-all group gap-4"
              >
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="h-12 w-12 md:h-14 md:w-14 shrink-0 bg-slate-950 border border-slate-800 text-indigo-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:border-indigo-500/30 transition-colors">
                    <Calendar size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-base md:text-xl tracking-tight truncate uppercase">
                      {expense.description}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[8px] md:text-[9px] font-black text-indigo-400 border border-indigo-500/20 bg-indigo-500/5 px-2 py-0.5 rounded-md uppercase tracking-widest">
                        Día {expense.due_day}
                      </span>
                      <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        {expense.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contenedor de Precio y Acciones */}
                <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-8 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-0.5 tracking-tighter">
                      Monto Mensual
                    </p>
                    <span className="text-xl md:text-2xl font-black text-white font-mono tracking-tighter">
                      ${Number(expense.amount).toLocaleString('es-CL')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <form
                      action={async () => {
                        'use server';
                        await payFixedExpenseAction({
                          description: expense.description,
                          amount: expense.amount,
                          category: expense.category,
                        });
                      }}
                    >
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black px-4 md:px-5 py-3 md:py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 whitespace-nowrap"
                      >
                        <CreditCard size={12} />
                        PAGAR
                      </button>
                    </form>

                    <form action={deleteExpenseAction}>
                      <input type="hidden" name="id" value={expense.id} />
                      <button
                        type="submit"
                        className="h-10 w-10 md:h-11 md:w-11 flex items-center justify-center rounded-xl text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ACCIÓN MASIVA */}
          {fixedExpenses && fixedExpenses.length > 0 && (
            <div className="mt-8 md:mt-12 flex justify-center">
              <form action={payAllFixedExpensesAction} className="w-full max-w-md">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] md:text-[11px] font-black px-6 py-4 md:py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 group"
                >
                  <div className="p-1.5 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
                    <CreditCard size={14} />
                  </div>
                  PAGAR TODA LA ESTRUCTURA FIJA
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}