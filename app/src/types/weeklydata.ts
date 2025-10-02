export type WeeklyData = {
  update: () => Promise<void>;
  post: () => Promise<void>;
  order: number;
};
