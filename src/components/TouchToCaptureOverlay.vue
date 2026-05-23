<template>
  <div
    id="touch-to-capture-overlay"
    class="full-height full-width column justify-center items-center"
    style="position: absolute; z-index: 10; cursor: pointer"
    role="button"
    tabindex="0"
    @click="onTouch"
    @keyup.enter="onTouch"
    @keyup.space.prevent="onTouch"
  >
    <div class="touch-to-capture-circle column justify-center items-center text-center text-white">
      <div class="touch-to-capture-line">{{ $t('MSG_TOUCH_TO_CAPTURE_LINE1') }}</div>
      <div class="touch-to-capture-line">{{ $t('MSG_TOUCH_TO_CAPTURE_LINE2') }}</div>
      <div class="touch-to-capture-line">{{ $t('MSG_TOUCH_TO_CAPTURE_LINE3') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { remoteProcedureCall } from '../util/fetch_api.js'

const emit = defineEmits<{
  captureStarted: []
}>()

function onTouch() {
  remoteProcedureCall('/api/processing/next')
  emit('captureStarted')
}
</script>

<style lang="scss" scoped>
.touch-to-capture-circle {
  width: min(70vw, 70vh);
  height: min(70vw, 70vh);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(4px);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 2rem;
  user-select: none;
}

.touch-to-capture-line {
  font-size: clamp(1.4rem, 4.5vw, 2.6rem);
  line-height: 1.15;
  text-transform: uppercase;
}
</style>
