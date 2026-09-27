# Plan financiero del hogar

Presupuesto mensual por concepto, deuda CMR con plan de adelantos, resumen anual y aporte proporcional de Camila y César. Datos compartidos en tiempo real entre los dos.

## Puesta en marcha (una sola vez)

1. **Base de datos.** En Supabase → SQL Editor, pega y ejecuta `supabase/schema-plan-hogar.sql`. Es aditivo y se puede volver a correr.
2. **Desplegar.** `git push`: Vercel despliega solo. No hay variables de entorno nuevas (usa las de Supabase que ya están configuradas).
3. **Cargar el plan.** Abre la app → **Inicio** (o Finanzas → Presupuesto) → **Cargar plan del hogar**.
   - Con la casilla marcada, primero borra los datos antiguos de Finanzas **solo de tu hogar**: movimientos, planificación, presupuestos, créditos y categorías. Ahorros, metas y el resto de LifeHub no se tocan.
   - Carga octubre 2026 a septiembre 2027 con los montos del Excel, la deuda CMR (pago fijo $250.000 desde noviembre) y a Camila y César como personas del plan.
4. **Camila.** Necesita su propio usuario dentro del hogar (Finanzas → Ajustes → invitar). Así los dos ven lo mismo y cada movimiento queda con quién lo registró.

## Uso diario

- **+ Gasto** (botón flotante en Inicio y en todo Finanzas): monto, concepto, quién pagó, medio de pago y fecha. Si el concepto es *CMR plan casa*, pide el ítem de la deuda. Sirve también para ingresos.
- **Inicio**: disponible del mes (ingresos − gastado real), gastado vs presupuesto, ahorro acumulado, alertas y qué adelantar en la CMR.
- **Presupuesto**: por grupo, con estado de cada concepto. El monto se edita solo para ese mes o de ahí en adelante.
- **Deuda CMR**: progreso, fecha de término, plan mes a mes. Cambiar el pago fijo, el mes de inicio, las cuotas o la prioridad recalcula el plan.
- **Resumen anual**: ingresos, presupuesto, gastado, saldo, ahorro acumulado, pago CMR y % del ingreso en deudas (en rojo sobre 30%).

## Reglas

| Regla | Cómo se aplica |
|---|---|
| Mes del presupuesto | El mes en que sale la plata (la fecha del gasto). |
| Estados | OK bajo 85% · Cerca del límite desde 85% · Pasado sobre 100% · Sin presupuesto si hay gasto con presupuesto 0. |
| Ingresos del mes | Lo registrado para cada sueldo; si no hay registro, el presupuestado. |
| Ahorro acumulado | Suma de (ingresos − gastado real) de los meses cerrados. Los meses actual y futuros se proyectan con el presupuesto. |
| Aporte | Sueldo de cada uno / total de sueldos, aplicado a los gastos presupuestados. |
| Plan CMR | Cuota = min(cuota, saldo); lo que sobra del pago fijo adelanta por prioridad. Meses pasados usan lo pagado de verdad. |

## Tests

```bash
npm test
```

Incluye la tabla esperada del plan CMR (nov 2026 → mar 2027), los estados del presupuesto y el aporte proporcional.
