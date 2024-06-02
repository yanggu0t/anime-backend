import {
  MoeAnilistCombinedResult,
  ConfigType,
  AnimeMediaDetails,
  MoeAnilistCombinedApiResponse,
  MoeApiResponse,
  AnimeApiResponseData,
  AcceptTitle,
} from "types/api";
import { GraphQLClient } from "graphql-request";

const moeBaseUrl = "https://api.trace.moe";
const anilistBaseUrl = "https://trace.moe/anilist";
const anilistDefaultQuery = `
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
        source
        coverImage {
          large
          medium
        }
        bannerImage
        genres
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

const graphqlClient = new GraphQLClient(anilistBaseUrl);

export async function searchByUrl(
  text: string
): Promise<MoeAnilistCombinedApiResponse> {
  const url = `${moeBaseUrl}/search?cutBorders&url=${encodeURIComponent(text)}`;

  const moeRes: MoeApiResponse = await request(url, { method: "GET" });

  return processMoeResponse(moeRes);
}

export function formatApiData(
  data1: MoeApiResponse,
  data2: AnimeMediaDetails<AcceptTitle>[]
): MoeAnilistCombinedApiResponse {
  const newData = data1.result
    .map((item) => {
      const matchItem = data2.find((v) => v.id === parseInt(item.anilist));
      return matchItem
        ? {
            anime: {
              id: matchItem.id,
              title: {
                jp: matchItem.title.native,
                eng: matchItem.title.english,
                zh: matchItem.title.chinese,
                romaji: matchItem.title.romaji,
              },
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
    .filter((result) => result !== null) as MoeAnilistCombinedResult[];

  return { error: data1.error, result: newData };
}

export async function request(url: string, options: RequestInit): Promise<any> {
  const headers = new Headers(options.headers);

  // Only set the API key if it's not already provided
  if (!headers.has("x-trace-key")) {
    headers.set("x-trace-key", Bun.env.MOE_API_TOKEN!);
  }

  const updatedOptions = { ...options, headers };

  try {
    const response = await fetch(url, updatedOptions);
    if (!response.ok) {
      console.error(response.status, response.statusText);
      return {
        status: response.status,
        message: response.statusText,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      return {
        status: 400,
        message: error.message,
      };
    }
  }
}

export async function checkStatus(): Promise<boolean> {
  const res: ConfigType = await request(`${moeBaseUrl}/me`, { method: "GET" });

  return res && res.quota - res.quotaUsed > 0;
}

export async function searchByUpload(file: File): Promise<any> {
  const url = `${moeBaseUrl}/search`;
  const formData = new FormData();
  formData.append("file", file);

  const moeRes: MoeApiResponse = await request(url, {
    method: "POST",
    body: formData,
  });

  return processMoeResponse(moeRes);
}

export async function processMoeResponse(
  moeRes: MoeApiResponse
): Promise<MoeAnilistCombinedApiResponse> {
  const exists = new Set<number>();
  const ids: string[] = [];
  moeRes.result.forEach((item) => {
    if (!exists.has(parseInt(item.anilist))) {
      exists.add(parseInt(item.anilist));
      ids.push(item.anilist);
    }
  });

  if (ids.length === 0) {
    return { status: 400, error: "No valid Anilist IDs found.", result: [] };
  }

  const variables = { ids };
  let aniRes: AnimeApiResponseData;
  try {
    aniRes = await graphqlClient.request(anilistDefaultQuery, variables);
  } catch (error) {
    console.error("Error fetching data from Anilist:", error);
    return {
      status: 400,
      error: "Failed to fetch data from Anilist.",
      result: [],
    };
  }

  if (!aniRes || !aniRes.Page) {
    return { status: 400, error: "Invalid response from Anilist.", result: [] };
  }

  return formatApiData(moeRes, aniRes.Page.media);
}

export const MoeService = {
  searchByUrl,
  formatApiData,
  request,
  checkStatus,
  searchByUpload,
  processMoeResponse,
};
