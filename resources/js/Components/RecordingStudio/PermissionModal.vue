<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { ShieldAlert, X } from 'lucide-vue-next';

const props = defineProps<{
    open: boolean;
    error: string | null;
    isVideo: boolean;
    onClose: () => void;
}>();

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
    <div class="perm-modal" :class="{ 'is-open': open }" :inert="!open">
        <div class="perm-backdrop" @click="onClose" />
        <div class="perm-card" role="dialog" aria-modal="true" aria-labelledby="perm-title">
            <button ref="closeRef" type="button" class="perm-close" @click="onClose" aria-label="Закрыть">
                <X :stroke-width="1.5" aria-hidden="true" />
            </button>
            <div class="perm-icon" aria-hidden="true">
                <ShieldAlert :stroke-width="1.5" />
            </div>
            <h3 id="perm-title">{{ isVideo ? 'Включить видео не удалось' : 'Включить звук не удалось' }}</h3>
            <p class="perm-copy">Разрешите доступ к {{ isVideo ? 'камере' : 'микрофону' }} в настройках сайта.</p>
            <p v-if="error" class="perm-error">{{ error }}</p>
            <p class="perm-hint">
                Нажмите на иконку замка слева в адресной строке и разрешите доступ.
            </p>
        </div>
    </div>
</template>

<style scoped>
.perm-modal {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    pointer-events: none;
}

.perm-modal.is-open { pointer-events: auto; }

.perm-backdrop {
    position: absolute;
    inset: 0;
    background: color-mix(in oklch, var(--bg) 55%, transparent);
    backdrop-filter: blur(4px);
    opacity: 0;
    transition: opacity 0.2s;
}

.perm-modal.is-open .perm-backdrop { opacity: 1; }

.perm-card {
    position: relative;
    width: min(400px, 100%);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px 24px 20px;
    text-align: center;
    opacity: 0;
    transform: translateY(12px) scale(0.98);
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.perm-modal.is-open .perm-card { opacity: 1; transform: none; }

.perm-close {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    color: var(--muted);
    background: transparent;
    border: none;
    cursor: pointer;
}

.perm-close:hover { color: var(--fg); background: var(--border); }

.perm-close svg { width: 16px; height: 16px; }

.perm-icon {
    width: 52px;
    height: 52px;
    margin: 0 auto 14px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-subtle);
    color: var(--accent-primary);
}

.perm-icon svg { width: 26px; height: 26px; }

.perm-card h3 {
    font-size: 17px;
    margin: 0 0 8px;
}

.perm-copy {
    font-size: 14px;
    color: var(--muted);
    line-height: 1.5;
    margin: 0;
}

.perm-error {
    font-size: 13px;
    color: var(--muted);
    line-height: 1.5;
    margin: 8px 0 0;
    opacity: 0.8;
}

.perm-hint {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.4;
    margin: 14px 0 0;
}
</style>
