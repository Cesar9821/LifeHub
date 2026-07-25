'use server'

import { createClient } from '@/lib/supabase/server'
import { getActiveHouseholdId } from '@/lib/auth'
import { getMovements, summarize, periodOf, shiftPeriod } from '@/services/movements'

const CLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

export async function getPerformanceData(period = periodOf()) {
  const supabase = await createClient()
  const householdId = await getActiveHouseholdId()

  const [movements, recurringRes, goalsRes, creditsRes] = await Promise.all([
    getMovements(period),
    supabase
      .from('recurring_items')
      .select('kind, amount, is_active')
      .eq('household_id', householdId)
      .eq('is_active', true),
    supabase
      .from('savings')
      .select('current_amount, target_amount, name')
      .eq('household_id', householdId),
    supabase
      .from('credits')
      .select('remaining_amount, installment_value, name')
      .eq('household_id', householdId),
  ])

  const month = summarize(movements)
  const goals = goalsRes.data ?? []
  const credits = creditsRes.data ?? []
  const recurring = recurringRes.data ?? []

  // Mes actual, desde Movimientos (misma fuente que el Dashboard)
  const ingresosMes = month.incomeConfirmed
  const gastosMes = month.expenseConfirmed

  // Compromisos planificados
  const totalFijos = recurring
    .filter(r => r.kind === 'expense')
    .reduce((a, b) => a + Number(b.amount), 0)
  const cuotaCreditos = credits.reduce((a, b) => a + Number(b.installment_value), 0)
  const deudaTotal = credits.reduce((a, b) => a + Number(b.remaining_amount), 0)

  const totalAhorros = goals.reduce((a, b) => a + Number(b.current_amount), 0)
  const patrimonio = totalAhorros - deudaTotal

  const compromisoMensual = totalFijos + cuotaCreditos
  // Flujo disponible: lo que queda tras cubrir lo confirmado y lo aún pendiente
  const flujoPotencial = month.projectedBalance

  const metaObj = goals.reduce((a, b) => a + Number(b.target_amount), 0)
  const metaAct = totalAhorros
  const faltanteMeta = metaObj - metaAct

  // Histórico: suma de los últimos 6 meses
  const periods = Array.from({ length: 6 }, (_, i) => shiftPeriod(period, -(5 - i)))
  const historic = await Promise.all(periods.map(p => getMovements(p)))
  const ingresosHistoricos = historic.reduce((a, ms) => a + summarize(ms).incomeConfirmed, 0)
  const gastosHistoricos = historic.reduce((a, ms) => a + summarize(ms).expenseConfirmed, 0)

  const insights = []

  if (metaObj > 0) {
    const mesesParaMeta = flujoPotencial > 0 ? Math.ceil(faltanteMeta / flujoPotencial) : null
    insights.push({
      id: 'saving',
      title: 'Ruta a la Meta',
      desc: mesesParaMeta && mesesParaMeta > 0
        ? `A tu ritmo actual, completarás tus objetivos en ${mesesParaMeta} mes${mesesParaMeta !== 1 ? 'es' : ''}.`
        : faltanteMeta <= 0
        ? '¡Meta alcanzada! Estás por encima de tu objetivo.'
        : 'Tu flujo mensual no alcanza para las metas. Revisa tus gastos fijos.',
      action: mesesParaMeta && mesesParaMeta > 0
        ? `Para llegar en 3 meses, ahorra ${CLP(Math.ceil(faltanteMeta / 3))} al mes.`
        : faltanteMeta <= 0
        ? 'Considera aumentar tu meta o invertir el excedente.'
        : 'Reduce gastos variables o aumenta tus ingresos.'
    })
  }

  const debtRatio = ingresosMes > 0 ? (cuotaCreditos / ingresosMes) * 100 : 0
  if (credits.length > 0) {
    insights.push({
      id: 'debt',
      title: 'Carga de Deuda',
      desc: ingresosMes > 0
        ? `Tus cuotas consumen el ${debtRatio.toFixed(1)}% de tus ingresos este mes.`
        : `Tienes ${CLP(cuotaCreditos)} en cuotas mensuales a cubrir.`,
      action: debtRatio > 30
        ? 'Nivel alto: Evita nuevos créditos y prioriza liquidar el de mayor saldo.'
        : debtRatio > 0
        ? 'Nivel manejable. Mantén el pago puntual para mejorar tu historial.'
        : 'Sin cuotas activas este mes.'
    })
  }

  const gastoMensualEstimado = gastosMes > 0 ? gastosMes : compromisoMensual
  const runwayMeses = gastoMensualEstimado > 0 && totalAhorros > 0
    ? (totalAhorros / gastoMensualEstimado).toFixed(1)
    : '0'

  insights.push({
    id: 'runway',
    title: 'Resiliencia Financiera',
    desc: parseFloat(runwayMeses) > 0
      ? `Con tus ahorros actuales podrías vivir ${runwayMeses} mes${parseFloat(runwayMeses) !== 1 ? 'es' : ''} sin ingresos.`
      : 'Sin fondo de emergencia activo aún.',
    action: parseFloat(runwayMeses) < 3
      ? 'Prioritario: Construir fondo de emergencia de al menos 3 meses.'
      : parseFloat(runwayMeses) < 6
      ? 'Bien encaminado. Apunta a 6 meses de gastos como colchón ideal.'
      : 'Excelente resiliencia. Considera invertir el excedente.'
  })

  // Pendientes reales del mes (desde Movimientos, no de plantillas)
  const pendienteMes = month.pendingExpense

  const score = calcularSalud(flujoPotencial, totalAhorros, deudaTotal, ingresosMes, gastosMes)

  return {
    metrics: {
      ingresos: ingresosMes,
      gastos: gastosMes,
      patrimonio,
      score,
      ingresosHistoricos,
      gastosHistoricos,
    },
    pendientes: {
      gastosFijos: totalFijos,
      cuotasCreditos: cuotaCreditos,
      totalMes: pendienteMes > 0 ? pendienteMes : compromisoMensual
    },
    meta: {
      actual: metaAct,
      objetivo: metaObj,
      porcentaje: metaObj > 0 ? Math.min((metaAct / metaObj) * 100, 100) : 0
    },
    insights
  }
}

function calcularSalud(neto: number, ahorros: number, deuda: number, ingresos: number, gastos: number): number {
  let s = 50
  if (neto > 0) s += 20
  if (neto < 0) s -= 20
  if (ahorros > deuda) s += 15
  if (deuda > 0 && ahorros === 0) s -= 10
  if (ingresos > 0) {
    const ratio = gastos / ingresos
    if (ratio < 0.5) s += 15
    else if (ratio < 0.7) s += 8
    else if (ratio > 0.9) s -= 15
  }
  return Math.max(0, Math.min(100, s))
}
