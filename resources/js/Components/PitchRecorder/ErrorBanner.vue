<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next';

withDefaults(defineProps<{ errors?: string[]; variant?: 'card' | 'video' }>(), {
    errors: () => [],
    variant: 'card',
});
</script>

<template>
    <Transition name="banner">
        <div
            v-if="errors.length"
            class="p-3 rounded-xl text-sm flex items-start gap-2"
            :class="variant === 'video'
                ? 'absolute top-20 left-1/2 -translate-x-1/2 w-auto max-w-sm z-30 shadow-lg'
                : 'm-4'"
            :style="variant === 'video'
                ? { backgroundColor: 'rgba(239,68,68,0.9)', backdropFilter: 'blur(8px)', color: 'white' }
                : { backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }"
        >
            <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" :stroke-width="1.5" />
            <div>
                <p v-for="(error, index) in errors" :key="index">{{ error }}</p>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.banner-enter-active,
.banner-leave-active {
    transition: opacity 0.25s ease, transform 0.25s ease;
}

.banner-enter-from,
.banner-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>
