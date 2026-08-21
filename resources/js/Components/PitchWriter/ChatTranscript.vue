<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import ChatMessage from './ChatMessage.vue';
import TypingIndicator from './TypingIndicator.vue';

const props = withDefaults(defineProps<{
    messages?: Array<{ id: string; role: string; content: string; streaming?: boolean }>;
    showTypingIndicator?: boolean;
}>(), {
    messages: () => [],
    showTypingIndicator: false,
});

const scrollRef = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
    nextTick(() => {
        const el = scrollRef.value;

        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    });
};

watch(
    () => [props.messages, props.showTypingIndicator],
    () => scrollToBottom(),
    { immediate: true, deep: true },
);
</script>

<template>
    <div ref="scrollRef" class="chat-list">
        <ChatMessage
            v-for="message in messages"
            :key="message.id"
            :message="message"
            :is-streaming="Boolean(message.streaming)"
        />

        <TypingIndicator v-if="showTypingIndicator" />
    </div>
</template>
