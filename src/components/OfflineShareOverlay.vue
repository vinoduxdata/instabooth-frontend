<template>
  <div class="offline-share">
    <div class="offline-share__panel">
      <button type="button" class="offline-share__close" :aria-label="$t('BTN_LABEL_BACK')" @click="emit('close')">
        <q-icon name="sym_o_close" size="1.4rem" />
      </button>

      <h2 class="offline-share__title">{{ $t('MSG_OFFLINE_SHARE_TITLE') }}</h2>
      <p class="offline-share__subtitle">{{ $t('MSG_OFFLINE_SHARE_SUBTITLE') }}</p>

      <div class="offline-share__grid">
        <section v-if="wifiQrImageUrl" class="offline-share__card">
          <h3>{{ $t('MSG_OFFLINE_SHARE_WIFI_TITLE') }}</h3>
          <p class="offline-share__hint">{{ $t('MSG_OFFLINE_SHARE_WIFI_HINT') }}</p>
          <img :src="wifiQrImageUrl" class="offline-share__wifi-img" :alt="$t('MSG_OFFLINE_SHARE_WIFI_TITLE')" />
        </section>

        <section class="offline-share__card" :class="{ 'offline-share__card--solo': !wifiQrImageUrl }">
          <h3>{{ $t('MSG_OFFLINE_SHARE_DOWNLOAD_TITLE') }}</h3>
          <p class="offline-share__hint">{{ $t('MSG_OFFLINE_SHARE_DOWNLOAD_HINT') }}</p>
          <div v-if="downloadUrl" class="offline-share__qr-wrap">
            <qrcode-vue :value="downloadUrl" :margin="2" :size="220" level="M" render-as="svg" class="offline-share__qr" />
          </div>
          <p v-if="downloadUrl" class="offline-share__url">{{ downloadUrl }}</p>
        </section>
      </div>

      <p v-if="!wifiQrImageUrl" class="offline-share__note">{{ $t('MSG_OFFLINE_SHARE_WIFI_MISSING') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { _fetch } from '../util/fetch_api.js'

const props = defineProps<{
  approvalId?: string
  mediaId?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const wifiQrImageUrl = ref<string | null>(null)
const downloadUrl = ref<string | null>(null)

async function loadShareInfo() {
  wifiQrImageUrl.value = null
  downloadUrl.value = null

  const endpoint = props.approvalId
    ? `/api/share/offline/approval/${props.approvalId}`
    : props.mediaId
      ? `/api/share/offline/media/${props.mediaId}`
      : null

  if (!endpoint) {
    return
  }

  try {
    const response = await _fetch(endpoint)
    if (!response.ok) {
      throw new Error(`${response.status}`)
    }
    const data = (await response.json()) as { wifi_qr_image_url?: string | null; download_url?: string | null }
    wifiQrImageUrl.value = data.wifi_qr_image_url ?? null
    downloadUrl.value = data.download_url ?? null
  } catch (error) {
    console.warn('offline share info failed', error)
  }
}

onMounted(loadShareInfo)
watch(() => [props.approvalId, props.mediaId], loadShareInfo)
</script>

<style lang="scss" scoped>
.offline-share {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(8, 4, 18, 0.88);
  backdrop-filter: blur(8px);
}

.offline-share__panel {
  position: relative;
  width: min(100%, 52rem);
  max-height: 100%;
  overflow: auto;
  padding: 2rem 1.75rem 1.5rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(167, 139, 250, 0.28);
  background: linear-gradient(165deg, rgba(24, 14, 40, 0.98) 0%, rgba(15, 5, 36, 0.98) 100%);
  box-shadow: 0 0 50px rgba(139, 92, 246, 0.22);
  color: #fff;
}

.offline-share__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid rgba(167, 139, 250, 0.25);
  border-radius: 0.65rem;
  background: rgba(30, 16, 50, 0.8);
  color: #fff;
  cursor: pointer;
}

.offline-share__title {
  margin: 0 0 0.35rem;
  text-align: center;
  font-size: clamp(1.4rem, 3vw, 1.9rem);
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: linear-gradient(90deg, #c4b5fd, #f9a8d4);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.offline-share__subtitle {
  margin: 0 0 1.5rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.95rem;
}

.offline-share__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.offline-share__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid rgba(167, 139, 250, 0.2);
  background: rgba(255, 255, 255, 0.03);

  h3 {
    margin: 0 0 0.35rem;
    font-size: 0.95rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #e9d5ff;
  }

  &--solo {
    grid-column: 1 / -1;
    max-width: 22rem;
    margin: 0 auto;
  }
}

.offline-share__hint {
  margin: 0 0 0.75rem;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.4;
}

.offline-share__wifi-img {
  width: min(100%, 220px);
  border-radius: 0.75rem;
  background: #fff;
  padding: 0.35rem;
}

.offline-share__qr-wrap {
  width: min(100%, 220px);
  padding: 0.35rem;
  border-radius: 0.75rem;
  background: #fff;
}

.offline-share__qr {
  width: 100% !important;
  height: auto !important;
  display: block;
}

.offline-share__url {
  margin: 0.75rem 0 0;
  font-size: 0.7rem;
  word-break: break-all;
  color: rgba(103, 232, 249, 0.85);
}

.offline-share__note {
  margin: 1rem 0 0;
  text-align: center;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.45);
}

@media (max-width: 720px) {
  .offline-share__grid {
    grid-template-columns: 1fr;
  }

  .offline-share__card--solo {
    max-width: none;
  }
}
</style>
