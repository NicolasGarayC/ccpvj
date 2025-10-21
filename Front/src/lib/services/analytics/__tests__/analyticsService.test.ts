import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyticsService } from '../analyticsService';
import type { AnalyticsSummary, VisitorsChart, TopResources } from '../analyticsService';

describe('AnalyticsService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getSummary', () => {
		it('should fetch analytics summary successfully', async () => {
			const mockSummary: AnalyticsSummary = {
				totalVisitors: 150,
				totalDownloads: 75,
				totalResources: 200
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockSummary
			});

			const result = await analyticsService.getSummary();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/analytics/summary'),
				expect.any(Object)
			);
			expect(result).toEqual(mockSummary);
		});

		it('should handle empty summary', async () => {
			const emptySummary: AnalyticsSummary = {
				totalVisitors: 0,
				totalDownloads: 0,
				totalResources: 0
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => emptySummary
			});

			const result = await analyticsService.getSummary();

			expect(result).toEqual(emptySummary);
			expect(result.totalVisitors).toBe(0);
			expect(result.totalDownloads).toBe(0);
			expect(result.totalResources).toBe(0);
		});

		it('should throw error when fetch fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				statusText: 'Internal Server Error'
			});

			await expect(analyticsService.getSummary()).rejects.toThrow();
		});
	});

	describe('getVisitorsChart', () => {
		it('should fetch visitors chart with default 30 days', async () => {
			const mockChart: VisitorsChart = {
				data: [
					{ date: '2024-01-01', visitors: 10 },
					{ date: '2024-01-02', visitors: 15 },
					{ date: '2024-01-03', visitors: 20 }
				]
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockChart
			});

			const result = await analyticsService.getVisitorsChart();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/analytics/visitors?days=30'),
				expect.any(Object)
			);
			expect(result).toEqual(mockChart);
			expect(result.data).toHaveLength(3);
		});

		it('should fetch visitors chart with custom days', async () => {
			const mockChart: VisitorsChart = {
				data: [
					{ date: '2024-01-01', visitors: 10 },
					{ date: '2024-01-02', visitors: 15 }
				]
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockChart
			});

			const result = await analyticsService.getVisitorsChart(7);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/analytics/visitors?days=7'),
				expect.any(Object)
			);
			expect(result).toEqual(mockChart);
		});

		it('should handle empty chart data', async () => {
			const emptyChart: VisitorsChart = {
				data: []
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => emptyChart
			});

			const result = await analyticsService.getVisitorsChart(30);

			expect(result.data).toEqual([]);
			expect(result.data).toHaveLength(0);
		});

		it('should fetch chart for large number of days', async () => {
			const mockChart: VisitorsChart = {
				data: Array.from({ length: 90 }, (_, i) => ({
					date: `2024-01-${i + 1}`,
					visitors: Math.floor(Math.random() * 100)
				}))
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockChart
			});

			const result = await analyticsService.getVisitorsChart(90);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/analytics/visitors?days=90'),
				expect.any(Object)
			);
			expect(result.data).toHaveLength(90);
		});

		it('should throw error when fetch fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				statusText: 'Bad Request'
			});

			await expect(analyticsService.getVisitorsChart(30)).rejects.toThrow();
		});
	});

	describe('getTopDownloads', () => {
		it('should fetch top downloads with default limit 5', async () => {
			const mockTopResources: TopResources = {
				resources: [
					{ name: 'Resource 1', downloads: 100, type: 'PDF' },
					{ name: 'Resource 2', downloads: 85, type: 'Video' },
					{ name: 'Resource 3', downloads: 70, type: 'Audio' },
					{ name: 'Resource 4', downloads: 55, type: 'Image' },
					{ name: 'Resource 5', downloads: 40, type: 'Document' }
				]
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockTopResources
			});

			const result = await analyticsService.getTopDownloads();

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/analytics/top-downloads?limit=5'),
				expect.any(Object)
			);
			expect(result).toEqual(mockTopResources);
			expect(result.resources).toHaveLength(5);
		});

		it('should fetch top downloads with custom limit', async () => {
			const mockTopResources: TopResources = {
				resources: [
					{ name: 'Resource 1', downloads: 100, type: 'PDF' },
					{ name: 'Resource 2', downloads: 85, type: 'Video' },
					{ name: 'Resource 3', downloads: 70, type: 'Audio' }
				]
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockTopResources
			});

			const result = await analyticsService.getTopDownloads(3);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/analytics/top-downloads?limit=3'),
				expect.any(Object)
			);
			expect(result.resources).toHaveLength(3);
		});

		it('should handle empty top downloads', async () => {
			const emptyResources: TopResources = {
				resources: []
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => emptyResources
			});

			const result = await analyticsService.getTopDownloads(10);

			expect(result.resources).toEqual([]);
			expect(result.resources).toHaveLength(0);
		});

		it('should fetch top downloads with large limit', async () => {
			const mockResources = Array.from({ length: 50 }, (_, i) => ({
				name: `Resource ${i + 1}`,
				downloads: 100 - i,
				type: 'PDF'
			}));

			const mockTopResources: TopResources = {
				resources: mockResources
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockTopResources
			});

			const result = await analyticsService.getTopDownloads(50);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/analytics/top-downloads?limit=50'),
				expect.any(Object)
			);
			expect(result.resources).toHaveLength(50);
		});

		it('should throw error when fetch fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				statusText: 'Not Found'
			});

			await expect(analyticsService.getTopDownloads(5)).rejects.toThrow();
		});
	});

	describe('trackVisitor', () => {
		it('should track visitor successfully', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await analyticsService.trackVisitor('/biblioteca');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/analytics/track-visitor'),
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ pageVisited: '/biblioteca' })
				})
			);
		});

		it('should track different page visits', async () => {
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({})
			});

			await analyticsService.trackVisitor('/blog');
			await analyticsService.trackVisitor('/calendario');
			await analyticsService.trackVisitor('/material-apoyo');

			expect(global.fetch).toHaveBeenCalledTimes(3);
		});

		it('should track visitor with query parameters', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await analyticsService.trackVisitor('/blog?id=123&tag=music');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: JSON.stringify({ pageVisited: '/blog?id=123&tag=music' })
				})
			);
		});

		it('should track visitor with special characters in path', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await analyticsService.trackVisitor('/blog/título-con-acentos');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: JSON.stringify({ pageVisited: '/blog/título-con-acentos' })
				})
			);
		});

		it('should throw error when tracking fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				statusText: 'Bad Request'
			});

			await expect(analyticsService.trackVisitor('/test')).rejects.toThrow();
		});

		it('should send correct headers for visitor tracking', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await analyticsService.trackVisitor('/home');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			);
		});
	});

	describe('trackDownload', () => {
		it('should track download with all parameters', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await analyticsService.trackDownload(
				'resource-123',
				'PDF',
				'document.pdf',
				'/media/documents/document.pdf',
				1024000
			);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/analytics/track-download'),
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({
						resourceId: 'resource-123',
						resourceType: 'PDF',
						fileName: 'document.pdf',
						filePath: '/media/documents/document.pdf',
						fileSize: 1024000
					})
				})
			);
		});

		it('should track download without optional parameters', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await analyticsService.trackDownload('resource-456', 'Video', 'video.mp4');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: JSON.stringify({
						resourceId: 'resource-456',
						resourceType: 'Video',
						fileName: 'video.mp4',
						filePath: undefined,
						fileSize: undefined
					})
				})
			);
		});

		it('should track downloads of different resource types', async () => {
			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => ({})
			});

			await analyticsService.trackDownload('res-1', 'PDF', 'doc.pdf');
			await analyticsService.trackDownload('res-2', 'Video', 'video.mp4');
			await analyticsService.trackDownload('res-3', 'Audio', 'audio.mp3');
			await analyticsService.trackDownload('res-4', 'Image', 'image.jpg');

			expect(global.fetch).toHaveBeenCalledTimes(4);
		});

		it('should track download with large file size', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			const largeFileSize = 1024 * 1024 * 1024 * 2; // 2GB

			await analyticsService.trackDownload(
				'resource-789',
				'Video',
				'large-video.mp4',
				'/media/videos/large-video.mp4',
				largeFileSize
			);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: expect.stringContaining(`"fileSize":${largeFileSize}`)
				})
			);
		});

		it('should track download with special characters in filename', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await analyticsService.trackDownload(
				'res-special',
				'Document',
				'archivo-con-ñ-y-acentos.docx',
				'/media/docs/archivo-con-ñ-y-acentos.docx',
				50000
			);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: expect.stringContaining('archivo-con-ñ-y-acentos.docx')
				})
			);
		});

		it('should throw error when tracking fails', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				statusText: 'Internal Server Error'
			});

			await expect(
				analyticsService.trackDownload('res-error', 'PDF', 'error.pdf')
			).rejects.toThrow();
		});

		it('should send correct headers for download tracking', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({})
			});

			await analyticsService.trackDownload('res-123', 'PDF', 'test.pdf');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						'Content-Type': 'application/json'
					})
				})
			);
		});
	});

	describe('Edge Cases', () => {
		it('should handle network errors gracefully', async () => {
			(global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

			await expect(analyticsService.getSummary()).rejects.toThrow('Network error');
		});

		it('should handle malformed JSON responses', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => {
					throw new Error('Invalid JSON');
				}
			});

			await expect(analyticsService.getSummary()).rejects.toThrow();
		});

		it('should handle 500 server errors', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error'
			});

			await expect(analyticsService.getVisitorsChart()).rejects.toThrow();
		});

		it('should handle 404 not found errors', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: 'Not Found'
			});

			await expect(analyticsService.getTopDownloads()).rejects.toThrow();
		});
	});
});
