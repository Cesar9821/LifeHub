import { Tag, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { getCategories } from '@/services/categories';
import { addCategory, deleteCategory } from './actions';

export default async function CategoriesPage() {
  const categories = await getCategories();
  const income = categories.filter((c) => c.kind === 'income');
  const expense = categories.filter((c) => c.kind === 'expense');

  const inputStyles =
    'bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all backdrop-blur-md w-full';

  return (
    <div className="space-y-8 md:space-y-12 pb-20">
      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50 backdrop-blur-md w-fit">
          <Tag size={14} className="text-indigo-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Organización
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter italic leading-none">
          Categorías<span className="text-indigo-500">.</span>
        </h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] max-w-md">
          Define cómo clasificas tus ingresos y gastos
        </p>
      </div>

      {/* FORMULARIO */}
      <form
        action={addCategory}
        className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Nombre de la categoría
          </label>
          <input
            name="name"
            required
            placeholder="Ej: Mascotas, Gimnasio…"
            className={inputStyles}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Tipo
          </label>
          <select name="kind" defaultValue="expense" className={`${inputStyles} appearance-none pr-8`}>
            <option value="expense" className="bg-[#0A0C10]">Gasto</option>
            <option value="income" className="bg-[#0A0C10]">Ingreso</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-white text-black px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95"
        >
          <Plus size={16} /> Agregar
        </button>
      </form>

      {/* LISTADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-6">
            <TrendingDown size={18} className="text-rose-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Gastos</h2>
            <span className="text-xs font-bold text-slate-600">({expense.length})</span>
          </div>
          <CategoryList items={expense} emptyMsg="Aún no tienes categorías de gasto." />
        </div>

        {/* Ingresos */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-emerald-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">Ingresos</h2>
            <span className="text-xs font-bold text-slate-600">({income.length})</span>
          </div>
          <CategoryList items={income} emptyMsg="Aún no tienes categorías de ingreso." />
        </div>
      </div>
    </div>
  );
}

function CategoryList({
  items,
  emptyMsg,
}: {
  items: { id: string; name: string }[];
  emptyMsg: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-600 font-medium">{emptyMsg}</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((cat) => (
        <div
          key={cat.id}
          className="flex items-center justify-between bg-black/20 border border-white/5 rounded-xl px-4 py-3 group"
        >
          <span className="text-sm font-bold text-slate-200">{cat.name}</span>
          <form action={deleteCategory}>
            <input type="hidden" name="id" value={cat.id} />
            <button
              type="submit"
              title="Eliminar categoría"
              className="text-slate-600 hover:text-rose-400 transition-colors p-1 opacity-60 md:opacity-0 md:group-hover:opacity-100"
            >
              <Trash2 size={15} />
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
