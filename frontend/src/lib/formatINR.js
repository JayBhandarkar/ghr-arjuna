/**
 * formatINR(amount, options)
 * Formats a number as Indian Rupees using the Indian numbering system.
 *
 * Examples:
 *   formatINR(150000)          → "₹1,50,000"
 *   formatINR(1250.50)         → "₹1,250.50"
 *   formatINR(72000, {k:true}) → "₹72K"
 *
 * Indian system: 1,00,000 = 1 Lakh | 1,00,00,000 = 1 Crore
 */
export function formatINR(amount = 0, { decimals = 0, compact = false } = {}) {
    const n = Math.abs(Number(amount) || 0);

    if (compact) {
        if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
        if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
        if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
    }

    const formatted = n.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    return `₹${formatted}`;
}

/**
 * formatINRChart(value)
 * Short label for chart Y-axis ticks (e.g. ₹1.5L, ₹50K)
 */
export function formatINRChart(value) {
    const n = Math.abs(Number(value) || 0);
    if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`;
    if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
    if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
    return `₹${n}`;
}
