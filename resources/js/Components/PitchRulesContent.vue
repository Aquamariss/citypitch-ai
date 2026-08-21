<script setup lang="ts">
import { reactive } from 'vue';
import { ChevronDown, Lightbulb } from 'lucide-vue-next';
import { pitchTips } from '@/lib/pitchTips';

withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false });

const openTips = reactive<Record<string, boolean>>({});

const toggle = (title: string) => {
    openTips[title] = !openTips[title];
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
            <Lightbulb class="w-4 h-4 text-amber-400" :stroke-width="1.5" />
            <h3 class="text-sm font-semibold text-zinc-200">Памятка питчинга</h3>
            <span class="ml-auto text-xs text-zinc-600">6 шагов</span>
        </div>

        <div class="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
            <div v-for="tip in pitchTips" :key="tip.title">
                <button type="button" class="w-full text-left" @click="toggle(tip.title)">
                    <div
                        class="tip-row flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                        :class="{ 'is-open': openTips[tip.title] }"
                        :style="{
                            backgroundColor: openTips[tip.title] ? tip.colorSubtle : 'transparent',
                            border: `1px solid ${openTips[tip.title] ? tip.color + '30' : 'var(--border-subtle)'}`,
                        }"
                    >
                        <div
                            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-mono"
                            :style="{ backgroundColor: tip.colorSubtle, color: tip.color }"
                        >
                            <component :is="tip.icon" class="w-4 h-4" :stroke-width="1.5" />
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1.5">
                                <span class="text-sm font-semibold text-zinc-200">{{ tip.title }}</span>
                                <span class="text-xs text-zinc-600 hidden sm:inline">· {{ tip.subtitle }}</span>
                            </div>
                        </div>
                        <ChevronDown
                            class="w-3.5 h-3.5 text-zinc-600 shrink-0 transition-transform duration-200"
                            :style="{ transform: openTips[tip.title] ? 'rotate(180deg)' : 'rotate(0deg)' }"
                        />
                    </div>
                </button>

                <Transition name="tip-fade">
                    <p
                        v-if="openTips[tip.title]"
                        class="text-xs leading-relaxed px-3 pt-2 pb-3"
                        :style="{ color: 'var(--text-secondary)' }"
                    >
                        {{ tip.text }}
                    </p>
                </Transition>
            </div>
        </div>

        <div class="px-4 py-3 border-t shrink-0" :style="{ borderColor: 'var(--border-subtle)' }">
            <p class="text-xs text-zinc-600 text-center">
                Нажмите на шаг, чтобы раскрыть советы
            </p>
        </div>
    </div>
</template>

<style scoped>
.tip-row:not(.is-open):hover {
    background-color: rgba(255, 255, 255, 0.03);
    border-color: var(--border-default);
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
