<script setup lang="ts">
import { computed } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';
import { route } from 'ziggy-js';
import { Bot, Clock, LogOut, Mic } from 'lucide-vue-next';
import ThemeToggle from '@/Components/ThemeToggle.vue';
import LogoMark from '@/Components/LogoMark.vue';

withDefaults(defineProps<{ chrome?: boolean }>(), { chrome: true });

const page = usePage<{
    auth_email: string | null;
    attempts_used: number;
    max_attempts: number;
    status: string | null;
    errors: Record<string, string>;
}>();

const pitchPath = new URL(route('pitch.index')).pathname;
const writerPath = new URL(route('pitch-writer.index')).pathname;

const pathname = computed(() => page.url.split('?')[0]);

const navItems = [
    { href: () => route('pitch.index'), label: 'Новая запись', shortLabel: 'Запись', icon: Mic, kind: 'new' as const },
    { href: () => `${route('pitch.index')}?tab=history`, label: 'История', shortLabel: 'История', icon: Clock, kind: 'history' as const },
    { href: () => route('pitch-writer.index'), label: 'Питч Райтер', shortLabel: 'Райтер', icon: Bot, kind: 'writer' as const },
];

const isActive = (kind: 'new' | 'history' | 'writer'): boolean => {
    if (kind === 'history') {
        return page.url.includes('tab=history');
    }

    if (kind === 'writer') {
        return pathname.value === writerPath;
    }

    return !page.url.includes('tab=history') && pathname.value === pitchPath;
};

const avatarLetter = computed(() =>
    page.props.auth_email ? page.props.auth_email.charAt(0).toUpperCase() : 'U',
);

const attemptsPercentage = computed(() =>
    page.props.max_attempts > 0 ? (page.props.attempts_used / page.props.max_attempts) * 100 : 0,
);

const errorValues = computed(() => Object.values(page.props.errors ?? {}));
</script>

<template>
    <div v-if="!chrome" class="app-shell app-shell--chrome-off">
        <div class="main-col">
            <div class="main-content"><slot /></div>
        </div>
    </div>

    <div v-else class="app-shell">
        <aside class="sidebar">
            <Link :href="route('pitch.index')" class="sidebar-logo">
                <LogoMark :size="28" />
                <span>Pitch AI</span>
            </Link>

            <nav class="sidebar-nav">
                <Link
                    v-for="item in navItems"
                    :key="item.label"
                    :href="item.href()"
                    class="nav-item"
                    :class="{ active: isActive(item.kind) }"
                >
                    <component :is="item.icon" :stroke-width="1.5" aria-hidden="true" />
                    {{ item.label }}
                </Link>
            </nav>

            <div class="sidebar-footer">
                <div class="attempts-bar">
                    <div class="attempts-bar-top">
                        <span>Попытки</span>
                        <span class="mono">{{ page.props.attempts_used }}/{{ page.props.max_attempts }}</span>
                    </div>
                    <div class="attempts-track">
                        <div class="attempts-fill" :style="{ width: `${Math.min(attemptsPercentage, 100)}%` }" />
                    </div>
                </div>

                <div class="user-row">
                    <div class="user-avatar">{{ avatarLetter }}</div>
                    <span class="user-email">{{ page.props.auth_email }}</span>
                    <Link
                        :href="route('auth.logout')"
                        method="post"
                        as="button"
                        class="btn-icon"
                        title="Выйти"
                        aria-label="Выйти"
                    >
                        <LogOut :stroke-width="1.5" />
                    </Link>
                </div>
            </div>
        </aside>

        <div class="main-col">
            <header class="app-header">
                <Link :href="route('pitch.index')" class="app-brand">
                    <LogoMark :size="24" />
                    <strong>Pitch AI</strong>
                </Link>
                <div class="flex items-center gap-3 ml-auto">
                    <span class="md:hidden text-xs mono" :style="{ color: 'var(--muted)' }">
                        {{ page.props.attempts_used }}/{{ page.props.max_attempts }}
                    </span>
                    <ThemeToggle />
                </div>
            </header>

            <main class="main-content">
                <div
                    v-if="page.props.status"
                    class="mx-4 md:mx-6 mt-4 px-4 py-3 rounded-xl text-sm"
                    :style="{
                        backgroundColor: 'var(--success-subtle)',
                        color: 'var(--success)',
                        border: '1px solid color-mix(in oklch, var(--success) 30%, transparent)',
                    }"
                >
                    {{ page.props.status === 'code-sent' ? 'Код успешно отправлен!' : page.props.status }}
                </div>

                <div
                    v-if="errorValues.length > 0"
                    class="mx-4 md:mx-6 mt-4 px-4 py-3 rounded-xl text-sm"
                    :style="{
                        backgroundColor: 'var(--danger-subtle)',
                        color: 'var(--danger)',
                        border: '1px solid color-mix(in oklch, var(--danger) 30%, transparent)',
                    }"
                >
                    <p class="font-medium mb-1">Ошибки:</p>
                    <ul class="space-y-0.5">
                        <li v-for="(error, idx) in errorValues" :key="idx">• {{ error }}</li>
                    </ul>
                </div>

                <slot />
            </main>

            <nav class="bottom-nav">
                <Link
                    v-for="item in navItems"
                    :key="item.label"
                    :href="item.href()"
                    :class="{ active: isActive(item.kind) }"
                >
                    <component :is="item.icon" :stroke-width="1.5" aria-hidden="true" />
                    {{ item.shortLabel }}
                </Link>
            </nav>
        </div>
    </div>
</template>
