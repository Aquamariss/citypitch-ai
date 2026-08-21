<script setup lang="ts">
import { computed, ref } from 'vue';
import { Head } from '@inertiajs/vue3';
import { ChevronRight, PanelRightClose } from 'lucide-vue-next';
import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout.vue';
import ErrorBanner from '@/Components/PitchRecorder/ErrorBanner.vue';
import PitchDraftPanel from '@/Components/PitchDraftPanel.vue';
import ChatComposer from '@/Components/PitchWriter/ChatComposer.vue';
import ChatEmptyState from '@/Components/PitchWriter/ChatEmptyState.vue';
import ChatTranscript from '@/Components/PitchWriter/ChatTranscript.vue';
import { usePitchDraft } from '@/composables/usePitchDraft';
import { usePitchWriterChat } from '@/composables/usePitchWriterChat';
import { useResizableSidePanel } from '@/composables/useResizableSidePanel';
import { getCsrfToken } from '@/lib/sse';

const props = withDefaults(defineProps<{
    session?: any;
    messages?: any[];
    limits?: any;
}>(), {
    session: null,
    messages: () => [],
    limits: null,
});

const writerLayoutRef = ref<HTMLElement | null>(null);
const limits = ref(props.limits ?? null);

const draftPanel = useResizableSidePanel({
    widthKey: 'pitch-ai-draft-width',
    visibleKey: 'pitch-ai-draft-visible',
    defaultWidth: 420,
    minWidth: 280,
    maxRatio: 0.4,
    containerRef: writerLayoutRef,
    defaultVisible: typeof window === 'undefined' || !window.matchMedia('(max-width: 767px)').matches,
});

const pitchDraft = usePitchDraft({
    initialSession: props.session,
    enableLocalImport: true,
});

const chat = usePitchWriterChat({
    initialMessages: props.messages,
    onDraftUpdated: (data) => pitchDraft.handleAgentDraftUpdate(data),
    onLimitsUpdated: (nextLimits) => {
        limits.value = nextLimits;
    },
});

const resetChat = async () => {
    if (!window.confirm('Начать новый чат? История сообщений будет очищена.')) {
        return;
    }

    const response = await fetch(route('pitch-writer.session.reset'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-XSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ clear_draft: false }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        return;
    }

    chat.replaceMessages(payload.messages ?? []);

    if (payload.session) {
        pitchDraft.applySession(payload.session, { canUndo: false });
    }

    if (payload.limits) {
        limits.value = payload.limits;
    }
};

const showEmptyState = computed(() => chat.messages.length === 0 && !chat.isBusy);

const layoutStyle = computed(() =>
    draftPanel.visible ? { '--draft-panel-width': `${draftPanel.width}px` } : undefined,
);
</script>

<template>
    <AppLayout>
        <Head title="Pitch Writer" />

        <div
            ref="writerLayoutRef"
            class="writer-layout"
            :class="{ 'has-draft': draftPanel.visible, 'is-resizing': draftPanel.isResizing }"
            :style="layoutStyle"
        >
            <section class="writer-chat">
                <div class="writer-toolbar">
                    <div>
                        <h1>Питч Райтер</h1>
                        <p v-if="limits" class="writer-limits caps">
                            Осталось {{ limits.messages_remaining }} сообщ.
                        </p>
                    </div>
                    <div class="writer-toolbar-actions">
                        <button
                            v-if="chat.messages.length > 0"
                            type="button"
                            class="btn btn-ghost btn-sm"
                            :disabled="chat.isBusy"
                            @click="resetChat"
                        >
                            Новый чат
                        </button>
                        <button
                            type="button"
                            class="btn btn-secondary btn-sm draft-toggle"
                            :aria-expanded="draftPanel.visible"
                            aria-controls="draft-panel"
                            @click="draftPanel.setVisible(!draftPanel.visible)"
                        >
                            <template v-if="draftPanel.visible">
                                <PanelRightClose :stroke-width="2" aria-hidden="true" />
                                Скрыть
                            </template>
                            <template v-else>
                                <ChevronRight :stroke-width="2" aria-hidden="true" />
                                Черновик
                            </template>
                        </button>
                    </div>
                </div>

                <ErrorBanner :errors="chat.errors" />

                <div v-if="showEmptyState" class="chat-list">
                    <ChatEmptyState :on-select-prompt="chat.sendMessage" :disabled="chat.isBusy" />
                </div>
                <ChatTranscript
                    v-else
                    :messages="chat.displayMessages"
                    :show-typing-indicator="chat.showTypingIndicator"
                />

                <ChatComposer :is-busy="chat.isBusy" :on-send="chat.sendMessage" :on-stop="chat.stopGeneration" />
            </section>

            <PitchDraftPanel
                :draft="pitchDraft.draft"
                :on-change="pitchDraft.updateDraftLocally"
                :on-clear="pitchDraft.clearDraft"
                :on-undo="pitchDraft.undoDraft"
                :can-undo="pitchDraft.canUndo"
                :highlighted-blocks="pitchDraft.highlightedBlocks"
                :status-message="pitchDraft.statusMessage"
                :visible="draftPanel.visible"
                :width="draftPanel.width"
                :min-width="draftPanel.minWidth"
                :max-width="draftPanel.maxWidth"
                :on-hide="() => draftPanel.setVisible(false)"
                :on-resize-start="draftPanel.beginResize"
                context="writer"
            />
        </div>
    </AppLayout>
</template>
