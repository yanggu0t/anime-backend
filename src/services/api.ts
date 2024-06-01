import {
  AnimeApiResponse,
  CombinedResultType,
  ConfigType,
  AnimeMediaType,
  CombinedApiResponse,
  MoeApiResponse,
} from "types/api";

export class Moe {
  private moeBaseUrl: string;
  private anilistBaseUrl: string;
  private anilistDefaultQuery: string;

  constructor() {
    this.moeBaseUrl = "https://api.trace.moe/";
    this.anilistBaseUrl = "https://graphql.anilist.co";
    this.anilistDefaultQuery =
      "query ($ids: [Int]) { Page(page: 1, perPage: 50) { media(id_in: $ids, type: ANIME) { id title { native romaji english } type format status startDate { year month day } endDate { year month day } season episodes duration source coverImage { large medium } bannerImage genres popularity averageScore stats { scoreDistribution { score amount } } isAdult externalLinks { id url site } siteUrl } } }";
  }

  async searchByUrl(text: string): Promise<CombinedApiResponse> {
    const status = await this.checkStatus();
    if (!status)
      return {
        status: status,
        error: "",
        result: [],
      };

    const url = `${this.moeBaseUrl}search?cutBorders&url=${encodeURIComponent(text)}`;

    const moeRes: MoeApiResponse = await this.request(url, {
      method: "GET",
    });

    const exists = new Set<number>();
    const ids: string[] = [];
    moeRes.result.forEach((item) => {
      if (!exists.has(parseInt(item.anilist))) {
        exists.add(+item.anilist);
        ids.push(item.anilist);
      }
    });

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query:
          "query ($ids: [Int]) { Page(page: 1, perPage: 50) { media(id_in: $ids, type: ANIME) { id title { native romaji english } type format status startDate { year month day } endDate { year month day } season episodes duration source coverImage { large medium } bannerImage genres popularity averageScore stats { scoreDistribution { score amount } } isAdult externalLinks { id url site } siteUrl } } }",
        variables: {
          ids: ids,
        },
      }),
    };

    const aniRes: AnimeApiResponse = await this.request(
      this.anilistBaseUrl,
      options
    );

    const newData = this.formatApiData(moeRes, aniRes.data.Page.media);
    return newData; // 合并两个响应并返回
  }

  formatApiData(
    data1: MoeApiResponse,
    data2: AnimeMediaType[]
  ): CombinedApiResponse {
    const newData = data1.result
      .map((item) => {
        const matchItem = data2.find((v) => v.id === parseInt(item.anilist));
        return matchItem
          ? {
              anime: {
                id: matchItem.id,
                title: matchItem.title,
                type: matchItem.type,
                format: matchItem.format,
                status: matchItem.status,
                startDate: matchItem.startDate,
                endDate: matchItem.endDate,
                season: matchItem.season,
                episodes: matchItem.episodes,
                source: matchItem.source,
                coverImage: matchItem.coverImage,
                bannerImage: matchItem.bannerImage,
                genres: matchItem.genres,
                popularity: matchItem.popularity,
                averageScore: matchItem.averageScore,
                stats: matchItem.stats,
                isAdult: matchItem.isAdult,
                externalLinks: matchItem.externalLinks,
                siteUrl: matchItem.siteUrl,
              },
              filename: item.filename,
              episode: item.episode,
              from: item.from,
              to: item.to,
              similarity: item.similarity,
              video: item.video,
              image: item.image,
            }
          : null;
      })
      .filter((result) => result !== null) as CombinedResultType[]; // Ensure the result type is correct

    const animeObj = {
      frameCount: data1.frameCount,
      status: data1.status,
      error: data1.error,
      result: newData,
    };

    return animeObj;
  }

  async request(url: string, options: RequestInit): Promise<any> {
    try {
      const response = await fetch(url, options);
      if (!response.ok)
        return console.error(response.status, response.statusText);

      // 直接返回 JSON 数据
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error in request:", error);
      throw error;
    }
  }

  async checkStatus() {
    const basic: ConfigType = await this.request(`${this.moeBaseUrl}me`, {
      method: "GET",
    });

    return basic.quota - basic.quotaUsed > 0 ? true : false;
  }
}
