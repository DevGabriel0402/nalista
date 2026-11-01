import { useCallback, useMemo } from 'react';
import { DEFAULT_CATEGORY_ORDER, detectCategory } from '../utils.js';

export const itemKey = (item) => `${item.name.trim().toLocaleLowerCase()}|${item.unit}`;

export default function useListView(state, { groupByCategory, itemSort, itemSearch, itemFilter, categoryOrder = DEFAULT_CATEGORY_ORDER }) {
  const total = useMemo(
    () => Math.round(state.items.reduce((sum, item) => sum + item.qty * (item.price || 0), 0) * 100) / 100,
    [state.items],
  );
  const pendingPricesCount = useMemo(
    () => state.items.filter((item) => item.pricePending).length,
    [state.items],
  );
  const checkedCount = useMemo(
    () => state.items.filter((item) => item.checked).length,
    [state.items],
  );
  const sortItems = useCallback(
    (items) => [...items].sort((first, second) => {
      if (itemSort === 'price-desc') return second.qty * (second.price || 0) - first.qty * (first.price || 0);
      if (itemSort === 'price-asc') return first.qty * (first.price || 0) - second.qty * (second.price || 0);
      if (itemSort === 'name-asc') return first.name.localeCompare(second.name, 'pt-BR', { sensitivity: 'base' });
      if (itemSort === 'name-desc') return second.name.localeCompare(first.name, 'pt-BR', { sensitivity: 'base' });
      return 0;
    }),
    [itemSort],
  );
  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLocaleLowerCase();
    return state.items.filter((item) => {
      const matchesSearch = !query || item.name.toLocaleLowerCase().includes(query);
      const matchesFilter = itemFilter === 'all'
        || (itemFilter === 'checked' && item.checked)
        || (itemFilter === 'unchecked' && !item.checked)
        || (itemFilter === 'pending-price' && item.pricePending);
      return matchesSearch && matchesFilter;
    });
  }, [itemFilter, itemSearch, state.items]);

  const groupItems = useCallback(
    (items) => {
      const sorted = sortItems(items);
      const groups = sorted.reduce((acc, item) => {
        const category = item.category || detectCategory(item.name);
        acc[category] ??= [];
        acc[category].push(item);
        return acc;
      }, {});

      // Ordenar as chaves de categoria de acordo com categoryOrder (corredor/rota)
      const orderedGroups = {};
      const order = Array.isArray(categoryOrder) && categoryOrder.length > 0 ? categoryOrder : DEFAULT_CATEGORY_ORDER;
      
      order.forEach((catKey) => {
        if (groups[catKey]) {
          orderedGroups[catKey] = groups[catKey];
        }
      });

      // Incluir qualquer outra categoria presente que não esteja no categoryOrder
      Object.keys(groups).forEach((catKey) => {
        if (!orderedGroups[catKey]) {
          orderedGroups[catKey] = groups[catKey];
        }
      });

      return orderedGroups;
    },
    [categoryOrder, sortItems],
  );

  const groupedItems = useMemo(
    () => (groupByCategory ? groupItems(filteredItems) : { all: sortItems(filteredItems) }),
    [filteredItems, groupByCategory, groupItems, sortItems],
  );
  const marketGroupedItems = useMemo(() => groupItems(state.items), [groupItems, state.items]);

  const expiringPantryCount = useMemo(() => {
    const limit = new Date();
    limit.setDate(limit.getDate() + 5);
    return state.pantry.filter((item) => item.expiry && item.expiry <= limit.toLocaleDateString('en-CA')).length;
  }, [state.pantry]);

  const budgetPercent = useMemo(
    () => state.budget > 0 ? Math.min(100, Math.round((total / state.budget) * 100)) : 0,
    [state.budget, total],
  );
  const budgetColor = state.budget > 0 && total > state.budget
    ? '#ef4444'
    : budgetPercent > 80
      ? '#f59e0b'
      : '#2563eb';

  const priceChanges = useMemo(() => {
    const latest = state.history.at(-1);
    const previous = state.history.at(-2);
    if (!latest || !previous) return [];
    const aggregate = (items) => items.reduce((map, item) => {
      const current = map.get(itemKey(item)) || { name: item.name, qty: 0, cost: 0 };
      current.qty += item.qty;
      current.cost += item.qty * item.price;
      map.set(itemKey(item), current);
      return map;
    }, new Map());
    const current = aggregate(latest.items);
    const old = aggregate(previous.items);
    return [...current].flatMap(([key, item]) => {
      const previousItem = old.get(key);
      if (!previousItem || previousItem.cost <= 0) return [];
      const oldPrice = previousItem.cost / previousItem.qty;
      const newPrice = item.cost / item.qty;
      return [{ name: item.name, old: oldPrice, now: newPrice, delta: (newPrice / oldPrice - 1) * 100 }];
    }).sort((a, b) => b.delta - a.delta);
  }, [state.history]);
  const maxDelta = Math.max(1, ...priceChanges.map((change) => Math.abs(change.delta)));

  return { total, pendingPricesCount, checkedCount, groupedItems, marketGroupedItems, expiringPantryCount, budgetPercent, budgetColor, priceChanges, maxDelta };
}
