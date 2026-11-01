// Helpers para máscaras de dinheiro e formatação numérica brasileira

export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '';
  const num = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function parseCurrencyInput(text) {
  if (!text) return 0;
  const cleanDigits = String(text).replace(/\D/g, '');
  if (!cleanDigits) return 0;
  return Number(cleanDigits) / 100;
}

export function maskCurrency(rawValue) {
  if (!rawValue && rawValue !== 0) return '';
  const digits = String(rawValue).replace(/\D/g, '');
  if (!digits) return '';
  const val = Number(digits) / 100;
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Categorias padrão de supermercado com paleta limpa
export const CATEGORIES = {
  hortifruti: { id: 'hortifruti', label: 'Hortifrúti', icon: '🍎', color: '#2563eb' },
  acougue: { id: 'acougue', label: 'Açougue & Frios', icon: '🥩', color: '#ef4444' },
  laticinios: { id: 'laticinios', label: 'Laticínios & Ovos', icon: '🧀', color: '#f59e0b' },
  padaria: { id: 'padaria', label: 'Padaria & Matinais', icon: '🍞', color: '#d97706' },
  mercearia: { id: 'mercearia', label: 'Mercearia & Grãos', icon: '🌾', color: '#64748b' },
  bebidas: { id: 'bebidas', label: 'Bebidas', icon: '🧃', color: '#0284c7' },
  limpeza: { id: 'limpeza', label: 'Limpeza & Higiene', icon: '🧼', color: '#0d9488' },
  outros: { id: 'outros', label: 'Outros', icon: '📦', color: '#475569' }
};

export const DEFAULT_CATEGORY_ORDER = [
  'hortifruti',
  'padaria',
  'laticinios',
  'acougue',
  'mercearia',
  'bebidas',
  'limpeza',
  'outros'
];

const KEYWORD_MAP = {
  hortifruti: ['maca', 'maçã', 'banana', 'tomate', 'cebola', 'batata', 'cenoura', 'alface', 'laranja', 'limao', 'limão', 'alho', 'abacaxi', 'manga', 'uva', 'morango', 'melancia', 'maracuja', 'maracujá', 'abacate', 'mamao', 'mamão', 'couve', 'brocolis', 'brócolis'],
  acougue: ['carne', 'frango', 'peixe', 'bife', 'alcatra', 'picanha', 'patinho', 'moida', 'moída', 'coxa', 'sobrecoxa', 'linguica', 'linguiça', 'salame', 'presunto', 'bacon', 'salsicha', 'file', 'filé'],
  laticinios: ['leite', 'queijo', 'manteiga', 'iogurte', 'requeijao', 'requeijão', 'creme de leite', 'leite condensado', 'ovo', 'ovos', 'mussarela', 'prato', 'ricota', 'parmesao', 'parmesão'],
  padaria: ['pao', 'pão', 'torrada', 'bolo', 'croissant', 'biscoito', 'bolacha', 'aveia', 'granola', 'cereal', 'cafe', 'café'],
  mercearia: ['arroz', 'feijao', 'feijão', 'oleo', 'óleo', 'azeite', 'macarrao', 'macarrão', 'molho', 'farinha', 'acucar', 'açúcar', 'sal', 'milho', 'ervilha', 'atum', 'sardinha', 'maionese', 'ketchup'],
  bebidas: ['suco', 'refrigerante', 'coca', 'agua', 'água', 'cerveja', 'vinho', 'cha', 'chá', 'energetico', 'energético', 'vodka', 'gin'],
  limpeza: ['sabao', 'sabão', 'detergente', 'amaciante', 'desinfetante', 'papel higienico', 'papel higiênico', 'pasta de dente', 'escova', 'shampoo', 'condicionador', 'sabonete', 'esponja', 'agua sanitaria', 'água sanitária', 'desodorante', 'lixo']
};

export function detectCategory(name) {
  if (!name) return 'outros';
  const clean = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [cat, words] of Object.entries(KEYWORD_MAP)) {
    if (words.some((w) => clean.includes(w.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
      return cat;
    }
  }
  return 'outros';
}

export function triggerHaptic() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(35);
    } catch {
      // Ignora se não houver suporte
    }
  }
}
