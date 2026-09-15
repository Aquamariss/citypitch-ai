<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Head, useForm, usePage } from '@inertiajs/vue3';
import { route } from 'ziggy-js';
import { Loader2, Mail, MapPin, MessageCircle, Phone, User } from 'lucide-vue-next';
import ThemeToggle from '@/Components/ThemeToggle.vue';
import LogoMark from '@/Components/LogoMark.vue';
import { formatPhone, isPhoneComplete } from '@/lib/phone';

const PERSONAL_DATA_AGREEMENT_URL = 'https://cityuniversity.ru/agreement-personal-data';

const CONSENT_REQUIRED_MESSAGE = 'Без согласия на обработку персональных данных войти нельзя.';
const PHONE_INVALID_MESSAGE = 'Проверьте номер телефона: например, +7 (900) 123-45-67.';

const page = usePage<{
    status: string | null;
    errors: Record<string, string>;
    otpRequired?: boolean;
}>();

const otpRequired = computed(() => page.props.otpRequired ?? true);

const step = ref<'profile' | 'code'>(page.props.status === 'code-sent' ? 'code' : 'profile');

const form = useForm({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    messenger: '',
    personal_data_consent: false,
    marketing_consent: false,
    code: '',
});

// Клиентские проверки дублируют серверные, чтобы не гонять форму туда-обратно.
const consentError = ref<string | null>(null);
const phoneError = ref<string | null>(null);

const notice = computed(() =>
    page.props.status && page.props.status !== 'code-sent' ? page.props.status : null);

const errorFor = (field: 'full_name' | 'email' | 'phone' | 'messenger' | 'city' | 'code'): string | undefined =>
    form.errors[field] || page.props.errors?.[field];

const onPhoneInput = (event: Event) => {
    const input = event.target as HTMLInputElement;
    form.phone = formatPhone(input.value);
    input.value = form.phone;

    if (phoneError.value && isPhoneComplete(form.phone)) {
        phoneError.value = null;
    }
};

watch(() => form.personal_data_consent, (checked) => {
    if (checked) {
        consentError.value = null;
    }
});

// Сервер просит заполнить анкету заново, если она не дожила до ввода кода.
watch(() => form.errors.email, (error) => {
    if (error && step.value === 'code') {
        step.value = 'profile';
    }
});

const submitProfile = () => {
    consentError.value = form.personal_data_consent ? null : CONSENT_REQUIRED_MESSAGE;
    phoneError.value = isPhoneComplete(form.phone) ? null : PHONE_INVALID_MESSAGE;

    if (consentError.value || phoneError.value) {
        return;
    }

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

const backToProfile = () => {
    form.clearErrors();
    form.code = '';
    step.value = 'profile';
};

const onCodeInput = (event: Event) => {
    form.code = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
};

const showCode = computed(() => step.value === 'code');
</script>

<template>
    <div class="login-page">
        <Head title="Вход — Citypitch-AI" />

        <header class="app-header app-header--standalone">
            <a class="app-brand" :href="route('login')">
                <LogoMark :size="24" />
                <span class="brand-text">
                    <strong>Citypitch-AI</strong>
                    <small>@ Cityuniversity 2.0</small>
                </span>
            </a>
            <ThemeToggle />
        </header>

        <div class="login-card">
            <div class="login-brand">
                <LogoMark :size="28" />
                <h1>Citypitch-AI</h1>
            </div>

            <p v-if="notice" class="login-notice" role="status">{{ notice }}</p>

            <form v-if="!showCode" novalidate @submit.prevent="submitProfile">
                <h2>Вход в тренажёр</h2>
                <p class="lead">
                    {{ otpRequired
                        ? 'Заполните данные — пришлём одноразовый код на email.'
                        : 'Локальная разработка: заполните данные и войдите без кода.' }}
                </p>

                <div class="field" :class="{ 'has-error': errorFor('full_name') }">
                    <label for="login-full-name">ФИО</label>
                    <div class="input-wrap">
                        <User :stroke-width="1.5" aria-hidden="true" />
                        <input
                            v-model="form.full_name"
                            class="input"
                            id="login-full-name"
                            type="text"
                            name="full_name"
                            placeholder="Иванова Анна Сергеевна"
                            autocomplete="name"
                            maxlength="255"
                            aria-describedby="login-full-name-error"
                        />
                    </div>
                    <span v-if="errorFor('full_name')" class="field-error is-visible" id="login-full-name-error" role="alert">
                        {{ errorFor('full_name') }}
                    </span>
                </div>

                <div class="field" :class="{ 'has-error': errorFor('email') }">
                    <label for="login-email">Email <span class="field-required" aria-hidden="true">*</span></label>
                    <div class="input-wrap">
                        <Mail :stroke-width="1.5" aria-hidden="true" />
                        <input
                            v-model.trim="form.email"
                            class="input"
                            id="login-email"
                            type="email"
                            name="email"
                            placeholder="name@example.com"
                            autocomplete="email"
                            inputmode="email"
                            maxlength="255"
                            required
                            aria-required="true"
                            aria-describedby="login-email-error"
                        />
                    </div>
                    <span v-if="errorFor('email')" class="field-error is-visible" id="login-email-error" role="alert">
                        {{ errorFor('email') }}
                    </span>
                </div>

                <div class="field" :class="{ 'has-error': phoneError || errorFor('phone') }">
                    <label for="login-phone">Телефон <span class="field-required" aria-hidden="true">*</span></label>
                    <div class="input-wrap">
                        <Phone :stroke-width="1.5" aria-hidden="true" />
                        <input
                            :value="form.phone"
                            class="input"
                            id="login-phone"
                            type="tel"
                            name="phone"
                            placeholder="+7 (900) 123-45-67"
                            autocomplete="tel"
                            inputmode="tel"
                            required
                            aria-required="true"
                            aria-describedby="login-phone-hint login-phone-error"
                            @input="onPhoneInput"
                        />
                    </div>
                    <span class="field-hint" id="login-phone-hint">
                        Номер другой страны начните с «+» и кода страны.
                    </span>
                    <span v-if="phoneError || errorFor('phone')" class="field-error is-visible" id="login-phone-error" role="alert">
                        {{ phoneError || errorFor('phone') }}
                    </span>
                </div>

                <div class="field" :class="{ 'has-error': errorFor('messenger') }">
                    <label for="login-messenger">Telegram или MAX для связи</label>
                    <div class="input-wrap">
                        <MessageCircle :stroke-width="1.5" aria-hidden="true" />
                        <input
                            v-model="form.messenger"
                            class="input"
                            id="login-messenger"
                            type="text"
                            name="messenger"
                            placeholder="@username или ссылка на профиль"
                            autocomplete="off"
                            autocapitalize="off"
                            spellcheck="false"
                            maxlength="255"
                            aria-describedby="login-messenger-error"
                        />
                    </div>
                    <span v-if="errorFor('messenger')" class="field-error is-visible" id="login-messenger-error" role="alert">
                        {{ errorFor('messenger') }}
                    </span>
                </div>

                <div class="field" :class="{ 'has-error': errorFor('city') }">
                    <label for="login-city">Город</label>
                    <div class="input-wrap">
                        <MapPin :stroke-width="1.5" aria-hidden="true" />
                        <input
                            v-model="form.city"
                            class="input"
                            id="login-city"
                            type="text"
                            name="city"
                            placeholder="Кемерово"
                            autocomplete="address-level2"
                            maxlength="255"
                            aria-describedby="login-city-error"
                        />
                    </div>
                    <span v-if="errorFor('city')" class="field-error is-visible" id="login-city-error" role="alert">
                        {{ errorFor('city') }}
                    </span>
                </div>

                <div class="consents">
                    <div>
                        <label class="consent">
                            <input
                                v-model="form.personal_data_consent"
                                type="checkbox"
                                name="personal_data_consent"
                                aria-required="true"
                                aria-describedby="login-consent-error"
                            />
                            <span>
                                Я даю
                                <a :href="PERSONAL_DATA_AGREEMENT_URL" target="_blank" rel="noopener noreferrer">
                                    согласие на обработку персональных данных</a>
                                в соответствии с политикой обработки и политикой конфиденциальности
                                персональных данных <span class="field-required" aria-hidden="true">*</span>
                            </span>
                        </label>
                        <span
                            v-if="consentError || form.errors.personal_data_consent"
                            class="field-error is-visible"
                            id="login-consent-error"
                            role="alert"
                        >
                            {{ consentError || form.errors.personal_data_consent }}
                        </span>
                    </div>

                    <label class="consent">
                        <input v-model="form.marketing_consent" type="checkbox" name="marketing_consent" />
                        <span>Я даю согласие на получение рекламных сообщений</span>
                    </label>
                </div>

                <p class="login-required-note"><span class="field-required" aria-hidden="true">*</span> — обязательно</p>

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

                <div class="field" :class="{ 'has-error': errorFor('code') }">
                    <label for="login-code">Код из письма</label>
                    <input
                        :value="form.code"
                        class="input code"
                        :class="{ 'input-error': errorFor('code') }"
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
                    <span v-if="errorFor('code')" class="field-error is-visible" id="login-code-error" role="alert">
                        {{ errorFor('code') }}
                    </span>
                </div>

                <div class="login-actions">
                    <button type="submit" class="btn btn-primary" :disabled="form.processing">
                        <Loader2 v-if="form.processing" class="w-4 h-4 animate-spin" />
                        <template v-else>Войти</template>
                    </button>
                    <button type="button" class="btn btn-secondary" @click="backToProfile">
                        Изменить данные
                    </button>
                </div>
                <p class="login-meta">Не пришло? Проверьте спам или запросите код снова через 30 сек.</p>
            </form>
        </div>
    </div>
</template>
