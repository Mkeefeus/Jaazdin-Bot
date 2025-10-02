import { Timer } from '~/db/models/Timer';

export enum TimerType {
  building = 'building',
  plant = 'plant',
  item = 'item',
  other = 'other',
  complete = 'complete',
}

export type TimerUserMap = {
  [userId: string]: Timer['dataValues'][];
};

export type SortedTimers = {
  [key in TimerType]: TimerUserMap;
};

export const typeIcons: { [key in TimerType]: string } = {
  plant: '🌱',
  building: '🏗️',
  item: '📦',
  other: '🔧',
  complete: '✅',
};

export const typeColors: { [key in TimerType]: number } = {
  plant: 0x4caf50, // Green
  building: 0x795548, // Brown
  item: 0x2196f3, // Blue
  other: 0x9e9e9e, // Gray
  complete: 0x00ff00,
};
