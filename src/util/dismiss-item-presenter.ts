import type { Router } from 'vue-router'

import { remoteProcedureCall } from './fetch_api.js'
import { useStateStore } from '../stores/state-store'

/** Leave the post-capture presenter and return to the booth home screen. */
export async function dismissItemPresenter(router: Router) {
  const stateStore = useStateStore()
  const mediaId = stateStore.jobmodel.present_mediaitem_id

  if (mediaId) {
    stateStore.presenterDismissedFor = mediaId
  }

  try {
    await remoteProcedureCall('/api/processing/next')
  } catch {
    // Job may already be finished; still return home.
  }

  if (router.currentRoute.value.path !== '/') {
    await router.replace('/')
  }
}
