<template>
  <div class="welcome-landing" role="button" tabindex="0" @click="onStart" @keyup.enter="onStart" @keyup.space.prevent="onStart">
    <div class="welcome-landing__decor" aria-hidden="true">
      <span v-for="star in stars" :key="star.id" class="welcome-landing__star" :style="star.style"></span>
      <q-icon
        v-for="(ghost, index) in ghostIcons"
        :key="`ghost-${index}`"
        :name="ghost.name"
        class="welcome-landing__ghost-icon"
        :style="ghost.style"
      />
    </div>

    <div class="welcome-landing__chrome" @click.stop>
      <button
        v-if="showAdmin"
        type="button"
        class="welcome-landing__icon-btn welcome-landing__icon-btn--settings"
        :aria-label="$t('BTN_LABEL_MAINPAGE_TO_ADMIN')"
        @click="emit('admin')"
      >
        <q-icon name="sym_o_settings" size="1.5rem" />
      </button>

      <button
        v-if="showGallery"
        type="button"
        class="welcome-landing__album-btn"
        @click="emit('gallery')"
      >
        <q-icon name="sym_o_photo_library" size="1.1rem" />
        <span>{{ $t('BTN_LABEL_LANDING_ALBUM') }}</span>
      </button>
    </div>

    <div class="welcome-landing__content">
      <div class="welcome-landing__logo-wrap">
        <q-icon name="sym_o_photo_camera" class="welcome-landing__logo-icon" />
      </div>
      <h1 class="welcome-landing__brand">{{ brandName }}</h1>
      <p class="welcome-landing__tagline">{{ $t('MSG_LANDING_TAGLINE') }}</p>

      <button type="button" class="welcome-landing__cta" @click.stop="onStart">
        {{ $t('MSG_LANDING_CTA') }}
      </button>
      <p class="welcome-landing__hint">{{ $t('MSG_LANDING_HINT') }}</p>
    </div>

    <button
      v-if="showHelp"
      type="button"
      class="welcome-landing__help-btn"
      :aria-label="$t('TAB_LABEL_HELP')"
      @click.stop="emit('help')"
    >
      ?
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  brandName?: string
  showAdmin?: boolean
  showGallery?: boolean
  showHelp?: boolean
}>()

const emit = defineEmits<{
  start: []
  admin: []
  gallery: []
  help: []
}>()

function onStart() {
  emit('start')
}

const stars = Array.from({ length: 28 }, (_, id) => ({
  id,
  style: {
    left: `${(id * 17 + 7) % 100}%`,
    top: `${(id * 23 + 11) % 100}%`,
    width: `${(id % 3) + 2}px`,
    height: `${(id % 3) + 2}px`,
    animationDelay: `${(id % 8) * 0.35}s`,
    opacity: id % 4 === 0 ? 0.9 : 0.45,
    background: id % 2 === 0 ? '#67e8f9' : '#f9a8d4',
  },
}))

const ghostIcons = [
  { name: 'sym_o_photo_camera', style: { left: '8%', top: '22%', fontSize: '2.2rem', opacity: 0.08 } },
  { name: 'sym_o_star', style: { left: '88%', top: '18%', fontSize: '1.8rem', opacity: 0.1 } },
  { name: 'sym_o_photo_camera', style: { left: '82%', top: '72%', fontSize: '2.8rem', opacity: 0.06 } },
  { name: 'sym_o_star', style: { left: '14%', top: '78%', fontSize: '1.4rem', opacity: 0.12 } },
]
</script>

<style lang="scss" scoped>
.welcome-landing {
  position: absolute;
  inset: 0;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  background:
    radial-gradient(ellipse 90% 70% at 50% 20%, rgba(139, 92, 246, 0.28), transparent 65%),
    radial-gradient(ellipse 50% 40% at 15% 80%, rgba(236, 72, 153, 0.14), transparent 55%),
    radial-gradient(ellipse 45% 35% at 85% 75%, rgba(99, 102, 241, 0.12), transparent 50%),
    linear-gradient(180deg, #0f0524 0%, #12082a 40%, #0a0418 100%);
  color: #fff;
  font-family: 'Inter', system-ui, sans-serif;
}

.welcome-landing__decor {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.welcome-landing__star {
  position: absolute;
  border-radius: 50%;
  animation: welcome-twinkle 3.5s ease-in-out infinite;
}

.welcome-landing__ghost-icon {
  position: absolute;
  color: #fff;
  pointer-events: none;
}

.welcome-landing__chrome {
  position: absolute;
  inset: 0;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.welcome-landing__icon-btn {
  position: absolute;
  top: clamp(1rem, 3vw, 2rem);
  left: clamp(1rem, 3vw, 2rem);
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(167, 139, 250, 0.2);
  border-radius: 0.85rem;
  background: rgba(30, 16, 50, 0.55);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: rgba(50, 24, 80, 0.8);
    border-color: rgba(167, 139, 250, 0.45);
  }
}

.welcome-landing__album-btn {
  position: absolute;
  top: clamp(1rem, 3vw, 2rem);
  right: clamp(1rem, 3vw, 2rem);
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1.15rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(90deg, #ec4899 0%, #a855f7 100%);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow: 0 0 28px rgba(236, 72, 153, 0.45);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 36px rgba(236, 72, 153, 0.55);
  }
}

.welcome-landing__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.5rem;
  max-width: 36rem;
}

.welcome-landing__logo-wrap {
  width: clamp(4.5rem, 12vw, 6rem);
  height: clamp(4.5rem, 12vw, 6rem);
  border-radius: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
  box-shadow: 0 0 50px rgba(139, 92, 246, 0.45);
}

.welcome-landing__logo-icon {
  font-size: clamp(2.2rem, 6vw, 3rem);
  color: #fff;
}

.welcome-landing__brand {
  margin: 0 0 0.65rem;
  font-size: clamp(2.8rem, 9vw, 4.5rem);
  font-weight: 800;
  letter-spacing: 0.1em;
  line-height: 1;
  text-transform: uppercase;
  background: linear-gradient(180deg, #e9d5ff 0%, #f9a8d4 55%, #c4b5fd 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.welcome-landing__tagline {
  margin: 0 0 2.5rem;
  font-size: clamp(0.75rem, 2vw, 0.95rem);
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.78);
}

.welcome-landing__cta {
  width: min(100%, 22rem);
  padding: 1.1rem 1.5rem;
  margin-bottom: 1rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(90deg, #a855f7 0%, #ec4899 50%, #f472b6 100%);
  color: #fff;
  font-size: clamp(1.05rem, 2.8vw, 1.35rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 45px rgba(168, 85, 247, 0.5);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.12),
      0 0 55px rgba(168, 85, 247, 0.62);
  }
}

.welcome-landing__hint {
  margin: 0;
  font-size: clamp(0.65rem, 1.6vw, 0.78rem);
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(167, 139, 250, 0.65);
}

.welcome-landing__help-btn {
  position: absolute;
  right: clamp(1rem, 3vw, 2rem);
  bottom: clamp(1rem, 3vw, 2rem);
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.16);
  }
}

@keyframes welcome-twinkle {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.25);
  }
}
</style>
