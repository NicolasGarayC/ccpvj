# Lista de archivos a arreglar
$files = @(
    "Front\src\routes\library\+page.svelte",
    "Front\src\routes\i18n-final\+page.svelte",
    "Front\src\routes\dashboard\+page.svelte",
    "Front\src\routes\calendar\+page.svelte",
    "Front\src\routes\blog\[slug]\+page.svelte",
    "Front\src\routes\blog\+page.svelte",
    "Front\src\routes\+layout.svelte",
    "Front\src\lib\components\library\DigitalLibraryFilters.svelte",
    "Front\src\lib\components\common\ConfirmationModal.svelte",
    "Front\src\lib\components\calendar\UpcomingEventsWidget.svelte",
    "Front\src\lib\components\blog\BlogPostCard.svelte"
)

$fixedCount = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Arreglando: $file"
        $content = Get-Content $file -Raw -Encoding UTF8
        $originalContent = $content
        $content = $content.Replace('$t$(', '$t(')

        if ($content -ne $originalContent) {
            $content | Set-Content $file -NoNewline -Encoding UTF8
            $fixedCount++
            Write-Host "  Arreglado OK"
        }
    }
}

Write-Host "Total archivos arreglados: $fixedCount"
