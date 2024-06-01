import {
  AnimeApiResponse,
  CombinedResultType,
  ConfigType,
  AnimeMediaType,
  CombinedApiResponse,
  MoeApiResponse,
  ResponseData,
} from "types/api";
import { GraphQLClient } from "graphql-request";

export class Moe {
  private moeBaseUrl: string;
  private anilistBaseUrl: string;
  private anilistDefaultQuery: string;
  private graphqlClient: GraphQLClient;

  constructor() {
    this.moeBaseUrl = "https://api.trace.moe/";
    this.anilistBaseUrl = "https://trace.moe/anilist/";
    this.anilistDefaultQuery = `
      query ($ids: [Int]) {
        Page(page: 1, perPage: 50) {
          media(id_in: $ids, type: ANIME) {
            id
            title {
              native
              romaji
              english
            }
            type
            format
            status
            startDate {
              year
              month
              day
            }
            endDate {
              year
              month
              day
            }
            season
            episodes
            duration
            source
            coverImage {
              large
              medium
            }
            bannerImage
            genres
            popularity
            averageScore
            synonyms
            stats {
              scoreDistribution {
                score
                amount
              }
            }
            isAdult
            externalLinks {
              id
              url
              site
            }
            siteUrl
          }
        }
      }
    `;
    this.graphqlClient = new GraphQLClient(this.anilistBaseUrl);
  }

  async searchByUrl(text: string): Promise<CombinedApiResponse> {
    const status = await this.checkStatus();
    if (!status)
      return {
        status: status ? 200 : 400,
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

    if (ids.length === 0) {
      return {
        status: 400,
        error: "No valid Anilist IDs found.",
        result: [],
      };
    }

    const variables = { ids };
    let aniRes: ResponseData;
    try {
      aniRes = await this.graphqlClient.request(
        this.anilistDefaultQuery,
        variables
      );
      console.log(JSON.stringify(aniRes, null, 2));
    } catch (error) {
      console.error("Error fetching data from Anilist:", error);
      return {
        status: 400,
        error: "Failed to fetch data from Anilist.",
        result: [],
      };
    }

    if (!aniRes || !aniRes.Page) {
      return {
        status: 400,
        error: "Invalid response from Anilist.",
        result: [],
      };
    }

    const newData = this.formatApiData(moeRes, aniRes.Page.media);
    return newData;
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
      status: 200,
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
