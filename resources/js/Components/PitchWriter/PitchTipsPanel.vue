<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronDown, Lightbulb } from 'lucide-vue-next';
import PitchRulesContent from '@/Components/PitchRulesContent.vue';
import { useMethodology } from '@/lib/pitchMethodology';

withDefaults(defineProps<{ variant?: 'both' | 'mobile' | 'desktop' }>(), { variant: 'both' });

const methodology = useMethodology();
const blockCount = computed(() => methodology.value.blocks.length);

const open = ref(false);

const toggle = () => {
    open.value = !open.value;
};
</script>

<template>
    <template v-if="variant === 'mobile' || variant === 'both'">
        <div class="lg:hidden shrink-0 border-b" :style="{ borderColor: 'var(--border-subtle)' }">
            <button
                type="button"
                class="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium"
                :style="{ color: 'var(--text-primary)' }"
                :aria-expanded="open"
                @click="toggle"
            >
                <Lightbulb class="w-4 h-4 text-amber-400" :stroke-width="1.5" />
                Структура питча
                <span class="ml-auto text-xs" :style="{ color: 'var(--text-muted)' }">{{ blockCount }} блоков</span>
                <ChevronDown
                    class="w-4 h-4 transition-transform duration-200"
                    :style="{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }"
                />
            </button>

            <div
                v-if="open"
                class="max-h-64 overflow-hidden border-t"
                :style="{ borderColor: 'var(--border-subtle)' }"
            >
                <PitchRulesContent embedded />
            </div>
        </div>
    </template>

    <aside
        v-if="variant === 'desktop' || variant === 'both'"
        class="hidden lg:flex w-72 shrink-0 flex-col border-l min-h-0"
        :style="{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-overlay)' }"
    >
        <PitchRulesContent embedded />
    </aside>
</template>
