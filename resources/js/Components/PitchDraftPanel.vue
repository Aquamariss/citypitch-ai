<script setup lang="ts">
import { computed } from 'vue';
import { Link } from '@inertiajs/vue3';
import { PanelRightClose } from 'lucide-vue-next';
import { route } from 'ziggy-js';
import { blocksToDraft, draftBlocks, type BlockKey, type PitchDraft } from '@/lib/pitchDraft';
import { estimateSpeakingSeconds, formatClock, useMethodology } from '@/lib/pitchMethodology';

const props = withDefaults(defineProps<{
    draft: PitchDraft;
    onChange?: (draft: PitchDraft) => void;
    onClear?: () => void;
    onUndo?: () => void;
    canUndo?: boolean;
    highlightedBlocks?: string[];
    statusMessage?: string | null;
    visible?: boolean;
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    onHide?: () => void;
    onResizeStart?: (event: PointerEvent) => void;
    context?: 'writer' | 'studio';
    hideNavigation?: boolean;
}>(), {
    hideNavigation: false,
    canUndo: false,
    highlightedBlocks: () => [],
    statusMessage: null,
    visible: true,
    minWidth: 280,
    maxWidth: 720,
    context: 'writer',
});

const methodology = useMethodology();

const blocks = computed(() =>
    draftBlocks().map((block) => {
        const content = props.draft.blocks?.[block.key] ?? '';
        const estimate = estimateSpeakingSeconds(content, methodology.value.speech_rate_words_per_minute);

        return {
            key: block.key,
            title: block.title,
            hint: block.hint,
            limit: block.limit,
            content,
            estimate,
            isOverLimit: estimate > block.limit,
        };
    }),
);

// Ориентир по времени звучания черновика целиком.
const totalEstimate = computed(() => blocks.value.reduce((sum, block) => sum + block.estimate, 0));

const updateBlock = (key: BlockKey, value: string) => {
    const nextBlocks = {
        ...props.draft.blocks,
        [key]: value,
    };

    props.onChange?.(blocksToDraft(nextBlocks, props.draft.updatedAt));
};
</script>

<template>
    <aside
        v-if="visible"
        class="pitch-draft-panel"
        id="draft-panel"
        :style="width ? { width: `${width}px` } : undefined"
        aria-label="Черновик питча"
    >
        <div
            v-if="onResizeStart"
            class="pitch-draft-resize"
            role="separator"
            aria-orientation="vertical"
            aria-label="Изменить ширину черновика"
            :aria-valuemin="minWidth"
            :aria-valuemax="maxWidth"
            :aria-valuenow="width"
            @pointerdown="onResizeStart"
        />

        <div class="pitch-draft-head">
            <div class="pitch-draft-title">Черновик питча</div>
            <div class="pitch-draft-actions">
                <button
                    v-if="canUndo && onUndo"
                    type="button"
                    class="btn btn-ghost btn-sm"
                    @click="onUndo"
                    aria-label="Отменить изменение черновика"
                >
                    Отменить
                </button>
                <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    @click="onClear"
                    aria-label="Очистить черновик"
                >
                    Очистить
                </button>

                <template v-if="!hideNavigation">
                    <Link
                        v-if="context === 'studio'"
                        :href="route('pitch-writer.index')"
                        class="btn btn-primary btn-sm"
                    >
                        К райтеру
                    </Link>
                    <Link v-else :href="route('pitch.index')" class="btn btn-primary btn-sm">
                        К записи
                    </Link>
                </template>

                <button
                    v-if="onHide"
                    type="button"
                    class="pitch-draft-hide"
                    @click="onHide"
                    aria-label="Скрыть черновик"
                    title="Скрыть черновик"
                >
                    <PanelRightClose :stroke-width="2" />
                </button>
            </div>
        </div>

        <div v-if="statusMessage" class="pitch-draft-status" role="status">
            {{ statusMessage }}
        </div>

        <div v-if="totalEstimate > 0" class="pitch-draft-total">
            Черновик звучит примерно {{ formatClock(totalEstimate) }} из {{ formatClock(methodology.recommended_seconds) }}
        </div>

        <div class="pitch-draft-list">
            <section
                v-for="block in blocks"
                :key="block.key"
                class="pitch-draft-block"
                :class="{ 'is-highlighted': highlightedBlocks.includes(block.key) }"
            >
                <div class="pitch-draft-block-head">
                    <h3 class="pitch-draft-block-title">{{ block.title }}</h3>
                    <span
                        v-if="block.content.trim()"
                        class="pitch-draft-estimate"
                        :class="{ 'is-over': block.isOverLimit }"
                        :title="block.isOverLimit ? 'Дольше ориентира — это допустимо, но слушателю может быть тяжело' : 'Примерное время звучания'"
                    >
                        ≈ {{ formatClock(block.estimate) }} / {{ formatClock(block.limit) }}
                    </span>
                    <span v-else class="pitch-draft-estimate">до {{ formatClock(block.limit) }}</span>
                </div>
                <textarea
                    class="pitch-draft-input"
                    :value="block.content"
                    @input="updateBlock(block.key, ($event.target as HTMLTextAreaElement).value)"
                    :placeholder="block.hint"
                    :aria-label="block.title"
                    rows="4"
                />
            </section>
        </div>
    </aside>
</template>

<style scoped>
.pitch-draft-block-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    justify-content: space-between;
}

.pitch-draft-estimate {
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: var(--text-muted);
    white-space: nowrap;
}

.pitch-draft-estimate.is-over {
    color: var(--warning, #f59e0b);
}

.pitch-draft-total {
    padding: 8px 16px;
    font-size: 12px;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border-subtle);
}
</style>
