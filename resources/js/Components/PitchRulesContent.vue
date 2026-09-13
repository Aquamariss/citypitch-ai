<script setup lang="ts">
import { computed, reactive } from 'vue';
import { ChevronDown, Lightbulb } from 'lucide-vue-next';
import { blockColorSubtle, blockIcon, formatClock, useMethodology } from '@/lib/pitchMethodology';

withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false });

const methodology = useMethodology();

const blocks = computed(() =>
    methodology.value.blocks.map((block) => ({
        ...block,
        icon: blockIcon(block.icon),
        colorSubtle: blockColorSubtle(block.color),
    })),
);

const openBlocks = reactive<Record<string, boolean>>({});

const toggle = (key: string) => {
    openBlocks[key] = !openBlocks[key];
};
</script>

<template>
    <div
        class="w-full flex flex-col h-full overflow-hidden"
        :class="{ 'rounded-2xl': !embedded }"
        :style="{
            backgroundColor: embedded ? 'transparent' : 'var(--bg-card)',
            border: embedded ? 'none' : '1px solid var(--border-subtle)',
        }"
    >
        <div
            class="flex items-center gap-2 px-4 py-3 border-b shrink-0"
            :style="{ borderColor: 'var(--border-subtle)' }"
        >
            <Lightbulb class="w-4 h-4" :style="{ color: 'var(--accent)' }" :stroke-width="1.5" />
            <h3 class="text-sm font-semibold" :style="{ color: 'var(--text-primary)' }">Структура питча</h3>
            <span class="ml-auto text-xs" :style="{ color: 'var(--text-muted)' }">{{ blocks.length }} блоков · {{ formatClock(methodology.recommended_seconds) }}</span>
        </div>

        <div class="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
            <div v-for="(block, index) in blocks" :key="block.key">
                <button type="button" class="w-full text-left" @click="toggle(block.key)">
                    <div
                        class="tip-row flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                        :class="{ 'is-open': openBlocks[block.key] }"
                        :style="{
                            backgroundColor: openBlocks[block.key] ? block.colorSubtle : 'transparent',
                            border: `1px solid ${openBlocks[block.key] ? block.color + '30' : 'var(--border-subtle)'}`,
                        }"
                    >
                        <div
                            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            :style="{ backgroundColor: block.colorSubtle, color: block.color }"
                        >
                            <component :is="block.icon" class="w-4 h-4" :stroke-width="1.5" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1.5">
                                <span class="text-sm font-semibold" :style="{ color: 'var(--text-primary)' }">{{ index + 1 }}. {{ block.title }}</span>
                            </div>
                        </div>
                        <span class="text-xs mono shrink-0" :style="{ color: 'var(--text-muted)' }">
                            до {{ formatClock(block.limit) }}
                        </span>
                        <ChevronDown
                            class="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
                            :style="{
                                color: 'var(--text-muted)',
                                transform: openBlocks[block.key] ? 'rotate(180deg)' : 'rotate(0deg)',
                            }"
                        />
                    </div>
                </button>

                <Transition name="tip-fade">
                    <div v-if="openBlocks[block.key]" class="px-3 pt-2 pb-3 space-y-2">
                        <p class="text-xs leading-relaxed" :style="{ color: 'var(--text-secondary)' }">
                            {{ block.hint }}
                        </p>
                        <ul v-if="block.checklist.length" class="text-xs leading-relaxed space-y-1 pl-4 list-disc" :style="{ color: 'var(--text-muted)' }">
                            <li v-for="item in block.checklist" :key="item">{{ item }}</li>
                        </ul>
                        <p
                            v-if="block.example"
                            class="text-xs leading-relaxed italic rounded-lg px-3 py-2"
                            :style="{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-elevated)' }"
                        >
                            {{ block.example }}
                        </p>
                    </div>
                </Transition>
            </div>
        </div>

        <div class="px-4 py-3 border-t shrink-0" :style="{ borderColor: 'var(--border-subtle)' }">
            <p class="text-xs text-center" :style="{ color: 'var(--text-muted)' }">
                Время блоков — ориентир для подготовки, на оценку оно не влияет
            </p>
        </div>
    </div>
</template>

<style scoped>
.tip-row:not(.is-open):hover {
    background-color: color-mix(in oklch, var(--fg) 5%, transparent);
    border-color: var(--border);
}

.tip-fade-enter-active,
.tip-fade-leave-active {
    transition: opacity 0.2s ease;
}

.tip-fade-enter-from,
.tip-fade-leave-to {
    opacity: 0;
}
</style>
