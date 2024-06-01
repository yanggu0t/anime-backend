export type MoeApiResponse = {
  frameCount?: number;
  status?: boolean;
  error: string;
  result: MoeResult[];
};

// 定义 Moe result 搜索结果类型
export type MoeResult = {
  anilist: string;
  filename: string;
  episode: number;
  from: number;
  to: number;
  similarity: number;
  video: string;
  image: string;
};

// 定义合并结果类型
export type CombinedResultType = {
  anime: AnimeMediaType;
  filename: string;
  episode: number;
  from: number;
  to: number;
  similarity: number;
  video: string;
  image: string;
};

export type CombinedApiResponse = {
  frameCount?: number;
  status?: number;
  error: string;
  result: CombinedResultType[];
};

export type ConfigType = {
  id: string;
  priority: number;
  concurrency: number;
  quota: number;
  quotaUsed: number;
};

// 定义标题类型
type Title = {
  native: string;
  romaji: string;
  english: string;
  chinese?: string;
};

// 定义图片类型
type Image = {
  large: string;
  medium: string;
};

// 定义评分分布类型
type ScoreDistribution = {
  score: number;
  amount: number;
};

// 定义统计类型
type Stats = {
  scoreDistribution: ScoreDistribution[];
};

// 定义外部链接类型
type ExternalLink = {
  id: number;
  url: string;
  site: string;
};

// 定义媒体类型
export type AnimeMediaType = {
  id: number;
  title: Title;
  type: string;
  format: string;
  status: string;
  startDate: DateType;
  endDate: DateType;
  season: string;
  episodes: number;
  duration: number;
  source: string;
  coverImage: Image;
  bannerImage: string;
  genres: string[];
  popularity: number;
  averageScore: number;
  stats: Stats;
  isAdult: boolean;
  externalLinks: ExternalLink[];
  siteUrl: string;
};

// 定义日期类型
type DateType = {
  year: number;
  month: number;
  day: number;
};

// 定义页面类型
type Page = {
  media: AnimeMediaType[];
};

// 定义响应数据类型
export type ResponseData = {
  Page: Page;
};

// 定义API响应类型
export type AnimeApiResponse = {
  data: ResponseData;
};
