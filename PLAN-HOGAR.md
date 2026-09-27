# Plan financiero del hogar

Finanzas de Camila y César, mes a mes: cuentas por pagar con un toque, gastos variables con su tope, deuda CMR con plan de adelantos y resumen anual. Los dos ven y editan lo mismo en tiempo real.

## Puesta en marcha (una sola vez)

1. **Base de datos.** En Supabase → SQL Editor, ejecuta en orden:
   1. `supabase/schema-plan-hogar.sql`
   2. `supabase/schema-plan-hogar-v2.sql` (cuentas del mes)

   Los dos son aditivos y se pueden volver a correr.
2. **Desplegar.** `git push`: Vercel despliega solo. No hay variables de entorno nuevas.
3. **Cargar el plan.** Abre Finanzas → **Cargar plan del hogar**. Con la casilla marcada borra primero los datos antiguos de Finanzas **solo de tu hogar** (Ahorros, Metas y el resto de LifeHub no se tocan) y carga octubre 2026 a septiembre 2027.
4. **Camila.** Necesita su propio usuario en el hogar (Finanzas → Más → Ajustes → invitar).
5. **Días de vencimiento (opcional).** En Presupuesto → Editar, pon el día en que vence cada cuenta (arriendo, luz…). Así se ordenan, se marcan en rojo si se atrasan y llega el recordatorio diario.

## Cómo se usa

En el celular hay 5 pestañas abajo: **Mes · Movimientos · Presupuesto · Deuda · Más**.

| Pantalla | Para qué |
|---|---|
| **Mes** | Lo del día a día: cuánto queda disponible, **cuentas del mes** (Pagar / Recibí en un toque, Deshacer), **gastos variables** con su barra, alertas y lo último registrado. |
| **Movimientos** | Todo lo registrado del mes, filtrable por Gastos / Ingresos y por persona. Editar y borrar. |
| **Presupuesto** | El plan: monto de cada concepto (solo este mes o de aquí en adelante), agregar, editar, archivar conceptos y agregar meses. |
| **Deuda** | Plan CMR: cuánto va pagado, cuándo termina, qué adelantar este mes, pago fijo y mes de inicio. |
| **Más** | Resumen anual, Ahorros, Ajustes (miembros, Mercado Pago, exportar CSV). |

- **Cuenta del mes** (arriendo, luz, sueldos, cuotas CMR…): se paga una vez. Tocas **Pagar**, el monto ya viene puesto, eliges quién pagó y el medio, y confirmas.
- **Gasto variable** (súper, ocio, imprevistos…): varias compras. Tocas la barra (o **+ Gasto**) y registras cada compra.
- Cada concepto se puede cambiar entre cuenta y gasto variable en Presupuesto → Editar.

## Reglas

| Regla | Cómo se aplica |
|---|---|
| Mes del presupuesto | El mes en que sale la plata (la fecha del pago). |
| Cuenta pagada | Hay al menos un pago de ese concepto en el mes. Sin pagar después del día de vencimiento = vencida. |
| Estados de gastos | OK bajo 85% · Cerca del límite desde 85% · Pasado sobre 100% · Sin presupuesto si hay gasto con presupuesto 0. |
| Ingresos del mes | Lo registrado para cada sueldo; si aún no se marca "Recibí", el presupuestado. |
| Ahorro acumulado | Suma de (ingresos − gastado real) de los meses cerrados. Los meses actual y futuros se proyectan con el presupuesto. |
| Aporte | Sueldo de cada uno / total de sueldos, aplicado a los gastos presupuestados. |
| Plan CMR | Cuota = min(cuota, saldo); lo que sobra del pago fijo adelanta por prioridad. Los meses pasados usan lo pagado de verdad. |

## Notificaciones

El resumen diario avisa de las cuentas vencidas o que vencen hoy (solo las que tienen día de vencimiento), y el aviso de saldo bajo usa el mismo "disponible" que muestra la app.

## Tests

```bash
npm test
```

Cubre el plan CMR (con la tabla esperada nov 2026 → mar 2027), las cuentas del mes, los estados del presupuesto y el aporte proporcional.
