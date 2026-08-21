<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { Head, Link, router } from '@inertiajs/vue3';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout.vue';

const PROC_STEPS = [
    { id: 'upload', label: 'Загрузка записи', match: ['загрузка', 'upload', 'обработка', 'обработ'] },
    { id: 'transcribe', label: 'Транскрипция речи', match: ['распознав', 'transcrib', 'реч'] },
    { id: 'analyze', label: 'Оценка по критериям', match: ['анализ', 'analyz', 'критер'] },
    { id: 'verdict', label: 'Сборка вердикта', match: ['готов', 'completed', 'вердикт', 'отчёт', 'отчет'] },
];

const resolveStepIndex = (step: string | null, status: string): number => {
    if (status === 'completed') {
        return PROC_STEPS.length;
    }

    const raw = String(step ?? '').toLowerCase();

    for (let i = PROC_STEPS.length - 1; i >= 0; i -= 1) {
        if (PROC_STEPS[i].match.some((token) => raw.includes(token))) {
            return i;
        }
    }

    return 0;
};

const props = defineProps<{ pitchId: string | number; initialStatus: any }>();

const status = ref<any>(props.initialStatus);

const isError = computed(() => status.value.status === 'error');
const stepIndex = computed(() => resolveStepIndex(status.value.step, status.value.status));
const progress = computed(() => Math.min(100, Math.max(8, Math.round((stepIndex.value / PROC_STEPS.length) * 100))));

watchEffect((onCleanup) => {
    if (status.value.status === 'completed' || status.value.status === 'error') {
        return;
    }

    const interval = setInterval(async () => {
        try {
            const response = await fetch(route('pitch.status', { pitch: props.pitchId }), {
                headers: { Accept: 'application/json' },
            });

            if (response.redirected) {
                router.visit(response.url);

                return;
            }

            if (response.ok) {
                const data = await response.json();
                status.value = data;

                if (data.status === 'completed') {
                    router.visit(route('pitch.result', { pitch: props.pitchId }));
                }
            } else {
                status.value = {
                    status: 'error',
                    step: 'ошибка сети',
                    message: 'Сервер вернул ошибку. Попробуйте обновить страницу.',
                };
            }
        } catch {
            status.value = {
                status: 'error',
                step: 'ошибка сети',
                message: 'Проблемы с соединением. Пожалуйста, проверьте интернет.',
            };
        }
    }, 3000);

    onCleanup(() => clearInterval(interval));
});
</script>

<template>
    <AppLayout>
        <Head title="Обработка питча — Pitch AI" />

        <div class="page">
            <div class="card proc-card" :class="{ 'is-error': isError }" data-processing :aria-busy="isError ? 'false' : 'true'">
                <div v-if="!isError" class="spin" aria-hidden="true" />

                <h1>{{ isError ? 'Не удалось разобрать питч' : 'Анализируем питч' }}</h1>
                <p>
                    {{ isError
                        ? 'К сожалению, мы не смогли обработать вашу запись. Попробуйте записать питч ещё раз.'
                        : 'Транскрибируем речь и оцениваем по критериям инвестора. Обычно 1–2 минуты.' }}
                </p>

                <div v-if="isError" class="error-banner" role="alert">
                    Ошибка анализа. Можно повторить запись.
                </div>

                <template v-else>
                    <div
                        class="proc-track"
                        role="progressbar"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        :aria-valuenow="progress"
                    >
                        <div class="proc-fill" :style="{ width: `${progress}%` }" />
                    </div>

                    <div class="proc-steps">
                        <div
                            v-for="(step, index) in PROC_STEPS"
                            :key="step.id"
                            class="proc-step"
                            :class="{ done: index < stepIndex, active: index === stepIndex && status.status !== 'completed' }"
                        >
                            <span class="dot" aria-hidden="true" />
                            {{ step.label }}
                        </div>
                    </div>
                </template>

                <div v-if="isError" class="proc-actions">
                    <Link :href="route('pitch.index')" class="btn btn-primary">
                        Новая запись
                    </Link>
                    <Link :href="`${route('pitch.index')}?tab=history`" class="btn btn-secondary">
                        К истории
                    </Link>
                </div>
            </div>
        </div>
    </AppLayout>
</template>
