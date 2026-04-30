// Signal tier badge: Strong Buy / Buy / Hold / Reduce / Caution

const TIER_STYLES = {
  'strong-buy': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'buy':        'bg-green-500/20  text-green-300  border-green-500/40',
  'hold':       'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  'reduce':     'bg-orange-500/20 text-orange-300 border-orange-500/40',
  'caution':    'bg-red-500/20    text-red-300    border-red-500/40',
  'unknown':    'bg-gray-500/20   text-gray-400   border-gray-500/40',
};

export default function SignalBadge({ tier, label }) {
  const style = TIER_STYLES[tier] ?? TIER_STYLES.unknown;
  return (
    <span className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold tracking-wide ${style}`}>
      {label}
    </span>
  );
}
