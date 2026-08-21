<script setup lang="ts">
defineProps<{ progress?: { percentage?: number } | null }>();
</script>

<template>
    <div class="flex-1 min-h-0 flex items-center justify-center p-6">
        <div class="card proc-card" aria-busy="true">
            <div class="spin" aria-hidden="true" />
            <h1>Загружаем запись</h1>
            <p>Отправляем файл на сервер перед транскрипцией и AI-разбором.</p>
            <div
                class="proc-track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-valuenow="progress?.percentage ?? 8"
            >
                <div class="proc-fill" :style="{ width: `${progress?.percentage ?? 8}%` }" />
            </div>
            <p class="proc-status" aria-live="polite">
                {{ progress ? `Загрузка ${progress.percentage}%` : 'Подготовка…' }}
            </p>
        </div>
    </div>
</template>
