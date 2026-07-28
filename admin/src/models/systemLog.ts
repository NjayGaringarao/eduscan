export type SystemLog = {
  id: number;
  timestamp: Date;
  type: string;
  title: string;
  description: string;
  reference_id: number | null;
};
