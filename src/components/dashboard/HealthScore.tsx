interface HealthScoreProps {
  score: number;
}

export const HealthScore = ({ score }: HealthScoreProps) => {
  const getStatus = () => {
    if (score >= 80) return { color: 'bg-green-500', text: 'Excelente', shadow: 'shadow-green-200' };
    if (score >= 50) return { color: 'bg-yellow-500', text: 'Estable', shadow: 'shadow-yellow-200' };
    return { color: 'bg-red-500', text: 'Riesgo Crítico', shadow: 'shadow-red-200' };
  };

  const status = getStatus();

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl border shadow-sm">
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Health Score</h3>
      <div className={`mt-4 relative flex items-center justify-center w-32 h-32 rounded-full border-8 ${status.color} bg-white ${status.shadow} transition-all duration-500`}>
        <span className="text-4xl font-bold text-slate-800">{score}</span>
      </div>
      <p className={`mt-4 font-semibold ${status.color.replace('bg-', 'text-')}`}>
        Estado: {status.text}
      </p>
    </div>
  );
};