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
  constructor() {
    super('/api/analytics');
  }

  /**
   * Get analytics summary (visitors, downloads, resources count)
   */
  async getSummary(): Promise<AnalyticsSummary> {
    return this.get<AnalyticsSummary>('/summary');
  }

  /**
   * Get visitors chart data for specified number of days
   * @param days Number of days to retrieve (default: 30)
   */
  async getVisitorsChart(days: number = 30): Promise<VisitorsChart> {
    return this.get<VisitorsChart>(`/visitors?days=${days}`);
  }

  /**
   * Get top downloaded resources
   * @param limit Number of top resources to retrieve (default: 5)
   */
  async getTopDownloads(limit: number = 5): Promise<TopResources> {
    return this.get<TopResources>(`/top-downloads?limit=${limit}`);
  }

  /**
   * Track a visitor page visit
   * @param pageVisited The page that was visited
   */
  async trackVisitor(pageVisited: string): Promise<void> {
    const request: TrackVisitorRequest = { pageVisited };
    await this.post<void>('/track-visitor', request);
  }

  /**
   * Track a file download
   * @param resourceId ID of the resource being downloaded
   * @param resourceType Type of resource (library_item, blog_media, course_media)
   * @param fileName Name of the file being downloaded
   * @param filePath Optional path to the file
   * @param fileSize Optional size of the file in bytes
   */
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
    await this.post<void>('/track-download', request);
  }
}

export const analyticsService = new AnalyticsService();