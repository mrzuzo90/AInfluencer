/**
 * Topic rotation per CLAUDE.md:
 * Lunes: 🔬 Tecnología/IA
 * Martes: 💼 Negocios/Startups
 * Miércoles: 💰 Economía/Finanzas
 * Jueves: 🌍 Actualidad General
 * Viernes: 📈 Tendencias/Análisis
 */

export type Topic = 'technology' | 'business' | 'finance' | 'general' | 'analysis';

export function getTodaysTopic(): Topic {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  const topicByDay: Record<number, Topic> = {
    1: 'technology', // Monday
    2: 'business', // Tuesday
    3: 'finance', // Wednesday
    4: 'general', // Thursday
    5: 'analysis', // Friday
    0: 'technology', // Sunday -> Tech
    6: 'technology', // Saturday -> Tech
  };

  return topicByDay[dayOfWeek];
}

export function getTopicEmoji(topic: Topic): string {
  const emojis: Record<Topic, string> = {
    technology: '🔬',
    business: '💼',
    finance: '💰',
    general: '🌍',
    analysis: '📈',
  };
  return emojis[topic];
}
