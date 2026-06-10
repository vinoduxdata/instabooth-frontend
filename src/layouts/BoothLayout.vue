<template>
  <div class="booth-layout q-pa-md">
    <q-tabs no-caps mobile-arrows dense align="left" class="q-mb-md">
      <q-route-tab to="/admin/booth" exact icon="sym_o_storefront" label="Overview" />
      <q-route-tab :to="{ name: 'booth-config', params: { section: 'app' } }" icon="sym_o_settings" :label="$t('TAB_LABEL_CONFIG')" />
      <q-route-tab to="/admin/booth/files" icon="sym_o_folder_shared" :label="$t('TAB_LABEL_FILES')" />
      <q-route-tab to="/admin/booth/multicam" icon="sym_o_3d" :label="$t('TAB_MULTICAM')" />
      <q-route-tab to="/admin/booth/logs" icon="sym_o_list" :label="$t('Logs')" />
    </q-tabs>
    <router-view />
  </div>
</template>

<script setup lang="ts"></script>
