<script setup lang="ts">
withDefaults(defineProps<{ className?: string; size?: number }>(), {
    className: '',
    size: 28,
});
</script>

<template>
    <span
        class="logo-mark"
        :class="className"
        aria-hidden="true"
        :style="{ width: `${size}px`, height: `${size}px` }"
    >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3v18M5 10l7-7 7 7" />
        </svg>
    </span>
</template>
