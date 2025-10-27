<script lang="ts">
  import DigitalLibraryCard from '../DigitalLibraryCard.svelte';
  import type { LibraryItemDto } from '$lib/application/services/library/DigitalLibraryService';

  export let item: LibraryItemDto;
  export let viewMode: 'grid' | 'list' = 'grid';
  export let canManage = false;
  export let onView: (event: CustomEvent<void>) => void = () => {};
  export let onDownload: (event: CustomEvent<void>) => void = () => {};
  export let onEdit: (event: CustomEvent<void>) => void = () => {};
  export let onDelete: (event: CustomEvent<void>) => void = () => {};

  const handleView = (event: CustomEvent<void>) => {
    onView(event);
  };

  const handleDownload = (event: CustomEvent<void>) => {
    onDownload(event);
  };

  const handleEdit = (event: CustomEvent<void>) => {
    onEdit(event);
  };

  const handleDelete = (event: CustomEvent<void>) => {
    onDelete(event);
  };
</script>

<DigitalLibraryCard
  {item}
  {viewMode}
  {canManage}
  on:view={handleView}
  on:download={handleDownload}
  on:edit={handleEdit}
  on:delete={handleDelete}
/>
