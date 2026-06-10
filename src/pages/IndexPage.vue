<template>
  <q-page id="index-page" class="q-pa-none full-height">
    <preview-stream
      v-if="showPreviewThrottled && !showBoothOverlay"
      :index_device="configurationStore.configuration.backends.index_backend_video"
      :frame-overlay-image="frameOverlayImage"
      :enable-blurred-background-stream="configurationStore.configuration.uisettings.livestream_blurredbackground"
      :enable-mirror-effect-stream="configurationStore.configuration.uisettings.livestream_mirror_effect"
      :enable-mirror-effect-frame="configurationStore.configuration.uisettings.livestream_frameoverlay_mirror_effect"
      :blurredbackground-high-framerate="configurationStore.configuration.uisettings.livestream_blurredbackground_high_framerate"
    ></preview-stream>

    <!-- layer display processing spinner grid to show user computer working hard -->
    <div v-if="stateStore.isStateProcessing" class="full-height full-width column justify-center content-center" style="position: absolute">
      <q-spinner-grid size="20em" />
    </div>

    <!-- wait for user to touch before countdown -->
    <TouchToCaptureOverlay v-if="stateStore.isStateReadyToCapture" />

    <!-- layer display the countdown timer -->
    <div
      v-if="stateStore.isStateCountdown"
      id="frontpage-countdown"
      class="full-height full-width column justify-center content-center"
      style="position: absolute"
    >
      <countdown-timer
        ref="countdowntimer"
        :duration="stateStore.jobmodel.duration"
        :message-duration="configurationStore.configuration.uisettings.TAKEPIC_MSG_TIME"
        :message-text="configurationStore.configuration.uisettings.TAKEPIC_MSG_TEXT"
      ></countdown-timer>
    </div>

    <!-- layer display the front page text -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div
      v-if="stateStore.isStateIdle && !showBoothOverlay"
      id="frontpage_text"
      v-html="configurationStore.configuration.uisettings.FRONTPAGE_TEXT"
    ></div>

    <WelcomeLandingOverlay
      v-if="showLanding"
      show-admin
      show-gallery
      show-help
      @start="boothSessionStarted = true"
      @admin="onBtnAdminClick"
      @gallery="router.push('/gallery')"
      @help="router.push('/admin/help')"
    />

    <StyleSelectionOverlay
      v-if="showStyleSelection"
      :triggers="styleSelectionTriggers"
      show-back
      @trigger-action="invokeAction"
      @back="boothSessionStarted = false"
    />

    <!-- dialog for approval -->
    <div v-if="stateStore.isStateApproval">
      <MediaItemApprovalViewer
        :approval_id="stateStore.jobmodel.approval_id"
        :number_captures_taken="stateStore.jobmodel.number_captures_taken"
        :total_captures_to_take="stateStore.jobmodel.total_captures_to_take"
      >
      </MediaItemApprovalViewer>
    </div>

    <!-- video state controls -->
    <q-page-sticky v-if="stateStore.isStateRecording" id="frontpage-indicator-recording" position="top-right" :offset="[25, 25]" align="center">
      <q-spinner-puff color="red" size="12em" thickness="20" />
    </q-page-sticky>
    <q-page-sticky v-if="stateStore.isStateRecording" id="frontpage-indicator-stop-recording" position="bottom" :offset="[0, 25]" align="center">
      <q-btn stack rounded no-caps color="negative" class="action-button glass-effect" @click="stopRecordingVideo()">
        <q-icon name="sym_o_stop_circle" />
        <div>{{ $t('Stop recording') }}</div>
      </q-btn>
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { watchDebounced, refThrottled } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { remoteProcedureCall } from '../util/fetch_api.js'
import { useStateStore } from '../stores/state-store'
import { useConfigurationStore } from '../stores/configuration-store'
import CountdownTimer from '../components/CountdownTimer.vue'
import type { TriggerSchema } from '../components/FrontpageTriggerButtons.vue'
import StyleSelectionOverlay from '../components/StyleSelectionOverlay.vue'
import WelcomeLandingOverlay from '../components/WelcomeLandingOverlay.vue'
import { isEmpty } from 'lodash'
import { default as PreviewStream } from '../components/PreviewStream.vue'
import _ from 'lodash'
import MediaItemApprovalViewer from 'src/components/MediaItemApprovalViewer.vue'
import TouchToCaptureOverlay from '../components/TouchToCaptureOverlay.vue'

const stateStore = useStateStore()
const configurationStore = useConfigurationStore()
const router = useRouter()
const btnAdminClickCounter = ref(0)
const boothSessionStarted = ref(false)

watch(
  () => stateStore.isStateIdle,
  (idle) => {
    if (idle) {
      boothSessionStarted.value = false
    }
  },
)

watchDebounced(
  btnAdminClickCounter,
  () => {
    if (btnAdminClickCounter.value >= 5) {
      router.push('/admin')
    }
    btnAdminClickCounter.value = 0
  },
  { debounce: 500 },
)
const styleSelectionTriggers = computed(() => {
  const result: TriggerSchema[] = []

  Object.entries(configurationStore.configuration.actions).forEach(([key, actions]) => {
    actions.forEach((action, index: number) => {
      const title = action.trigger.ui_trigger.title
      const icon = action.trigger.ui_trigger.icon
      const showButton = action.trigger.ui_trigger.show_button

      if (!showButton || (isEmpty(title) && isEmpty(icon))) {
        return
      }

      result.push({
        action: `actions/${key}`,
        config_index: index,
        show_button: showButton,
        title,
        icon,
        use_custom_color: action.trigger.ui_trigger.use_custom_color,
        custom_color: action.trigger.ui_trigger.custom_color,
      })
    })
  })

  return result
})

const showLanding = computed(
  () => stateStore.isStateIdle && !boothSessionStarted.value && styleSelectionTriggers.value.length > 0,
)
const showStyleSelection = computed(
  () => stateStore.isStateIdle && boothSessionStarted.value && styleSelectionTriggers.value.length > 0,
)
const showBoothOverlay = computed(() => showLanding.value || showStyleSelection.value)

const adminButtonInvisible = computed(() => {
  return configurationStore.configuration.uisettings.admin_button_invisible
})

const showPreview = computed(() => {
  const enabledWhenIdle = configurationStore.configuration.uisettings.enable_livestream_when_idle
  const enabledWhenActive = configurationStore.configuration.uisettings.enable_livestream_when_active
  const machineIdle = stateStore.isStateIdle
  const machineReady = stateStore.isStateReadyToCapture
  const machineRecord = stateStore.isStateRecording
  const machineCounting = stateStore.isStateCountdown
  const machineCapture = stateStore.isStateCapture

  // allow user to choose if shown during idle or process only. during record it cannot be disabled because video useful to show while recording
  return (
    (machineIdle && enabledWhenIdle) ||
    ((machineReady || machineCounting || machineCapture) && enabledWhenActive) ||
    machineRecord
  )
})
// following is to avoid short time preview requested. there is a race condition when the state machine finishes and short time target is present.
// right after present it changes to finished and so the route is changed to presenter + the preview component is enabled which causes issues because
// just a moment later it's disabled again.
const showPreviewThrottled = refThrottled(showPreview, 500)

const frameOverlayImage = computed(() => {
  const enable_action_frame_overlay = _.get(stateStore.jobmodel.configuration_set, 'processing.img_frame_enable', false)
  const action_frame_overlay_image = _.get(stateStore.jobmodel.configuration_set, 'processing.img_frame_file', '')
  if ((stateStore.isStateCountdown || stateStore.isStateReadyToCapture) && enable_action_frame_overlay) {
    //during countdown the action frame is priorized.
    return action_frame_overlay_image
  } else if (stateStore.isStateIdle && configurationStore.configuration.uisettings.enable_livestream_frameoverlay) {
    // the live frame is shown in idle only
    return configurationStore.configuration.uisettings.livestream_frameoverlay_image
  } else {
    return ''
  }
})

const onBtnAdminClick = () => {
  if (adminButtonInvisible.value) {
    btnAdminClickCounter.value++
  } else {
    router.push('/admin')
  }
}
const invokeAction = (action: string, config_index: number) => {
  stateStore.lastCaptureAction = action
  stateStore.lastCaptureConfigIndex = config_index
  remoteProcedureCall(`/api/${action}/${config_index}`)
}
const stopRecordingVideo = () => {
  remoteProcedureCall('/api/processing/next')
}
</script>

<style lang="sass">

// if button shall be invisible, set it to transparent and on mouseover use default cursor, no pointer
.action-button-admin-invisible
  opacity: 0.0
  cursor: default
</style>
