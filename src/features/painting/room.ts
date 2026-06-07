import { newId } from '../../lib/ids';
import type { PrepLevel, Room } from '../../lib/types';

export const PREP_LEVELS: { value: PrepLevel; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'standard', label: 'Standard' },
  { value: 'heavy', label: 'Heavy' },
];

export function makeNewRoom(label = 'Room'): Room {
  return {
    id: newId(),
    label,
    length: 12,
    width: 12,
    height: 9,
    walls: true,
    ceiling: true,
    trim: false,
    doors: 0,
    windows: 0,
    coats: 2,
    prepLevel: 'standard',
  };
}
