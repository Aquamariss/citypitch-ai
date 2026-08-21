<script setup lang="ts">
import LogoMark from '@/Components/LogoMark.vue';
import { starterPrompts } from '@/lib/pitchWriterPrompts';

defineProps<{ onSelectPrompt?: (text: string) => void; disabled?: boolean }>();
</script>

<template>
    <div class="flex flex-col items-center justify-center gap-5 py-12 px-4 text-center">
        <LogoMark :size="48" />

        <div class="space-y-2 max-w-md">
            <h2 style="font-size: 22px; font-weight: 600">Чем я могу помочь?</h2>
            <p class="text-sm" style="color: var(--muted)">
                Расскажите о проекте своими словами — вместе соберём убедительный питч по структуре из 6 блоков.
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
