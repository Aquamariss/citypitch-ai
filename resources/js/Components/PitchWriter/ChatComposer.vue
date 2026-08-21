<script setup lang="ts">
import { ref } from 'vue';

const props = withDefaults(defineProps<{
    isBusy?: boolean;
    onSend?: (content: string) => void;
    onStop?: () => void;
    disabled?: boolean;
}>(), {
    isBusy: false,
    disabled: false,
});

const inputRef = ref<HTMLInputElement | null>(null);

const handleSubmit = (event: Event) => {
    event.preventDefault();

    const content = inputRef.value?.value ?? '';

    if (!content.trim() || props.isBusy || props.disabled) {
        return;
    }

    props.onSend?.(content);

    if (inputRef.value) {
        inputRef.value.value = '';
    }
};
</script>

<template>
    <form class="chat-compose" @submit="handleSubmit">
        <label class="sr-only" for="writer-input">Сообщение AI</label>
        <input
            ref="inputRef"
            class="input"
            id="writer-input"
            type="text"
            placeholder="Ответьте AI или попросите переписать блок…"
            autocomplete="off"
            :disabled="disabled || isBusy"
        />
        <button v-if="isBusy" type="button" class="btn btn-secondary" @click="onStop">
            Стоп
        </button>
        <button v-else type="submit" class="btn btn-primary" :disabled="disabled">
            Отправить
        </button>
    </form>
</template>
