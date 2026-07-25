import { createClient } from '@/lib/supabase/server';
import { getActiveHouseholdId } from '@/lib/auth';
import { NextResponse } from 'next/server';

/** Escapa un valor para CSV (comillas, comas, saltos de línea). */
function esc(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Record<string, unknown>[], headers: string[]): string {
  const head = headers.map(esc).join(';');
  const body = rows
    .map((r) => headers.map((h) => esc(r[h])).join(';'))
    .join('\n');
  return body ? `${head}\n${body}` : head;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const householdId = await getActiveHouseholdId();

  const { searchParams } = new URL(request.url);
  const dataset = searchParams.get('tipo') || 'movimientos';

  let csv = '';
  let filename = 'export.csv';

  if (dataset === 'movimientos') {
    const { data } = await supabase
      .from('movements')
      .select(
        'due_date, period_month, description, kind, category, estimated_amount, actual_amount, status, confirmed_at'
      )
      .eq('household_id', householdId)
      .order('due_date', { ascending: false });

    const rows = (data || []).map((m) => ({
      Fecha: m.due_date,
      Mes: String(m.period_month).slice(0, 7),
      Descripcion: m.description,
      Tipo: m.kind === 'income' ? 'Ingreso' : 'Gasto',
      Categoria: m.category,
      MontoEstimado: m.estimated_amount,
      MontoReal: m.actual_amount ?? '',
      Estado: m.status === 'confirmed' ? 'Confirmado' : 'Pendiente',
      ConfirmadoEl: m.confirmed_at ? String(m.confirmed_at).slice(0, 10) : '',
    }));

    csv = toCsv(rows, [
      'Fecha', 'Mes', 'Descripcion', 'Tipo', 'Categoria',
      'MontoEstimado', 'MontoReal', 'Estado', 'ConfirmadoEl',
    ]);
    filename = 'lifehub-movimientos.csv';
  } else if (dataset === 'planificacion') {
    const { data } = await supabase
      .from('recurring_items')
      .select('description, kind, amount, is_variable, due_day, category, is_active')
      .eq('household_id', householdId)
      .order('due_day', { ascending: true });

    const rows = (data || []).map((r) => ({
      Descripcion: r.description,
      Tipo: r.kind === 'income' ? 'Ingreso' : 'Gasto',
      Monto: r.amount,
      MontoVariable: r.is_variable ? 'Si' : 'No',
      DiaDelMes: r.due_day,
      Categoria: r.category,
      Activo: r.is_active ? 'Si' : 'No',
    }));

    csv = toCsv(rows, [
      'Descripcion', 'Tipo', 'Monto', 'MontoVariable', 'DiaDelMes', 'Categoria', 'Activo',
    ]);
    filename = 'lifehub-planificacion.csv';
  } else if (dataset === 'ahorros') {
    const { data } = await supabase
      .from('savings')
      .select('name, current_amount, target_amount, created_at')
      .eq('household_id', householdId);

    const rows = (data || []).map((s) => ({
      Nombre: s.name,
      MontoActual: s.current_amount,
      Objetivo: s.target_amount,
      Creado: String(s.created_at).slice(0, 10),
    }));

    csv = toCsv(rows, ['Nombre', 'MontoActual', 'Objetivo', 'Creado']);
    filename = 'lifehub-ahorros.csv';
  } else if (dataset === 'creditos') {
    const { data } = await supabase
      .from('credits')
      .select(
        'name, total_amount, remaining_amount, installment_value, paid_installments, total_installments'
      )
      .eq('household_id', householdId);

    const rows = (data || []).map((c) => ({
      Nombre: c.name,
      MontoTotal: c.total_amount,
      SaldoPendiente: c.remaining_amount,
      ValorCuota: c.installment_value,
      CuotasPagadas: c.paid_installments,
      CuotasTotales: c.total_installments,
    }));

    csv = toCsv(rows, [
      'Nombre', 'MontoTotal', 'SaldoPendiente', 'ValorCuota', 'CuotasPagadas', 'CuotasTotales',
    ]);
    filename = 'lifehub-creditos.csv';
  } else {
    return NextResponse.json({ error: 'Tipo de export no válido' }, { status: 400 });
  }

  // BOM para que Excel reconozca los acentos correctamente
  const bom = '\uFEFF';

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
