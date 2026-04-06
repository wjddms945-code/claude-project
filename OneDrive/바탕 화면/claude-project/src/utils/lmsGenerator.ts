import { DailyWorkProject, DailyWorkItem } from '../types';

export function generateLmsText(
  projects: DailyWorkProject[],
  itemsByProject: Record<string, DailyWorkItem[]>
): string {
  const sorted = [...projects].sort((a, b) => a.sortOrder - b.sortOrder);

  const blocks = sorted
    .map((proj) => {
      const items = (itemsByProject[proj.id] ?? []).sort(
        (a, b) => a.sortOrder - b.sortOrder
      );
      if (items.length === 0) return null;

      const itemLines = items
        .map((item) => {
          const hasCategory = item.category && (item.category as string).trim() !== '' && (item.category as string) !== '-';
          const prefix = hasCategory ? `[${item.category}] ` : '';
          return `${prefix}${item.workText} (${item.durationMinutes}분)`;
        })
        .join('\n');

      return `[${proj.projectName}]\n${itemLines}`;
    })
    .filter((block): block is string => block !== null);

  return blocks.join('\n\n');
}
