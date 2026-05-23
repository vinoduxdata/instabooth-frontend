<template>
  <div id="itemapproval-dialog" class="absolute-full flex flex-center">
    <q-img
      v-if="showImage"
      :draggable="false"
      loading="eager"
      :src="`/api/processing/approval/${approval_id}`"
      fit="contain"
      style="height: 95%"
      @error="showImage = false"
      loading-show-delay="800"
    />

    <ItemNotAvailableError v-else />

    <!-- Image: Retake + Direct Print only (same backend flow as collage try again / approve) -->
    <q-page-sticky v-if="isImageJob" position="bottom" class="q-ma-lg">
      <div class="q-mb-lg action-buttons col">
        <div class="row">
          <q-btn
            id="item-approval-button-retake"
            stack
            rounded
            class="q-mr-lg action-button col-auto glass-effect"
            color="negative"
            no-caps
            icon="sym_o_refresh"
            :label="$t('BTN_LABEL_RETAKE')"
            @click="userReject()"
          />

          <q-btn
            id="item-approval-button-direct-print"
            stack
            rounded
            class="q-mr-sm action-button col-auto glass-effect"
            color="positive"
            no-caps
            icon="sym_o_print"
            :label="directPrintLabel"
            @click="userDirectPrint()"
          />
        </div>
      </div>
    </q-page-sticky>

    <!-- Collage: Try again + Awesome, next (+ abort) -->
    <template v-else>
      <q-page-sticky position="top-left" class="q-ma-lg">
        <q-btn id="layout-button-back" color="grey" rounded no-caps @click="userAbort()" class="action-button glass-effect">
          <q-icon left name="sym_o_cancel" />
          <div>{{ $t('MSG_APPROVE_COLLAGE_ITEM_CANCEL_COLLAGE') }}</div>
        </q-btn>
      </q-page-sticky>
      <q-page-sticky position="bottom" class="q-ma-lg">
        <div class="q-mb-lg action-buttons col">
          <div class="q-mb-sm row flex flex-center">
            <q-badge color="grey-8" class="q-mr-xs">
              <q-icon name="sym_o_tag" color="white" class="q-mr-xs" />
              {{
                $t('LABEL_ELEMENT_X_OF_Y', {
                  no: number_captures_taken,
                  total: total_captures_to_take,
                })
              }}
            </q-badge>
          </div>
          <div class="row">
            <q-btn
              id="item-approval-button-reject"
              stack
              rounded
              class="q-mr-lg action-button col-auto glass-effect"
              color="negative"
              no-caps
              icon="sym_o_thumb_down"
              :label="$t('MSG_APPROVE_COLLAGE_ITEM_RETRY')"
              @click="userReject()"
            />

            <q-btn
              id="item-approval-button-approve"
              stack
              rounded
              class="q-mr-sm action-button col-auto glass-effect"
              color="positive"
              no-caps
              icon="sym_o_thumb_up"
              :label="$t('MSG_APPROVE_COLLAGE_ITEM_APPROVE')"
              @click="userConfirm()"
            />
          </div>
        </div>
      </q-page-sticky>
    </template>
  </div>
</template>

<script setup lang="ts">
import { remoteProcedureCall } from '../util/fetch_api.js'
import { ref, onBeforeMount, computed } from 'vue'
import { useConfigurationStore } from '../stores/configuration-store'
import { useStateStore } from '../stores/state-store'
import ItemNotAvailableError from '../components/ItemNotAvailableError.vue'

defineProps<{
  approval_id: string
  number_captures_taken: number
  total_captures_to_take: number
}>()

const configurationStore = useConfigurationStore()
const stateStore = useStateStore()

const showImage = ref(true)

const isImageJob = computed(() => stateStore.jobmodel.typ === 'image')

const directPrintConfigIndex = computed(() => {
  const actions = configurationStore.configuration.share.actions
  const idx = actions.findIndex((a) => a.trigger.ui_trigger.show_button && a.trigger.ui_trigger.title === 'Direct Print')
  return idx >= 0 ? idx : 0
})

const directPrintLabel = computed(() => {
  const action = configurationStore.configuration.share.actions[directPrintConfigIndex.value]
  return action?.trigger.ui_trigger.title ?? 'Direct Print'
})

onBeforeMount(() => {
  showImage.value = true
})

const userConfirm = () => {
  remoteProcedureCall('/api/processing/confirm')
}

const userReject = () => {
  stateStore.imageFinishWithPrint = false
  remoteProcedureCall('/api/processing/reject')
}

const userDirectPrint = () => {
  stateStore.imageFinishWithPrint = true
  remoteProcedureCall('/api/processing/confirm')
}

const userAbort = () => {
  stateStore.imageFinishWithPrint = false
  remoteProcedureCall('/api/processing/abort')
}
</script>
