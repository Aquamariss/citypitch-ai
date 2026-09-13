<script setup lang="ts">
/**
 * Декоративный силуэт города из фирменного стиля.
 * Рисуется текущим цветом текста, поэтому подходит для обеих тем.
 */
withDefaults(defineProps<{ height?: number }>(), { height: 48 });
</script>

<template>
    <svg
        class="city-silhouette"
        :style="{ height: `${height}px` }"
        viewBox="0 0 320 64"
        preserveAspectRatio="none"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
    >
        <path
            d="M0 64V44h10V32h8v-6h6v6h8v12h9V26h14v-8h6v8h13v18h8V22h7v-9h5v9h7v22h10V34h16v-9h5v9h13v19h9V28h12v-7h5v7h11v25h10V38h14v-8h6v8h12v15h9V24h11v-8h5v8h12v28h9V40h13v-7h5v7h11v11h10V30h12v-6h5v6h9v22h8V44h10v20z"
            opacity="0.5"
        />
        <rect x="26" y="34" width="2" height="3" opacity="0.9" />
        <rect x="32" y="34" width="2" height="3" opacity="0.9" />
        <rect x="60" y="24" width="2" height="3" opacity="0.9" />
        <rect x="66" y="24" width="2" height="3" opacity="0.9" />
        <rect x="112" y="30" width="2" height="3" opacity="0.9" />
        <rect x="150" y="26" width="2" height="3" opacity="0.9" />
        <rect x="196" y="34" width="2" height="3" opacity="0.9" />
        <rect x="240" y="20" width="2" height="3" opacity="0.9" />
        <rect x="286" y="28" width="2" height="3" opacity="0.9" />
    </svg>
</template>

<style scoped>
.city-silhouette {
    display: block;
    width: 100%;
}
</style>
