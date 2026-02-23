import { motion } from "framer-motion";

/* Mini CSS-based illustrations that represent each feature visually */

export const MapIllustration = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 rounded-xl overflow-hidden p-4">
    {/* Grid lines */}
    <div className="absolute inset-0 opacity-20">
      {[...Array(6)].map((_, i) => (
        <div key={`h${i}`} className="absolute left-0 right-0 border-t border-blue-300 dark:border-blue-700" style={{ top: `${(i + 1) * 16}%` }} />
      ))}
      {[...Array(6)].map((_, i) => (
        <div key={`v${i}`} className="absolute top-0 bottom-0 border-l border-blue-300 dark:border-blue-700" style={{ left: `${(i + 1) * 16}%` }} />
      ))}
    </div>
    {/* Map pins */}
    {[
      { x: "20%", y: "30%", color: "bg-emerald-500", size: "w-3 h-3" },
      { x: "45%", y: "25%", color: "bg-primary", size: "w-4 h-4" },
      { x: "65%", y: "45%", color: "bg-amber-500", size: "w-3 h-3" },
      { x: "35%", y: "60%", color: "bg-primary", size: "w-3.5 h-3.5" },
      { x: "75%", y: "65%", color: "bg-emerald-500", size: "w-3 h-3" },
      { x: "55%", y: "75%", color: "bg-rose-500", size: "w-2.5 h-2.5" },
    ].map((pin, i) => (
      <motion.div
        key={i}
        className={`absolute ${pin.size} ${pin.color} rounded-full shadow-lg`}
        style={{ left: pin.x, top: pin.y }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
      />
    ))}
    {/* Heat zone */}
    <div className="absolute w-20 h-20 rounded-full bg-primary/15 blur-xl" style={{ left: "35%", top: "20%" }} />
    <div className="absolute w-16 h-16 rounded-full bg-emerald-500/15 blur-xl" style={{ left: "60%", top: "55%" }} />
  </div>
);

export const SearchIllustration = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 rounded-xl overflow-hidden p-4">
    {/* Search bar */}
    <div className="bg-white/80 dark:bg-white/10 rounded-lg h-7 mb-3 flex items-center px-3 gap-2">
      <div className="w-3 h-3 rounded-full border-2 border-violet-400" />
      <div className="flex-1 h-2 bg-violet-200/60 dark:bg-violet-500/20 rounded" />
    </div>
    {/* Filter toggles */}
    <div className="flex gap-2 mb-3">
      <div className="h-5 px-2.5 rounded-full bg-primary/20 flex items-center">
        <div className="w-8 h-1.5 bg-primary/60 rounded" />
      </div>
      <div className="h-5 px-2.5 rounded-full bg-violet-200/60 dark:bg-violet-500/20 flex items-center">
        <div className="w-6 h-1.5 bg-violet-300 dark:bg-violet-500/40 rounded" />
      </div>
      <div className="h-5 px-2.5 rounded-full bg-violet-200/60 dark:bg-violet-500/20 flex items-center">
        <div className="w-10 h-1.5 bg-violet-300 dark:bg-violet-500/40 rounded" />
      </div>
    </div>
    {/* Result rows */}
    {[0.8, 0.6, 0.9, 0.5].map((w, i) => (
      <motion.div
        key={i}
        className="flex items-center gap-2 mb-2 bg-white/60 dark:bg-white/5 rounded-lg px-3 py-2"
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 }}
      >
        <div className="w-6 h-6 rounded bg-violet-200/80 dark:bg-violet-500/20 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-1.5 bg-violet-300/50 dark:bg-violet-500/30 rounded mb-1" style={{ width: `${w * 100}%` }} />
          <div className="h-1 bg-violet-200/40 dark:bg-violet-500/15 rounded w-1/2" />
        </div>
        <div className="text-[8px] font-bold text-emerald-500">-12%</div>
      </motion.div>
    ))}
  </div>
);

export const ValuationIllustration = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 rounded-xl overflow-hidden p-4">
    {/* Price comparison bars */}
    <div className="flex items-end gap-3 h-[60%] mb-3 px-2">
      {[
        { h: "65%", color: "bg-emerald-400/70", label: "Pub." },
        { h: "80%", color: "bg-primary", label: "Pot." },
        { h: "55%", color: "bg-emerald-400/70", label: "Pub." },
        { h: "90%", color: "bg-primary", label: "Pot." },
        { h: "70%", color: "bg-emerald-400/70", label: "Pub." },
        { h: "75%", color: "bg-primary", label: "Pot." },
      ].map((bar, i) => (
        <motion.div
          key={i}
          className="flex-1 flex flex-col items-center gap-1"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          style={{ originY: 1 }}
        >
          <div className={`w-full ${bar.color} rounded-t-sm`} style={{ height: bar.h }} />
        </motion.div>
      ))}
    </div>
    {/* Legend */}
    <div className="flex items-center justify-center gap-4 text-[7px]">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-sm bg-emerald-400/70" />
        <span className="text-emerald-700 dark:text-emerald-400">Publicado</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-sm bg-primary" />
        <span className="text-primary">Potencial</span>
      </div>
    </div>
    {/* Arrow indicator */}
    <div className="absolute top-3 right-3 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
      +18% oportunidad
    </div>
  </div>
);

export const PriceIntelIllustration = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 rounded-xl overflow-hidden p-4">
    {/* Trend line chart */}
    <svg viewBox="0 0 200 100" className="w-full h-[65%]" fill="none">
      {/* Grid */}
      {[25, 50, 75].map((y) => (
        <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="currentColor" strokeWidth="0.5" className="text-amber-300/40 dark:text-amber-600/30" />
      ))}
      {/* Area fill */}
      <motion.path
        d="M0,80 C30,75 50,60 80,50 C110,40 130,35 160,25 C175,20 190,22 200,20 L200,100 L0,100 Z"
        className="fill-primary/10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      />
      {/* Main line */}
      <motion.path
        d="M0,80 C30,75 50,60 80,50 C110,40 130,35 160,25 C175,20 190,22 200,20"
        className="stroke-primary"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      {/* Comparison line */}
      <motion.path
        d="M0,70 C30,68 50,65 80,62 C110,59 130,55 160,52 C175,50 190,48 200,47"
        className="stroke-amber-400"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
      />
      {/* Data point */}
      <circle cx="160" cy="25" r="4" className="fill-primary" />
    </svg>
    {/* Labels */}
    <div className="flex items-center justify-between mt-2 text-[7px] text-amber-600/70 dark:text-amber-400/60 px-1">
      <span>Ene</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span>
    </div>
    <div className="absolute top-3 right-3 text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
      USD/m² ↑
    </div>
  </div>
);

export const ProjectsIllustration = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 rounded-xl overflow-hidden p-4">
    {/* Project cards stack */}
    {[
      { y: 0, opacity: 1, tag: "⭐ Favorita", price: "USD 95.000", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
      { y: 0, opacity: 1, tag: "📍 Palermo", price: "USD 120.000", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
      { y: 0, opacity: 1, tag: "🔥 Oportunidad", price: "USD 78.000", badge: "bg-primary/10 text-primary" },
    ].map((card, i) => (
      <motion.div
        key={i}
        className="bg-white/80 dark:bg-white/10 rounded-lg p-2.5 mb-2 flex items-center gap-2 border border-rose-200/40 dark:border-rose-500/10"
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: card.opacity, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.15 }}
      >
        <div className="w-8 h-8 rounded bg-rose-200/60 dark:bg-rose-500/20 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-1.5 bg-rose-300/40 dark:bg-rose-500/20 rounded w-3/4 mb-1" />
          <div className="text-[7px] font-semibold text-foreground/70">{card.price}</div>
        </div>
        <span className={`text-[6px] font-bold px-1.5 py-0.5 rounded-full ${card.badge} whitespace-nowrap`}>{card.tag}</span>
      </motion.div>
    ))}
    {/* Notes indicator */}
    <div className="mt-1 flex items-center gap-1.5 text-[7px] text-rose-400 dark:text-rose-300/60 px-1">
      <div className="w-2 h-2 rounded-full bg-rose-300/60 dark:bg-rose-500/30" />
      3 notas · 2 comparadas
    </div>
  </div>
);

export const AlertsIllustration = () => (
  <div className="relative w-full h-full bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 rounded-xl overflow-hidden p-4">
    {/* Notification items */}
    {[
      { time: "Hace 2m", msg: "Nueva oportunidad en Palermo", dot: "bg-primary" },
      { time: "Hace 15m", msg: "Precio bajó -8% en Belgrano", dot: "bg-amber-500" },
      { time: "Hace 1h", msg: "Match con tu búsqueda guardada", dot: "bg-emerald-500" },
    ].map((notif, i) => (
      <motion.div
        key={i}
        className="flex items-start gap-2 mb-2.5 bg-white/70 dark:bg-white/8 rounded-lg px-3 py-2 border border-teal-200/30 dark:border-teal-500/10"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.15 }}
      >
        <div className={`w-2 h-2 rounded-full ${notif.dot} mt-1 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="text-[8px] font-semibold text-foreground/80 leading-tight">{notif.msg}</div>
          <div className="text-[6px] text-teal-500/60 dark:text-teal-400/40 mt-0.5">{notif.time}</div>
        </div>
      </motion.div>
    ))}
    {/* Active alert count */}
    <div className="absolute top-3 right-3 flex items-center gap-1">
      <motion.div
        className="w-2 h-2 rounded-full bg-primary"
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className="text-[7px] font-bold text-primary">3 activas</span>
    </div>
  </div>
);

const illustrations: Record<string, React.FC> = {
  MapPin: MapIllustration,
  Filter: SearchIllustration,
  DollarSign: ValuationIllustration,
  LineChart: PriceIntelIllustration,
  Bookmark: ProjectsIllustration,
  BellRing: AlertsIllustration,
};

export default illustrations;
