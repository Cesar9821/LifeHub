import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler desactivado: rompía la hidratación de los formularios.
  reactCompiler: false,

  // Redirige rutas antiguas a la nueva estructura de módulos.
  async redirects() {
    return [
      { source: '/dashboard', destination: '/finanzas/dashboard', permanent: false },
      { source: '/transactions', destination: '/finanzas/movimientos', permanent: false },
      { source: '/fixed-expenses', destination: '/finanzas/planificacion', permanent: false },
      { source: '/savings', destination: '/finanzas/savings', permanent: false },
      { source: '/credits', destination: '/finanzas/credits', permanent: false },
      { source: '/performance', destination: '/finanzas/performance', permanent: false },
      // Módulos fusionados
      { source: '/finanzas/transactions', destination: '/finanzas/movimientos', permanent: false },
      { source: '/finanzas/fixed-expenses', destination: '/finanzas/planificacion', permanent: false },
      { source: '/finanzas/budgets', destination: '/finanzas/planificacion', permanent: false },
    ];
  },
};

export default nextConfig;
