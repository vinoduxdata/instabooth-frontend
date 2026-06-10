<template>
  <div>
    <q-card flat>
      <q-card-section>
        <div class="text-h6">Booth</div>
        <div class="text-caption text-grey-7">Hardware, cameras, GPIO, and runtime settings for this photobooth.</div>
      </q-card-section>
      <q-card-section v-if="activeEvent">
        <div class="text-subtitle2">Active event</div>
        <div>{{ activeEvent.name }} ({{ activeEvent.id }})</div>
        <div class="text-caption text-grey-7">{{ activeEvent.resolved_data_path }}</div>
      </q-card-section>
      <q-card-section v-else>
        <div class="text-caption text-warning">No active event configured.</div>
      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md q-mt-md">
      <div v-for="item in shortcuts" :key="item.label" class="col-12 col-sm-6 col-md-4">
        <q-card flat bordered class="cursor-pointer" @click="router.push(item.to)">
          <q-card-section class="row items-center no-wrap">
            <q-icon :name="item.icon" size="md" color="primary" class="q-mr-md" />
            <div>
              <div class="text-subtitle1">{{ item.label }}</div>
              <div class="text-caption text-grey-7">{{ item.caption }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { _fetch } from 'src/util/fetch_api'

const router = useRouter()
const activeEvent = ref<{ id: string; name: string; resolved_data_path?: string } | null>(null)

const shortcuts = [
  { to: { name: 'booth-config', params: { section: 'app' } }, icon: 'sym_o_settings', label: 'Configuration', caption: 'Cameras, GPIO, logging, secrets' },
  { to: '/admin/booth/files', icon: 'sym_o_folder_shared', label: 'Files', caption: 'Active event working directory' },
  { to: '/admin/booth/multicam', icon: 'sym_o_3d', label: 'Multicam', caption: 'Camera alignment and calibration' },
  { to: '/admin/booth/logs', icon: 'sym_o_list', label: 'Logs', caption: 'Server log output' },
]

onMounted(async () => {
  try {
    const response = await _fetch('/api/admin/events')
    if (response.ok) {
      const data = await response.json()
      activeEvent.value = data.active ?? null
    }
  } catch (err) {
    console.warn(err)
  }
})
</script>
