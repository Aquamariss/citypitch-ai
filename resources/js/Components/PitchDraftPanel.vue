<script setup lang="ts">
import { computed } from 'vue';
import { Link } from '@inertiajs/vue3';
import { PanelRightClose } from 'lucide-vue-next';
import { route } from 'ziggy-js';
import { PITCH_DRAFT_BLOCKS, blocksToDraft, type BlockKey, type PitchDraft } from '@/lib/pitchDraft';

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
}>(), {
    canUndo: false,
    highlightedBlocks: () => [],
    statusMessage: null,
    visible: true,
    minWidth: 280,
    maxWidth: 720,
    context: 'writer',
});

const blocks = computed(() =>
    PITCH_DRAFT_BLOCKS.map((block) => ({
        key: block.key,
        title: block.title,
        content: props.draft.blocks?.[block.key] ?? '',
    })),
);

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

        <div class="pitch-draft-list">
            <section
                v-for="block in blocks"
                :key="block.key"
                class="pitch-draft-block"
                :class="{ 'is-highlighted': highlightedBlocks.includes(block.key) }"
            >
                <h3 class="pitch-draft-block-title">{{ block.title }}</h3>
                <textarea
                    class="pitch-draft-input"
                    :value="block.content"
                    @input="updateBlock(block.key, ($event.target as HTMLTextAreaElement).value)"
                    placeholder="Скажите своими словами"
                    :aria-label="block.title"
                    rows="4"
                />
            </section>
        </div>
    </aside>
</template>
