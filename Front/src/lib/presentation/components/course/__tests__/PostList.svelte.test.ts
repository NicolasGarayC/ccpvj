import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import PostList from '../PostList.svelte';
import type { PostDetail } from '$lib/application/services/material-apoyo/ModulePostService';
import { modulePostService } from '$lib/application/services/material-apoyo/ModulePostService';

if (typeof DataTransfer === 'undefined') {
	class DataTransferMock {
		dropEffect = 'none';
		effectAllowed = 'all';
		files: File[] = [];
		items: unknown[] = [];
		types: string[] = [];
		setData() {}
		getData() {
			return '';
		}
		clearData() {}
	}

	// @ts-expect-error jsdom polyfill
	globalThis.DataTransfer = DataTransferMock;
}

if (typeof DragEvent === 'undefined') {
	class DragEventMock extends Event {
		dataTransfer: DataTransfer;

		constructor(type: string, init?: DragEventInit) {
			super(type, init);
			this.dataTransfer = init?.dataTransfer ?? new DataTransfer();
		}
	}

	// @ts-expect-error jsdom polyfill
	globalThis.DragEvent = DragEventMock;
}

type MockInstance = {
	container: HTMLElement;
	props: Record<string, unknown>;
	$set: (newProps?: Record<string, unknown>) => void;
	$$set: (newProps?: Record<string, unknown>) => void;
	$destroy: () => void;
	$on: (event: string, handler: (event: CustomEvent<any>) => void) => () => void;
	dispatch: (event: string, detail?: unknown) => void;
};

function createComponentMock(
	testId: string,
	updateContent: (container: HTMLElement, props: Record<string, unknown>) => void
) {
	const instances: MockInstance[] = [];

	class ComponentMock implements MockInstance {
		container: HTMLElement;
		props: Record<string, unknown>;
		private target: HTMLElement;
		private detachTarget: boolean;
		handlers = new Map<string, (event: CustomEvent<any>) => void>();

		constructor(options: any = {}) {
			this.detachTarget = !options.target;
			this.target = options.target ?? document.createElement('div');
			if (this.detachTarget) {
				document.body.appendChild(this.target);
			}

			this.container = document.createElement('div');
			this.container.setAttribute('data-testid', testId);
			this.target.appendChild(this.container);

			this.props = { ...(options.props ?? {}) };
			updateContent(this.container, this.props);

			instances.push(this);
		}

		$set(newProps: Record<string, unknown> = {}) {
			Object.assign(this.props, newProps);
			updateContent(this.container, this.props);
		}

		$$set(newProps: Record<string, unknown> = {}) {
			this.$set(newProps);
		}

		$destroy() {
			this.container.remove();
			if (this.detachTarget && this.target.isConnected) {
				this.target.remove();
			}
		}

		$on(event: string, handler: (event: CustomEvent<any>) => void) {
			this.handlers.set(event, handler);
			return () => this.handlers.delete(event);
		}

		dispatch(event: string, detail?: unknown) {
			this.handlers.get(event)?.({ detail } as CustomEvent);
		}
	}

	const factory = vi.fn((options: any = {}) => new ComponentMock(options));

	return {
		factory,
		instances,
		reset() {
			instances.length = 0;
			factory.mockClear();
		}
	};
}

const postCardMock = vi.hoisted(() =>
	createComponentMock('post-card-mock', (container, props) => {
		const title = (props.post as PostDetail | undefined)?.title ?? 'Unknown';
		container.textContent = `Post: ${title}`;
	})
);

const postFormMock = vi.hoisted(() =>
	createComponentMock('post-form-mock', (container, props) => {
		container.textContent = props.visible ? 'PostForm Modal' : '';
	})
);

const spinnerMock = vi.hoisted(() =>
	createComponentMock('spinner-mock', (container) => {
		container.textContent = 'Spinner';
	})
);

vi.mock('$lib/application/services/material-apoyo/ModulePostService', () => ({
	modulePostService: {
		getModulePosts: vi.fn(),
		reorderPost: vi.fn()
	}
}));

vi.mock('../PostCard.svelte', () => ({
	default: postCardMock.factory
}));

vi.mock('../PostForm.svelte', () => ({
	default: postFormMock.factory
}));

vi.mock('../common/LoadingSpinner.svelte', () => ({
	default: spinnerMock.factory
}));

const createPost = (partial: Partial<PostDetail>): PostDetail => ({
	id: 'post-id',
	title: 'Post Title',
	subtitle: null,
	content: null,
	imagePath: null,
	videoPath: null,
	audioPath: null,
	orderNumber: 1,
	moduleId: 'module-1',
	authorId: 'author-1',
	authorName: 'Autor 1',
	createdAt: '2024-01-01T00:00:00Z',
	updatedAt: '2024-01-01T00:00:00Z',
	isActive: true,
	...partial
});

const basePosts: PostDetail[] = [
	createPost({ id: 'post-1', title: 'Post 1', orderNumber: 1 }),
	createPost({ id: 'post-2', title: 'Post 2', orderNumber: 2 }),
	createPost({ id: 'post-3', title: 'Post 3', orderNumber: 3 })
];

type Callbacks = {
	onPostsLoaded: (posts: PostDetail[]) => void;
	onViewPost: (post: PostDetail) => void;
	onEditPost: (post: PostDetail) => void;
	onDeletePost: (postId: string) => void;
	onPostCreated: (detail: unknown) => void;
	onPostUpdated: (detail: unknown) => void;
	onPostsReordered: (detail: unknown) => void;
	onCreatePost: () => void;
	onFormClose: () => void;
};

const setup = (override: Partial<{ showActions: boolean; callbacks: Partial<Callbacks> }> = {}) => {
	const callbacks: Callbacks = {
		onPostsLoaded: vi.fn(),
		onViewPost: vi.fn(),
		onEditPost: vi.fn(),
		onDeletePost: vi.fn(),
		onPostCreated: vi.fn(),
		onPostUpdated: vi.fn(),
		onPostsReordered: vi.fn(),
		onCreatePost: vi.fn(),
		onFormClose: vi.fn(),
		...override.callbacks
	};

	const utils = render(PostList, {
		props: {
			moduleId: 'module-1',
			materialApoyoId: 'material-1',
			showActions: override.showActions ?? true,
			...callbacks
		}
	});

	return { ...utils, callbacks };
};

describe('PostList', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		postCardMock.reset();
		postFormMock.reset();
		spinnerMock.reset();

		vi.mocked(modulePostService.getModulePosts).mockResolvedValue(basePosts);
		vi.mocked(modulePostService.reorderPost).mockResolvedValue(undefined);
	});

	afterEach(() => {
		postCardMock.reset();
		postFormMock.reset();
		spinnerMock.reset();
	});

	it('loads posts on mount and notifies via callback', async () => {
		const { callbacks } = setup();

		await waitFor(() => {
			expect(modulePostService.getModulePosts).toHaveBeenCalledWith('module-1');
			expect(callbacks.onPostsLoaded).toHaveBeenCalledWith(basePosts);
		});
	});

	it('shows empty state when there are no posts', async () => {
		vi.mocked(modulePostService.getModulePosts).mockResolvedValue([]);
		setup();

		expect(await screen.findByText('No hay posts en este módulo')).toBeInTheDocument();
	});

	it('displays error message and allows retry', async () => {
		vi.mocked(modulePostService.getModulePosts)
			.mockRejectedValueOnce(new Error('Fallo'))
			.mockResolvedValueOnce(basePosts);

		setup();

		expect(await screen.findByText('Fallo')).toBeInTheDocument();
		await fireEvent.click(screen.getByText('Reintentar'));

		await waitFor(() => {
			expect(modulePostService.getModulePosts).toHaveBeenCalledTimes(2);
		});
	});

	it('opens form when creating post and triggers callback', async () => {
		const { callbacks } = setup();

		await waitFor(() => callbacks.onPostsLoaded.mock.calls.length === 1);
		await fireEvent.click(screen.getByRole('button', { name: 'Crear Post' }));

		expect(callbacks.onCreatePost).toHaveBeenCalled();
	});

	it('handles created detail from PostForm and updates list', async () => {
		const { callbacks, component } = setup();
		await waitFor(() => callbacks.onPostsLoaded.mock.calls.length === 1);

		const createdDetail = {
			message: 'ok',
			post: createPost({ id: 'post-4', title: 'Post 4', orderNumber: 4 })
		};

		component.__testHandlePostCreated(createdDetail);

		await waitFor(() => {
			expect(callbacks.onPostCreated).toHaveBeenCalledWith(createdDetail);
		});
	});

	it('handles updated detail by reloading posts', async () => {
		const { callbacks, component } = setup();
		await waitFor(() => callbacks.onPostsLoaded.mock.calls.length === 1);

		const updatedDetail = {
			message: 'actualizado',
			postId: 'post-1',
			post: createPost({ id: 'post-1', title: 'Post 1 (nuevo)', orderNumber: 1 })
		};

		component.__testHandlePostUpdated(updatedDetail);

		await waitFor(() => {
			expect(modulePostService.getModulePosts).toHaveBeenCalledTimes(2);
			expect(callbacks.onPostUpdated).toHaveBeenCalledWith(updatedDetail);
		});
	});

	it('closes form and emits onFormClose when PostForm dispatches close', async () => {
		const { callbacks, component } = setup();
		await waitFor(() => callbacks.onPostsLoaded.mock.calls.length === 1);
		await fireEvent.click(screen.getByRole('button', { name: 'Crear Post' }));
		component.__testHandleFormClose();

		expect(callbacks.onFormClose).toHaveBeenCalled();
	});

	it('reorders posts via drag and drop', async () => {
		const { callbacks } = setup();
		await waitFor(() => callbacks.onPostsLoaded.mock.calls.length === 1);

		const listItems = document.querySelectorAll('.post-item');
		const first = listItems[0] as HTMLElement;
		const third = listItems[2] as HTMLElement;

		await fireEvent(
			first,
			new DragEvent('dragstart', { bubbles: true, dataTransfer: new DataTransfer() })
		);
		await fireEvent(
			third,
			new DragEvent('drop', { bubbles: true, dataTransfer: new DataTransfer() })
		);

		await waitFor(() => {
			expect(modulePostService.reorderPost).toHaveBeenCalled();
			expect(callbacks.onPostsReordered).toHaveBeenCalled();
		});
	});
});
