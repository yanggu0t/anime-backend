// 定義 Moe Api 的反饋類型
export type MoeApiResponse = {
  frameCount?: number;
  status: boolean;
  error: string;
  result: MoeSearchResult[];
};

// 定义 Moe result 搜索结果类型
export type MoeSearchResult = {
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
export type MoeAnilistCombinedResult = {
  anime: AnimeMediaDetails<ExportTitle>;
  filename: string;
  episode: number;
  from: number;
  to: number;
  similarity: number;
  video: string;
  image: string;
};

// 整合後的 Moe Api 反饋類型
export type MoeAnilistCombinedApiResponse = {
  frameCount?: number;
  status?: number;
  error: string;
  result: MoeAnilistCombinedResult[];
};

export type ConfigType = {
  id: string;
  priority: number;
  concurrency: number;
  quota: number;
  quotaUsed: number;
};

// 定义接受标题类型
export type AcceptTitle = {
  native: string;
  romaji: string;
  english: string;
  chinese: string;
};

// Title 輸出的類型
export type ExportTitle = {
  jp: string;
  eng: string;
  zh: string;
};

// 定义图片类型
type AnimeImage = {
  large: string;
  medium: string;
};

// 定义评分分布类型
type AnimeScoreDistribution = {
  score: number;
  amount: number;
};

// 定义统计类型
type AnimeStatistics = {
  scoreDistribution: AnimeScoreDistribution[];
};

// 定义外部链接类型
type MediaExternalLink = {
  id: number;
  url: string;
  site: string;
};

// 定义媒体类型
export type AnimeMediaDetails<T extends AcceptTitle | ExportTitle> = {
  id: number;
  title: T;
  type: string;
  format: string;
  status: string;
  startDate: MediaDate;
  endDate: MediaDate;
  season: string;
  episodes: number;
  source: string;
  coverImage: AnimeImage;
  bannerImage: string;
  genres: string[];
  averageScore: number;
  stats: AnimeStatistics;
  isAdult: boolean;
  externalLinks: MediaExternalLink[];
  siteUrl: string;
};

// 定义日期类型
type MediaDate = {
  year: number;
  month: number;
  day: number;
};

// 定义页面类型
type AnimePage = {
  media: AnimeMediaDetails<AcceptTitle>[];
};

// 定义响应数据类型
export type AnimeApiResponseData = {
  Page: AnimePage;
};

// 定义API响应类型
export type AnimeApiResponse = {
  data: AnimeApiResponseData;
};
