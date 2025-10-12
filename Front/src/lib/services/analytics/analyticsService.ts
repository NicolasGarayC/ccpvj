import { BaseHttpService } from '../base/baseHttpService.js';

export interface AnalyticsSummary {
  totalVisitors: number;
  totalDownloads: number;
  totalResources: number;
}

export interface VisitorsChart {
  data: {
    date: string;
    visitors: number;
  }[];
}

export interface TopResource {
  name: string;
  downloads: number;
  type: string;
}

export interface TopResources {
  resources: TopResource[];
}

export interface TrackVisitorRequest {
  pageVisited: string;
}

export interface TrackDownloadRequest {
  resourceId: string;
  resourceType: string;
  filePath?: string;
  fileName: string;
  fileSize?: number;
}

class AnalyticsService extends BaseHttpService {
  private readonly basePath = '/analytics';

  // Override base get method to use correct path
  async getSummary(): Promise<AnalyticsSummary> {
    return await this.get<AnalyticsSummary>(`${this.basePath}/summary`);
  }

  async getVisitorsChart(days: number = 30): Promise<VisitorsChart> {
    return await this.get<VisitorsChart>(`${this.basePath}/visitors?days=${days}`);
  }

  async getTopDownloads(limit: number = 5): Promise<TopResources> {
    return await this.get<TopResources>(`${this.basePath}/top-downloads?limit=${limit}`);
  }

  async trackVisitor(pageVisited: string): Promise<void> {
    const request: TrackVisitorRequest = { pageVisited };
    await this.post<void>(`${this.basePath}/track-visitor`, request);
  }

  async trackDownload(
    resourceId: string,
    resourceType: string,
    fileName: string,
    filePath?: string,
    fileSize?: number
  ): Promise<void> {
    const request: TrackDownloadRequest = {
      resourceId,
      resourceType,
      fileName,
      filePath,
      fileSize
    };
    await this.post<void>(`${this.basePath}/track-download`, request);
  }
}

export const analyticsService = new AnalyticsService();