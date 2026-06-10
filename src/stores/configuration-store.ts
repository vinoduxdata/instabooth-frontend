import { defineStore, acceptHMRUpdate } from 'pinia'
import { setCssVar, Dark } from 'quasar'
import type { components } from '../dto/api'

const STATES = {
  //https://stackoverflow.com/a/75060220
  INIT: 0,
  DONE: 1,
  WIP: 2,
  ERROR: 3,
}

export const useConfigurationStore = defineStore('configuration-store', {
  state: () => ({
    // all config settings. used by app as well as to configure in admin and update to server.
    // configuration: {} as AppConfig,
    configuration: {} as components['schemas']['AppConfig'],

    storeState: STATES.INIT,
  }),
  actions: {
    postConfigchanged() {
      // InstaBooth brand theme — purple galaxy palette across kiosk + admin
      setCssVar('primary', '#a855f7')
      setCssVar('secondary', '#ec4899')
      setCssVar('accent', '#67e8f9')
      Dark.set(true)
      document.documentElement.classList.add('instabooth-app')
    },

    initStore(forceReload = false) {
      console.log('loading configuration store')
      if (this.isLoaded && forceReload == false) {
        console.log('settings loaded once already, skipping')
        return
      }

      this.storeState = STATES.WIP

      fetch('/api/config')
        .then((response) => response.json())
        .then((data) => {
          console.log(data)

          this.configuration = data

          this.postConfigchanged()

          this.storeState = STATES.DONE
        })
        .catch((e) => {
          console.log('get config failed', e)
          console.log(e)
          this.storeState = STATES.ERROR
        })
    },
  },
  getters: {
    isLoaded(): boolean {
      return this.storeState === STATES.DONE
    },
    isLoading(): boolean {
      return this.storeState === STATES.WIP
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useConfigurationStore, import.meta.hot))
}
