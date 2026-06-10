<template>
  <q-layout view="hhh Lpr ffr" @click="headercountdowntimer = false">
    <div v-if="currentMediaitem" class="fixed-full">
      <!-- v-if above is guard to hide all content that would fail if no currentMediaitem is avail -->
      <q-header class="bg-primary text-white">
        <HeaderCountdownTimer
          v-if="headercountdowntimer"
          :duration="configurationStore.configuration.uisettings.AUTOCLOSE_NEW_ITEM_ARRIVED"
          @trigger-timeout="onPresenterTimeout"
        ></HeaderCountdownTimer>
        <HeaderProcessing v-if="displayIndeterminateProgressbar"></HeaderProcessing>
      </q-header>

      <q-drawer v-if="showFilter" id="gallery-drawer-filters" v-model="rightDrawerOpen" class="q-pa-sm" side="right" overlay elevated>
        <DrawerFilter
          v-if="rightDrawerOpen"
          :id="currentMediaitem.id"
          :available-filter="available_filter"
          @trigger-apply-filter="doApplyFilter"
        ></DrawerFilter>
      </q-drawer>

      <q-page-container class="q-pa-none galleryimagedetail full-height">
        <q-page class="full-height">
          <template v-if="itemPresenterMode">
            <MediaItemPreviewViewer :item="currentMediaitem" style="user-select: none" />
          </template>
          <template v-else>
            <PageCarouselView
              :mediaitem-id="currentMediaitem.id"
              :sliced-images="mediacollectionStore.collection"
              @trigger-changed-item="onCarouselTransition"
              @click="rightDrawerOpen = false"
            />
          </template>

          <q-page-sticky position="top-right" class="q-ma-lg" v-if="configurationStore.configuration.uisettings.gallery_show_qrcode">
            <PageQrCode
              :urls="qrShareUrls"
              :text-above="configurationStore.configuration.uisettings.qrcode_text_above"
              :text-below="configurationStore.configuration.uisettings.qrcode_text_below"
              :linkQrCodes="configurationStore.configuration.uisettings.qrcode_link_codes"
            />
          </q-page-sticky>

          <OfflineShareOverlay
            v-if="showOfflineShare && currentMediaitem"
            :media-id="currentMediaitem.id"
            @close="showOfflineShare = false"
          />

          <PageToolbar
            :item="currentMediaitem"
            :item-presenter-mode="props.itemPresenterMode"
            :show-filter="!props.itemPresenterMode && configurationStore.configuration.uisettings.gallery_show_filter"
            :enable-filter="filterEnabled(currentMediaitem.media_type)"
            :show-share="
              configurationStore.configuration.uisettings.gallery_show_shareprint && configurationStore.configuration.share.sharing_enabled
            "
            :share-buttons="shareButtons"
            :show-delete="props.itemPresenterMode || configurationStore.configuration.uisettings.gallery_show_delete"
            :show-download="!props.itemPresenterMode && configurationStore.configuration.uisettings.gallery_show_download"
            :image_number="currentMediaitemNumber"
            :images_total="mediacollectionStore.collection_number_of_items"
            @trigger-toggle-display-filter="rightDrawerOpen = !rightDrawerOpen"
            @trigger-delete-mediaitem="doDeleteItem"
            @trigger-share-action="doShareAction"
            @trigger-offline-share="showOfflineShare = true"
          ></PageToolbar>

          <q-dialog v-model="showDialogShareActionWithParameters">
            <PageShareParameters
              :parameters="configurationStore.configuration.share.actions[shareActionWithParametersConfigIndex].processing.parameters"
              :parameters_dialog_caption="
                configurationStore.configuration.share.actions[shareActionWithParametersConfigIndex].processing.parameters_dialog_caption
              "
              :parameters_dialog_action_icon="
                configurationStore.configuration.share.actions[shareActionWithParametersConfigIndex].processing.parameters_dialog_action_icon
              "
              :parameters_dialog_action_label="
                configurationStore.configuration.share.actions[shareActionWithParametersConfigIndex].processing.parameters_dialog_action_label
              "
              :config_index="shareActionWithParametersConfigIndex"
              @trigger-share-action-with-parameters="doShareActionWithParameters"
            >
            </PageShareParameters>
          </q-dialog>
        </q-page>
      </q-page-container>
    </div>
    <div v-else>
      <!-- usually not visible but if page is called with wrong id or the page was not closed after an item is deleted -->
      <ItemNotAvailableError />
    </div>
  </q-layout>
</template>

<script setup lang="ts">
import { useConfigurationStore } from '../stores/configuration-store'
import { useMediacollectionStore } from '../stores/mediacollection-store'
import { useStateStore } from '../stores/state-store'
import { ref, onBeforeMount, computed, onMounted, watch } from 'vue'
import { default as PageShareParameters } from '../components/mediaviewer/PageShareParameters.vue'
import { default as PageToolbar } from '../components/mediaviewer/PageToolbar.vue'
import { default as HeaderCountdownTimer } from '../components/mediaviewer/HeaderCountdownTimer.vue'
import { default as HeaderProcessing } from '../components/mediaviewer/HeaderProcessing.vue'
import { default as DrawerFilter } from '../components/mediaviewer/DrawerFilter.vue'
import { default as PageQrCode } from '../components/mediaviewer/PageQrCode.vue'
import { default as PageCarouselView } from '../components/mediaviewer/PageCarouselView.vue'
import ItemNotAvailableError from '../components/ItemNotAvailableError.vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { type ShareSchema } from '../components/ShareTriggerButtons.vue'
import { remoteProcedureCall, _fetch } from '../util/fetch_api.js'
import { watchDebounced } from '@vueuse/core'
import { default as MediaItemPreviewViewer } from '../components/MediaItemPreviewViewer.vue'
import OfflineShareOverlay from '../components/OfflineShareOverlay.vue'
import { dismissItemPresenter } from '../util/dismiss-item-presenter'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const configurationStore = useConfigurationStore()
const mediacollectionStore = useMediacollectionStore()
const stateStore = useStateStore()
const selectedMediaitemId = ref('')
const rightDrawerOpen = ref(false)
const headercountdowntimer = ref(false) // likely not used here, move to newitempresenter and approval...
const displayIndeterminateProgressbar = ref(false)
const showDialogShareActionWithParameters = ref(false)
const shareActionWithParametersConfigIndex = ref(0)
const available_filter = ref([])
const qrShareUrls = ref([])
const showOfflineShare = ref(false)
const props = defineProps<{
  startTimer: boolean
  itemPresenterMode?: boolean
}>()

onBeforeMount(() => {
  selectedMediaitemId.value = route.params.id as string
  getAvailableFilter()
})
watch(route, (to) => {
  selectedMediaitemId.value = to.params.id as string
})
onMounted(() => {
  headercountdowntimer.value = props.startTimer
})

const onPresenterTimeout = () => {
  if (props.itemPresenterMode) {
    void dismissItemPresenter(router)
    return
  }
  void router.push({ path: '/' })
}
const onCarouselTransition = (newMediaitemId: string) => {
  selectedMediaitemId.value = newMediaitemId
}

const currentMediaitem = computed(() => {
  return getMediaitemById(selectedMediaitemId.value)
})

watchDebounced(
  selectedMediaitemId,
  async () => {
    try {
      const response = await _fetch(`/api/share/download/${selectedMediaitemId.value}`)
      if (!response.ok) {
        throw `Error: ${response.status} ${response.statusText}`
      }
      qrShareUrls.value = await response.json()
      console.log(qrShareUrls.value)
    } catch (error) {
      console.warn(error)
    }
  },

  { debounce: 600 },
)

const currentMediaitemNumber = computed(() => {
  return mediacollectionStore.collection.findIndex((mediaitem) => mediaitem.id == selectedMediaitemId.value) + 1
})
const showFilter = computed(() => {
  return configurationStore.configuration.uisettings.gallery_show_filter && filterEnabled(currentMediaitem.value.media_type)
})
const shareButtons = computed(() => {
  const result: ShareSchema[] = []

  const share_config = configurationStore.configuration.share.actions
  share_config.forEach((action, index: number) => {
    const trigger: ShareSchema = {
      config_index: index,
      handles_images_only: action.handles_images_only,
      show_button: action.trigger.ui_trigger.show_button,
      title: action.trigger.ui_trigger.title,
      icon: action.trigger.ui_trigger.icon,
    }

    result.push(trigger)
  })

  // post-capture screen: Direct Print only
  if (props.itemPresenterMode) {
    return result.filter((t) => t.show_button && t.title === 'Direct Print')
  }

  return result
})
const getMediaitemById = (id: string) => {
  return mediacollectionStore.collection.find((mediaitem) => mediaitem.id == id)
}

const filterEnabled = (media_type: string) => {
  return ['image'].includes(media_type)
}

const getAvailableFilter = async () => {
  try {
    const response = await _fetch('/api/filter/')

    available_filter.value = await response.json()
    console.log(available_filter.value)
  } catch (error) {
    console.warn(error)
  }
}
const doApplyFilter = (id: string, filter: string) => {
  displayIndeterminateProgressbar.value = true
  fetch(`/api/filter/${id}?filter=${filter}`, { method: 'PATCH' })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Server returned ' + response.status)
      }

      displayIndeterminateProgressbar.value = false
    })
    .catch((err) => {
      console.error(err)
      displayIndeterminateProgressbar.value = false
    })
}
const doDeleteItem = async (id: string) => {
  const item = currentMediaitem.value

  selectedMediaitemId.value = undefined
  mediacollectionStore.deleteItem(id)

  if (props.itemPresenterMode) {
    await router.replace('/')
    if (stateStore.lastCaptureAction) {
      remoteProcedureCall(`/api/${stateStore.lastCaptureAction}/${stateStore.lastCaptureConfigIndex}`)
    } else if (item?.media_type && ['image', 'collage', 'animation', 'video', 'multicamera'].includes(item.media_type)) {
      remoteProcedureCall(`/api/actions/${item.media_type}/0`)
    }
  } else {
    router.back()
  }
}
const doShareAction = (config_index: number) => {
  console.log('doShareAction', selectedMediaitemId.value, config_index)

  const askUserForInput = configurationStore.configuration.share.actions[config_index].processing.ask_user_for_parameter_input
  if (askUserForInput) {
    // advanced share, user input is requested, so show a dialog for the config_index that was already chosen by button click
    shareActionWithParametersConfigIndex.value = config_index
    showDialogShareActionWithParameters.value = true
  } else {
    // there are no parameters from user required here -> go on and use default values without further questions
    remoteProcedureCall(`/api/share/actions/${selectedMediaitemId.value}/${config_index}`, 'POST')
  }
}
const doShareActionWithParameters = async (config_index: number, input_data: unknown) => {
  console.warn(selectedMediaitemId.value, config_index, input_data)
  console.log(JSON.stringify(input_data))
  try {
    const response = await _fetch(`/api/share/actions/${selectedMediaitemId.value}/${config_index}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input_data),
    })
    console.log(response)
    if (!response.ok) {
      throw `Error: ${response.status} ${response.statusText}`
    }
  } catch (error) {
    console.error(error)
    $q.notify({
      message: error,
      caption: 'Request Error!',
      color: 'negative',
    })
  }
}
</script>
