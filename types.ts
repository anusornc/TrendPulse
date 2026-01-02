
export enum SourceType {
  X = 'X',
  YOUTUBE = 'YouTube',
  NEWS = 'News',
  ALL = 'All'
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  type: SourceType;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface NewsState {
  topic: string;
  items: NewsItem[];
  brief: string;
  groundingSources: GroundingSource[];
  loading: boolean;
  error: string | null;
}
