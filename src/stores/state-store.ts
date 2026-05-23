import { defineStore, acceptHMRUpdate } from 'pinia'

export const useStateStore = defineStore('state-store', {
  state: () => ({
    source: null as string,
    target: null as string,

    /** Last front-page capture action, used when retaking from item presenter. */
    lastCaptureAction: null as string | null,
    lastCaptureConfigIndex: 0 as number,
    /** Set when image approval "Direct Print" is chosen; triggers print after job completes. */
    imageFinishWithPrint: false,

    jobmodel: {
      typ: null as string,
      total_captures_to_take: null as number,
      remaining_captures_to_take: null as number,
      number_captures_taken: null as number,
      duration: 0 as number,
      present_mediaitem_id: null as string,
      approval_id: null as string,
      configuration_set: {},
    },
  }),
  actions: {},
  getters: {
    isStateIdle: (state) => (state.source === null && state.target === null) || state.target == 'finished',
    isStateReadyToCapture: (state) => state.target == 'ready',
    isStateCountdown: (state) => state.target == 'counting' && state.jobmodel.duration > 0,
    isStateRecording: (state) => state.target == 'capture' && state.jobmodel.typ == 'video',
    isStateProcessing: (state) => state.target == 'completed',
    isStateCapture: (state) => state.target == 'capture',
    isStateApproval: (state) => state.target == 'approval',
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStateStore, import.meta.hot))
}
