<script setup lang="ts">
import { computed, ref } from 'vue';
import { Head, useForm, usePage } from '@inertiajs/vue3';
import { route } from 'ziggy-js';
import { Loader2 } from 'lucide-vue-next';
import ThemeToggle from '@/Components/ThemeToggle.vue';
import LogoMark from '@/Components/LogoMark.vue';

const page = usePage<{
    status: string | null;
    errors: Record<string, string>;
    otpRequired?: boolean;
}>();

const otpRequired = computed(() => page.props.otpRequired ?? true);

const step = ref<'email' | 'code'>(page.props.status === 'code-sent' ? 'code' : 'email');

const form = useForm({ email: '', code: '' });

const submitEmail = () => {
    form.post(route('auth.send-code'), {
        preserveScroll: true,
        onSuccess: () => {
            if (otpRequired.value) {
                step.value = 'code';
            }
        },
    });
};

const submitCode = () => {
    form.post(route('auth.verify-code'), { preserveScroll: true });
};

const backToEmail = () => {
    form.clearErrors();
    form.code = '';
    step.value = 'email';
};

const onCodeInput = (event: Event) => {
    form.code = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
};

const showCode = computed(() => step.value === 'code');
</script>

<template>
    <div class="login-page">
        <Head title="Вход — Pitch AI" />

        <header class="app-header app-header--standalone">
            <a class="app-brand" :href="route('login')">
                <LogoMark :size="24" />
                <strong>Pitch AI</strong>
            </a>
            <ThemeToggle />
        </header>

        <div class="login-card">
            <div class="login-brand">
                <LogoMark :size="28" />
                <h1>Pitch AI</h1>
            </div>

            <form v-if="!showCode" @submit.prevent="submitEmail">
                <h2>Вход по email</h2>
                <p class="lead">
                    {{ otpRequired
                        ? 'Без пароля. Пришлём одноразовый код для доступа к студии.'
                        : 'Локальная разработка: введите email и войдите без кода.' }}
                </p>

                <div class="field" :class="{ 'has-error': form.errors.email }">
                    <label for="login-email">Email</label>
                    <div class="input-wrap">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <path d="m3 7 9 6 9-6" />
                        </svg>
                        <input
                            v-model="form.email"
                            class="input"
                            :class="{ 'input-error': form.errors.email }"
                            id="login-email"
                            type="email"
                            name="email"
                            placeholder="__VG_EMAIL_57af97e7feb8__"
                            autocomplete="email"
                            inputmode="email"
                            required
                            autofocus
                            aria-describedby="login-email-hint login-email-error"
                        />
                    </div>
                    <span class="field-hint" id="login-email-hint">
                        Используем только для входа — без рассылок.
                    </span>
                    <span
                        v-if="form.errors.email || page.props.errors?.email"
                        class="field-error is-visible"
                        id="login-email-error"
                        role="alert"
                    >
                        {{ form.errors.email || page.props.errors.email }}
                    </span>
                </div>

                <div class="login-actions">
                    <button type="submit" class="btn btn-primary" :disabled="form.processing">
                        <Loader2 v-if="form.processing" class="w-4 h-4 animate-spin" />
                        <template v-else-if="otpRequired">Получить код</template>
                        <template v-else>Войти</template>
                    </button>
                </div>
            </form>

            <form v-else @submit.prevent="submitCode">
                <h2>Введите код</h2>
                <p class="lead">
                    Шестизначный код отправлен на <strong>{{ form.email || 'ваш email' }}</strong>. Действует 10 минут.
                </p>

                <div class="field" :class="{ 'has-error': form.errors.code }">
                    <label for="login-code">Код из письма</label>
                    <input
                        :value="form.code"
                        class="input code"
                        :class="{ 'input-error': form.errors.code }"
                        id="login-code"
                        type="text"
                        name="code"
                        inputmode="numeric"
                        maxlength="6"
                        autocomplete="one-time-code"
                        placeholder="000000"
                        required
                        autofocus
                        aria-describedby="login-code-error"
                        @input="onCodeInput"
                    />
                    <span
                        v-if="form.errors.code || page.props.errors?.code"
                        class="field-error is-visible"
                        id="login-code-error"
                        role="alert"
                    >
                        {{ form.errors.code || page.props.errors.code }}
                    </span>
                </div>

                <div class="login-actions">
                    <button type="submit" class="btn btn-primary" :disabled="form.processing">
                        <Loader2 v-if="form.processing" class="w-4 h-4 animate-spin" />
                        <template v-else>Войти</template>
                    </button>
                    <button type="button" class="btn btn-secondary" @click="backToEmail">
                        Изменить email
                    </button>
                </div>
                <p class="login-meta">Не пришло? Проверьте спам или запросите код снова через 30 сек.</p>
            </form>
        </div>
    </div>
</template>
