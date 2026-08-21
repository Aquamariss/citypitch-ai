<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { X } from 'lucide-vue-next';

const RULES = [
    'Оптимальная длина — 60–90 секунд.',
    'Держите структуру: проблема → решение → рынок → модель → команда → CTA.',
    'Называйте конкретные цифры, не общие формулировки.',
    'Завершите явным призывом к действию.',
    'После записи можно переснять или отправить на AI-разбор.',
];

const props = defineProps<{ open: boolean; onClose: () => void }>();

const closeRef = ref<HTMLButtonElement | null>(null);

watchEffect((onCleanup) => {
    if (!props.open) {
        return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            props.onClose();
        }
    };

    document.addEventListener('keydown', handleKeyDown);
    closeRef.value?.focus();
    onCleanup(() => document.removeEventListener('keydown', handleKeyDown));
}, { flush: 'post' });
</script>

<template>
    <div :class="['rules-drawer', { 'is-open': open }]" :aria-hidden="open ? 'false' : 'true'">
        <div class="rules-backdrop" @click="onClose" />
        <div class="rules-sheet" id="rules-sheet" role="dialog" aria-modal="true" aria-labelledby="rules-title">
            <div class="rules-sheet-header">
                <h3 id="rules-title">Правила записи</h3>
                <button
                    ref="closeRef"
                    type="button"
                    class="btn-icon"
                    @click="onClose"
                    aria-label="Закрыть"
                >
                    <X :stroke-width="1.5" aria-hidden="true" />
                </button>
            </div>
            <ul>
                <li v-for="rule in RULES" :key="rule">{{ rule }}</li>
            </ul>
            <button type="button" class="btn btn-secondary" @click="onClose" style="margin-top: 20px; width: 100%">
                Понятно
            </button>
        </div>
    </div>
</template>
