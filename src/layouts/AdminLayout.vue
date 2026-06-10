<template>
  <q-layout id="admin-layout" view="hHh lpR fFf" class="instabooth-admin-layout">
    <q-header class="instabooth-admin-header">
      <q-toolbar class="q-pa-none">
        <q-btn no-caps flat class="q-mx-sm" stack to="/" icon="sym_o_arrow_back_ios_new" :label="$t('BTN_LABEL_BACK')" />
        <q-separator vertical />
        <q-tabs no-caps mobile-arrows shrink stretch class="instabooth-admin-tabs">
          <q-route-tab to="/admin" exact icon="sym_o_dashboard" :label="$t('TAB_LABEL_DASHBOARD')" />
          <q-route-tab to="/admin/booth" icon="sym_o_storefront" label="Booth" />
          <q-route-tab to="/admin/user" icon="sym_o_group" label="Users" />
          <q-route-tab to="/admin/event-template" icon="sym_o_library_books" label="Event Templates" />
          <q-route-tab to="/admin/event" icon="sym_o_event" label="Events" />
          <q-btn-dropdown auto-close stretch flat label="">
            <q-list class="instabooth-admin-dropdown">
              <q-item to="/admin/1ststart">
                <q-item-section avatar> <q-icon name="sym_o_info" /> </q-item-section>
                <q-item-section>
                  <q-item-label>{{ $t('1st Start') }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item to="/admin/help">
                <q-item-section avatar> <q-icon name="sym_o_help" /> </q-item-section>
                <q-item-section>
                  <q-item-label>{{ $t('TAB_LABEL_HELP') }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item href="/api/doc" target="_blank">
                <q-item-section avatar> <q-icon name="sym_o_api" /> </q-item-section>
                <q-item-section>
                  <q-item-label>{{ $t('Rest-API documentation') }}</q-item-label>
                </q-item-section>
                <q-item-section side> <q-icon name="sym_o_open_in_new" /> </q-item-section>
              </q-item>
              <q-item href="https://photobooth-app.org/" target="_blank">
                <q-item-section avatar> <q-icon name="sym_o_link" /> </q-item-section>
                <q-item-section>
                  <!--eslint-disable-next-line @intlify/vue-i18n/no-raw-text-->
                  <q-item-label>photobooth-app.org</q-item-label>
                </q-item-section>
                <q-item-section side> <q-icon name="sym_o_open_in_new" /> </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </q-tabs>

        <q-toolbar-title align="right" class="q-mr-lg instabooth-admin-title">
          <span>{{ $t('TITLE_ADMIN_CENTER') }}</span>
        </q-toolbar-title>

        <div>
          <a href="https://photobooth-app.org/" target="_new" class="q-mr-lg">
            <img src="icons/logo-notext-white-transparent.png" style="max-height: 40px" />
          </a>
        </div>

        <div>
          <q-btn flat no-caps class="q-mx-sm" stack icon="sym_o_logout" :label="$t('Sign out')" @click="click_logout" />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { logout } from '../util/auth'
import { useRouter } from 'vue-router'
const router = useRouter()

const click_logout = () => {
  logout()
  router.push('/')
}
</script>

<style lang="scss" scoped>
.instabooth-admin-title span {
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: linear-gradient(90deg, #e9d5ff 0%, #f9a8d4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
