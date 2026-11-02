// ============================================
// Saudação baseada no horário
// ============================================

export function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let greeting: string;

  if (hour >= 5 && hour < 12) {
    greeting = 'Bom dia';
  } else if (hour >= 12 && hour < 18) {
    greeting = 'Boa tarde';
  } else {
    greeting = 'Boa noite';
  }

  return name ? `${greeting}, ${name}!` : `${greeting}!`;
}

export function getGreetingSubtitle(): string {
  return 'Como está sua propriedade hoje?';
}
