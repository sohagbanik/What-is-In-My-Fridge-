import { PantryItem } from '../types';

export function mapDetectedToPantryItem(item: any, index: number): PantryItem {
  const freshnessMap: Record<string, { daysLeft: number; freshnessPercent: number; status: PantryItem['status'] }> = {
    'fresh':         { daysLeft: 7,  freshnessPercent: 85, status: 'fresh' },
    'okay':          { daysLeft: 4,  freshnessPercent: 55, status: 'fresh' },
    'expiring soon': { daysLeft: 2,  freshnessPercent: 20, status: 'warning' },
    'expired':       { daysLeft: 0,  freshnessPercent: 5,  status: 'critical' },
  };

  const freshness = freshnessMap[(item.freshness || 'okay').toLowerCase()] || freshnessMap['okay'];

  const categoryMap: Record<string, PantryItem['category']> = {
    'produce': 'Produce',
    'dairy': 'Dairy',
    'protein': 'Protein',
    'pantry': 'Pantry',
    'beverage': 'Other',
    'condiment': 'Pantry',
  };

  const category = categoryMap[(item.category || 'other').toLowerCase()] || 'Other';

  const confidenceMap: Record<string, number> = { 'high': 95, 'medium': 80, 'low': 60 };
  const confidence = confidenceMap[(item.confidence || 'medium').toLowerCase()] || 80;

  const expiryText = freshness.daysLeft === 0
    ? 'Expired'
    : freshness.daysLeft <= 2
      ? `Use within ${freshness.daysLeft} day${freshness.daysLeft > 1 ? 's' : ''}`
      : `Fresh (${freshness.daysLeft}+ days)`;

  return {
    id: `scan-${Date.now()}-${index}`,
    name: item.name || 'Unknown Item',
    category,
    quantity: parseInt(item.quantity) || 1,
    unit: item.quantity?.replace(/[0-9]/g, '').trim() || undefined,
    location: 'Scanned',
    daysLeft: freshness.daysLeft,
    expiryText,
    freshnessPercent: freshness.freshnessPercent,
    status: freshness.status,
    confidence,
    isScanned: true,
  };
}
