<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next';
import { useTheme } from '@/composables/useTheme';

withDefaults(defineProps<{ className?: string }>(), { className: '' });

const { toggleTheme, isDark } = useTheme();
</script>

<template>
    <button
        type="button"
        class="theme-toggle"
        :class="className"
        @click="toggleTheme"
        :aria-pressed="isDark ? 'false' : 'true'"
        :aria-label="isDark ? 'Включить светлую тему' : 'Включить тёмную тему'"
        :title="isDark ? 'Включить светлую тему' : 'Включить тёмную тему'"
    >
        <Sun v-if="isDark" :stroke-width="1.5" aria-hidden="true" />
        <Moon v-else :stroke-width="1.5" aria-hidden="true" />
    </button>
</template>
