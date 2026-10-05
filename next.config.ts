import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler desactivado: rompía la hidratación de los formularios.
  reactCompiler: false,

  // Redirige rutas antiguas a la nueva estructura de módulos.
  async redirects() {
    return [
      // LifeHub 2.0: Hoy es el inicio; el antiguo hub de módulos se retiró
      { source: '/hub', destination: '/hoy', permanent: false },
      { source: '/inicio', destination: '/hoy', permanent: false },
      { source: '/mindset/habitos', destination: '/habitos', permanent: false },
      { source: '/dashboard', destination: '/finanzas', permanent: false },
      { source: '/transactions', destination: '/finanzas/movimientos', permanent: false },
      { source: '/fixed-expenses', destination: '/finanzas/presupuestos', permanent: false },
      { source: '/savings', destination: '/finanzas/savings', permanent: false },
      { source: '/credits', destination: '/finanzas/credits', permanent: false },
      { source: '/performance', destination: '/finanzas/resumen', permanent: false },
      // Pantallas fusionadas en el plan del hogar
      { source: '/finanzas/dashboard', destination: '/finanzas', permanent: false },
      { source: '/finanzas/performance', destination: '/finanzas/resumen', permanent: false },
      { source: '/finanzas/planificacion', destination: '/finanzas/presupuestos', permanent: false },
      { source: '/finanzas/categories', destination: '/finanzas/presupuestos', permanent: false },
      { source: '/finanzas/transactions', destination: '/finanzas/movimientos', permanent: false },
      { source: '/finanzas/fixed-expenses', destination: '/finanzas/presupuestos', permanent: false },
      { source: '/finanzas/budgets', destination: '/finanzas/presupuestos', permanent: false },
    ];
  },
};

export default nextConfig;
