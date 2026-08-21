<script setup lang="ts">
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const props = withDefaults(defineProps<{
    message: { role: string; content: string };
    isStreaming?: boolean;
}>(), { isStreaming: false });

// GFM-compatible rendering; sanitized before v-html (user + AI content untrusted).
const md = new MarkdownIt({ html: false, linkify: true, breaks: true }).enable(['table', 'strikethrough']);

const isUser = computed(() => props.message.role === 'user');

const rendered = computed(() => DOMPurify.sanitize(md.render(props.message.content || '')));
</script>

<template>
    <div :class="['chat-msg', isUser ? 'chat-msg--user' : 'chat-msg--ai']">
        <div v-if="!isUser" class="chat-avatar" aria-hidden="true">AI</div>

        <div class="flex flex-col gap-2 min-w-0">
            <div class="chat-bubble">
                <p v-if="isUser" class="whitespace-pre-wrap">{{ message.content }}</p>
                <div
                    v-else
                    class="markdown-body prose prose-sm max-w-none"
                    :class="{ 'streaming-cursor': isStreaming }"
                    v-html="rendered"
                />
            </div>
        </div>
    </div>
</template>
