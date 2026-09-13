<script setup lang="ts">
import { computed } from 'vue';
import LogoMark from '@/Components/LogoMark.vue';
import { starterPrompts } from '@/lib/pitchWriterPrompts';
import { useMethodology } from '@/lib/pitchMethodology';

defineProps<{ onSelectPrompt?: (text: string) => void; disabled?: boolean }>();

const methodology = useMethodology();
const blockCount = computed(() => methodology.value.blocks.length);
</script>

<template>
    <div class="flex flex-col items-center justify-center gap-5 py-12 px-4 text-center">
        <LogoMark :size="48" />

        <div class="space-y-2 max-w-md">
            <h2 style="font-size: 22px; font-weight: 600">Чем я могу помочь?</h2>
            <p class="text-sm" style="color: var(--muted)">
                Расскажите о городском проекте своими словами — вместе соберём питч по структуре из {{ blockCount }} блоков.
            </p>
        </div>

        <div class="flex flex-wrap justify-center gap-2 max-w-lg">
            <button
                v-for="prompt in starterPrompts"
                :key="prompt.label"
                type="button"
                :disabled="disabled"
                class="btn btn-secondary btn-sm"
                @click="onSelectPrompt?.(prompt.text)"
            >
                {{ prompt.label }}
            </button>
        </div>
    </div>
</template>
