<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    score?: number;
    maxScore?: number;
    size?: number;
    label?: string | null;
}>(), {
    score: 0,
    maxScore: 100,
    size: 48,
    label: null,
});

const pct = computed(() =>
    props.maxScore > 0 ? Math.min(1, Math.max(0, (props.score ?? 0) / props.maxScore)) : 0,
);

const color = computed(() =>
    pct.value >= 0.7 ? 'var(--success)' : pct.value >= 0.4 ? 'var(--warning)' : 'var(--danger)',
);

const strokeWidth = computed(() => (props.size >= 120 ? 8 : 4));
const r = computed(() => (props.size - strokeWidth.value) / 2);
const circ = computed(() => 2 * Math.PI * r.value);
const dashOffset = computed(() => circ.value - circ.value * pct.value);
const displayLabel = computed(() => props.label ?? `${props.score}/${props.maxScore}`);
</script>

<template>
    <div class="score-ring" :style="{ width: `${size}px`, height: `${size}px` }">
        <svg :width="size" :height="size">
            <circle
                :cx="size / 2"
                :cy="size / 2"
                :r="r"
                fill="none"
                stroke="color-mix(in oklch, var(--fg) 8%, transparent)"
                :stroke-width="strokeWidth"
            />
            <circle
                :cx="size / 2"
                :cy="size / 2"
                :r="r"
                fill="none"
                :stroke="color"
                :stroke-width="strokeWidth"
                stroke-linecap="round"
                :stroke-dasharray="circ"
                :stroke-dashoffset="dashOffset"
            />
        </svg>
        <span class="score-ring-value" :style="{ color }">{{ displayLabel }}</span>
    </div>
</template>
