<template>
  <div class="style-selection">
    <button
      v-if="showBack"
      type="button"
      class="style-selection__back"
      :aria-label="$t('BTN_LABEL_BACK')"
      @click="emit('back')"
    >
      <q-icon name="sym_o_arrow_back" size="1.4rem" />
    </button>

    <header class="style-selection__header">
      <h1 class="style-selection__title">{{ headerTitle }}</h1>
      <p class="style-selection__subtitle">{{ headerSubtitle }}</p>
    </header>

    <div class="style-selection__cards" :class="{ 'style-selection__cards--many': cards.length > 2 }">
      <button
        v-for="(card, index) in cards"
        :key="`${card.action}-${card.config_index}`"
        type="button"
        class="style-card"
        :class="[`style-card--${card.variant}`, `style-card--${index % 2 === 0 ? 'left' : 'right'}`]"
        @click="selectCard(card)"
      >
        <div class="style-card__icon-wrap">
          <q-icon v-if="card.icon" :name="`sym_o_${card.icon}`" class="style-card__icon" />
          <div v-else-if="card.variant === 'strip'" class="style-card__strip-icons" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <q-icon v-else name="sym_o_photo_camera" class="style-card__icon" />
        </div>
        <h2 class="style-card__title">{{ card.title }}</h2>
        <p class="style-card__description">{{ card.description }}</p>
        <span class="style-card__badge">{{ card.badge }}</span>
      </button>
    </div>

    <p class="style-selection__footer">{{ $t('MSG_STYLE_SELECTION_FOOTER') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfigurationStore } from '../stores/configuration-store'
import type { TriggerSchema } from './FrontpageTriggerButtons.vue'

const props = withDefaults(
  defineProps<{
    triggers: TriggerSchema[]
    showBack?: boolean
    mode?: 'style' | 'template'
  }>(),
  {
    mode: 'style',
  },
)

const emit = defineEmits<{
  triggerAction: [action: string, config_index: number]
  back: []
}>()

const { t } = useI18n()
const configurationStore = useConfigurationStore()

const headerTitle = computed(() =>
  props.mode === 'template' ? t('MSG_STYLE_TEMPLATE_SELECTION_TITLE') : t('MSG_STYLE_SELECTION_TITLE'),
)
const headerSubtitle = computed(() =>
  props.mode === 'template' ? t('MSG_STYLE_TEMPLATE_SELECTION_SUBTITLE') : t('MSG_STYLE_SELECTION_SUBTITLE'),
)

interface StyleCard {
  action: string
  config_index: number
  title: string
  description: string
  badge: string
  variant: 'single' | 'strip' | 'default'
  icon?: string
}

const cards = computed<StyleCard[]>(() => {
  return props.triggers.map((trigger) => {
    const actionKey = getActionKey(trigger.action)
    const actionConfig = configurationStore.configuration.actions[actionKey]?.[trigger.config_index]
    const photoCount = getPhotoCount(actionKey, actionConfig)
    const variant =
      actionKey === 'image' ? 'single' : actionKey === 'collage' || actionKey === '__strip__' ? 'strip' : 'default'

    return {
      action: trigger.action,
      config_index: trigger.config_index,
      title: trigger.title,
      description: getDescription(actionKey, photoCount),
      badge: getBadge(actionKey, photoCount),
      variant,
      icon: trigger.icon,
    }
  })
})

function getActionKey(action: string): string {
  return action.replace('actions/', '')
}

function getBadge(actionKey: string, photoCount: number): string {
  if (actionKey === '__strip__') {
    return t('MSG_STYLE_SELECTION_BADGE_STRIP')
  }
  if (photoCount === 1) {
    return t('MSG_STYLE_SELECTION_BADGE_ONE')
  }
  return t('MSG_STYLE_SELECTION_BADGE_MANY', { count: photoCount })
}

function getPhotoCount(actionKey: string, actionConfig: Record<string, unknown> | undefined): number {
  if (actionKey === 'image') {
    return 1
  }

  if (actionKey === 'collage') {
    const mergeDefinition = (actionConfig?.processing as { merge_definition?: unknown[] } | undefined)?.merge_definition
    if (Array.isArray(mergeDefinition) && mergeDefinition.length > 0) {
      return mergeDefinition.length
    }
    return 3
  }

  return 1
}

function getDescription(actionKey: string, photoCount: number): string {
  if (actionKey === 'image') {
    return t('MSG_STYLE_SELECTION_SINGLE_DESC')
  }
  if (actionKey === '__strip__') {
    return t('MSG_STYLE_SELECTION_STRIP_DESC')
  }
  if (actionKey === 'collage') {
    return photoCount === 3 ? t('MSG_STYLE_SELECTION_STRIP_DESC') : t('MSG_STYLE_SELECTION_COLLAGE_DESC', { count: photoCount })
  }
  return t('MSG_STYLE_SELECTION_DEFAULT_DESC')
}

function selectCard(card: StyleCard) {
  emit('triggerAction', card.action, card.config_index)
}
</script>

<style lang="scss" scoped>
.style-selection {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(1.5rem, 4vw, 3rem);
  overflow: auto;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139, 92, 246, 0.22), transparent 70%),
    radial-gradient(ellipse 60% 50% at 80% 100%, rgba(236, 72, 153, 0.12), transparent 60%),
    linear-gradient(165deg, #12081f 0%, #1a0f2e 45%, #0f0a1a 100%);
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
}

.style-selection__back {
  position: absolute;
  top: clamp(1rem, 3vw, 2rem);
  left: clamp(1rem, 3vw, 2rem);
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(167, 139, 250, 0.25);
  border-radius: 0.75rem;
  background: rgba(30, 16, 50, 0.75);
  color: #e9d5ff;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: rgba(50, 24, 80, 0.9);
    border-color: rgba(167, 139, 250, 0.5);
  }
}

.style-selection__header {
  text-align: center;
  margin-bottom: clamp(1.5rem, 4vw, 3rem);
  max-width: 52rem;
}

.style-selection__title {
  margin: 0 0 0.75rem;
  font-size: clamp(2rem, 5.5vw, 3.5rem);
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1.1;
  text-transform: uppercase;
  background: linear-gradient(90deg, #c4b5fd 0%, #a78bfa 35%, #67e8f9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.style-selection__subtitle {
  margin: 0;
  font-size: clamp(0.95rem, 2.2vw, 1.2rem);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.82);
  letter-spacing: 0.02em;
}

.style-selection__cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(1rem, 3vw, 2rem);
  width: min(100%, 56rem);
  margin-bottom: clamp(1.5rem, 3vw, 2.5rem);

  &--many {
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  }
}

.style-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: clamp(1.5rem, 3.5vw, 2.5rem) clamp(1rem, 2.5vw, 1.75rem);
  border-radius: 1.25rem;
  border: 1px solid transparent;
  background: rgba(24, 14, 40, 0.65);
  color: #fff;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  min-height: 18rem;

  &:hover {
    transform: translateY(-4px);
  }

  &--left {
    border-color: rgba(167, 139, 250, 0.45);
    box-shadow:
      0 0 0 1px rgba(139, 92, 246, 0.15),
      0 0 40px rgba(139, 92, 246, 0.18);

    &:hover {
      box-shadow:
        0 0 0 1px rgba(167, 139, 250, 0.35),
        0 0 55px rgba(139, 92, 246, 0.28);
    }

    .style-card__icon-wrap {
      background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
    }
  }

  &--right {
    border-color: rgba(244, 114, 182, 0.45);
    box-shadow:
      0 0 0 1px rgba(236, 72, 153, 0.15),
      0 0 40px rgba(236, 72, 153, 0.18);

    &:hover {
      box-shadow:
        0 0 0 1px rgba(244, 114, 182, 0.35),
        0 0 55px rgba(236, 72, 153, 0.28);
    }

    .style-card__icon-wrap {
      background: linear-gradient(135deg, #ec4899 0%, #ef4444 100%);
    }
  }

  &--default {
    border-color: rgba(148, 163, 184, 0.35);
    box-shadow: 0 0 30px rgba(100, 116, 139, 0.15);

    .style-card__icon-wrap {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    }
  }
}

.style-card__icon-wrap {
  width: clamp(4rem, 10vw, 5.5rem);
  height: clamp(4rem, 10vw, 5.5rem);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.style-card__icon {
  font-size: clamp(2rem, 5vw, 2.75rem);
  color: #fff;
}

.style-card__strip-icons {
  display: flex;
  gap: 0.35rem;
  align-items: flex-end;

  span {
    display: block;
    width: 0.85rem;
    height: 1.1rem;
    border-radius: 0.2rem;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);

    &:nth-child(2) {
      height: 1.35rem;
    }
  }
}

.style-card__title {
  margin: 0 0 0.65rem;
  font-size: clamp(1.1rem, 2.8vw, 1.55rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.style-card__description {
  margin: 0 0 1.25rem;
  flex: 1;
  font-size: clamp(0.85rem, 1.8vw, 1rem);
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.72);
  max-width: 16rem;
}

.style-card__badge {
  display: inline-block;
  padding: 0.45rem 1.1rem;
  border-radius: 999px;
  background: rgba(45, 20, 70, 0.9);
  border: 1px solid rgba(167, 139, 250, 0.25);
  font-size: clamp(0.7rem, 1.5vw, 0.82rem);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #e9d5ff;
}

.style-selection__footer {
  margin: 0;
  font-size: clamp(0.7rem, 1.6vw, 0.85rem);
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(129, 140, 248, 0.75);
}

@media (max-width: 720px) {
  .style-selection__cards:not(.style-selection__cards--many) {
    grid-template-columns: 1fr;
    max-width: 22rem;
  }

  .style-card {
    min-height: auto;
  }
}
</style>
