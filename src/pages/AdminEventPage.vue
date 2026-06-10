<template>
  <q-page id="admin-event-page" padding>
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <q-card flat>
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-h6">Events</div>
              <div v-if="activeEvent" class="text-caption text-grey-7">
                Active: {{ activeEvent.name }} ({{ activeEvent.id }})
              </div>
              <div v-else-if="!adminEnabled" class="text-caption text-warning">Multi-event admin is not configured.</div>
            </div>
            <q-btn no-caps color="primary" icon="sym_o_add" label="Create event" :disable="!adminEnabled" @click="openCreateDialog" />
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12">
        <q-table flat bordered :rows="events" :columns="columns" row-key="id" :loading="loading">
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="statusColor(props.row.status)" :label="props.row.status" />
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                v-if="props.row.status !== 'deleted'"
                no-caps
                flat
                color="primary"
                label="Config"
                :to="{ name: 'event-config', params: { eventId: props.row.id, section: 'app' } }"
              />
              <q-btn
                v-if="props.row.status !== 'deleted'"
                no-caps
                flat
                color="primary"
                label="Files"
                :to="`/admin/event/${props.row.id}/files`"
              />
              <q-btn
                v-if="props.row.status !== 'active' && props.row.status !== 'deleted'"
                no-caps
                flat
                color="primary"
                label="Activate"
                @click="confirmActivate(props.row)"
              />
              <q-btn
                v-if="props.row.status === 'draft'"
                no-caps
                flat
                color="primary"
                label="Publish"
                @click="updateStatus(props.row.id, 'published')"
              />
              <q-btn
                v-if="props.row.status === 'active'"
                no-caps
                flat
                color="orange"
                label="Pause"
                @click="updateStatus(props.row.id, 'pause')"
              />
              <q-btn
                v-if="['active', 'pause', 'published'].includes(props.row.status)"
                no-caps
                flat
                color="grey"
                label="Done"
                @click="updateStatus(props.row.id, 'done')"
              />
              <q-btn
                v-if="props.row.status === 'done'"
                no-caps
                flat
                color="brown"
                label="Archive"
                @click="updateStatus(props.row.id, 'archive')"
              />
              <q-btn
                v-if="['draft', 'published', 'archive'].includes(props.row.status)"
                no-caps
                flat
                color="negative"
                label="Delete"
                @click="deleteEvent(props.row.id)"
              />
            </q-td>
          </template>
        </q-table>
      </div>
    </div>

    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 420px; max-width: 560px">
        <q-card-section>
          <div class="text-h6">Create event</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="createForm.name" label="Event name" autofocus />
          <q-select
            v-model="createForm.template_id"
            :options="templateOptions"
            label="Template"
            emit-value
            map-options
            @update:model-value="onTemplateChange"
          />

          <div v-if="selectedTemplateEventInputs.length > 0">
            <div class="text-subtitle2 q-mb-sm">Event inputs</div>
            <div v-for="(field, index) in selectedTemplateEventInputs" :key="index" class="q-mb-md">
              <q-input
                v-if="field.type === 'text'"
                v-model="createForm.event_input_values[field.name]"
                dense
                filled
                :label="fieldLabel(field)"
              />
              <div v-else>
                <q-file
                  v-model="createForm.event_input_files[field.name]"
                  dense
                  filled
                  :label="fieldLabel(field)"
                  accept="image/*,.png,.jpg,.jpeg,.webp,.svg"
                  clearable
                >
                  <template #prepend>
                    <q-icon name="sym_o_upload_file" />
                  </template>
                </q-file>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn no-caps flat label="Cancel" v-close-popup />
          <q-btn no-caps color="primary" label="Create" :loading="creating" @click="createEvent" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showActivateDialog">
      <q-card style="min-width: 420px">
        <q-card-section class="row items-center">
          <q-avatar icon="sym_o_event" color="primary" text-color="white" />
          <span class="q-ml-sm">
            Activate <strong>{{ selectedEvent?.name }}</strong>? The booth will restart and load this event's data folder.
          </span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn no-caps flat label="Cancel" v-close-popup />
          <q-btn no-caps color="primary" label="Activate and restart" :loading="activating" @click="activateSelectedEvent" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { _fetch } from '../util/fetch_api'

type EventStatus = 'draft' | 'published' | 'active' | 'pause' | 'done' | 'archive' | 'deleted'

interface TemplateEventInputField {
  name: string
  type: 'text' | 'file'
  required: boolean
}

interface EventRecord {
  id: string
  name: string
  template_id: string
  status: EventStatus
  data_path: string
}

interface TemplateRecord {
  id: string
  name: string
  event_inputs?: TemplateEventInputField[]
}

const $q = useQuasar()
const loading = ref(false)
const creating = ref(false)
const activating = ref(false)
const adminEnabled = ref(false)
const events = ref<EventRecord[]>([])
const activeEvent = ref<EventRecord | null>(null)
const templates = ref<TemplateRecord[]>([])
const showCreateDialog = ref(false)
const showActivateDialog = ref(false)
const selectedEvent = ref<EventRecord | null>(null)

const createForm = ref({
  name: '',
  template_id: '',
  event_input_values: {} as Record<string, string>,
  event_input_files: {} as Record<string, File | null>,
})

const selectedTemplateEventInputs = ref<TemplateEventInputField[]>([])

const columns = [
  { name: 'name', label: 'Name', field: 'name', align: 'left' as const, sortable: true },
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const },
  { name: 'template_id', label: 'Template', field: 'template_id', align: 'left' as const },
  { name: 'status', label: 'Status', field: 'status', align: 'left' as const },
  { name: 'data_path', label: 'Data path', field: 'data_path', align: 'left' as const },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' as const },
]

const templateOptions = ref<{ label: string; value: string }[]>([])

const fieldLabel = (field: TemplateEventInputField) => `${field.name}${field.required ? ' *' : ''}`

const resetCreateFormInputs = () => {
  createForm.value.event_input_values = {}
  createForm.value.event_input_files = {}
  selectedTemplateEventInputs.value = []
}

const onTemplateChange = async (templateId: string) => {
  resetCreateFormInputs()
  if (!templateId) return
  try {
    const template = await parseJson(await _fetch(`/api/admin/event-templates/${encodeURIComponent(templateId)}`))
    selectedTemplateEventInputs.value = template.event_inputs || []
    for (const field of selectedTemplateEventInputs.value) {
      if (field.type === 'text') {
        createForm.value.event_input_values[field.name] = ''
      } else {
        createForm.value.event_input_files[field.name] = null
      }
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: `Failed to load template fields: ${error}` })
  }
}

const statusColor = (status: EventStatus) => {
  switch (status) {
    case 'active':
      return 'green'
    case 'pause':
      return 'orange'
    case 'published':
      return 'blue'
    case 'draft':
      return 'grey'
    case 'done':
      return 'purple'
    case 'archive':
      return 'brown'
    case 'deleted':
      return 'negative'
    default:
      return 'grey'
  }
}

const parseJson = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.json()
}

const loadData = async () => {
  loading.value = true
  try {
    const enabledRes = await parseJson(await _fetch('/api/admin/events/enabled'))
    adminEnabled.value = enabledRes.enabled

    const [eventsRes, templatesRes] = await Promise.all([
      parseJson(await _fetch('/api/admin/events')),
      parseJson(await _fetch('/api/admin/event-templates')),
    ])

    events.value = eventsRes.events
    activeEvent.value = eventsRes.active
    templates.value = templatesRes.templates
    templateOptions.value = templatesRes.templates
      .filter((item: TemplateRecord) => item.id !== 'default')
      .map((item: TemplateRecord) => ({
        label: item.name || item.id,
        value: item.id,
      }))
    if (
      (!createForm.value.template_id || createForm.value.template_id === 'default') &&
      templateOptions.value.length > 0
    ) {
      createForm.value.template_id = templateOptions.value[0].value
    }
    await onTemplateChange(createForm.value.template_id)
  } catch (error) {
    $q.notify({ type: 'negative', message: `Failed to load events: ${error}` })
  } finally {
    loading.value = false
  }
}

const openCreateDialog = async () => {
  if (!createForm.value.template_id && templateOptions.value.length > 0) {
    createForm.value.template_id = templateOptions.value[0].value
  }
  await onTemplateChange(createForm.value.template_id)
  showCreateDialog.value = true
}

const validateCreateForm = () => {
  if (!createForm.value.name.trim()) {
    $q.notify({ type: 'warning', message: 'Event name is required' })
    return false
  }
  for (const field of selectedTemplateEventInputs.value) {
    if (!field.required) continue
    if (field.type === 'text' && !createForm.value.event_input_values[field.name]?.trim()) {
      $q.notify({ type: 'warning', message: `${field.name} is required` })
      return false
    }
    if (field.type === 'file' && !createForm.value.event_input_files[field.name]) {
      $q.notify({ type: 'warning', message: `${field.name} file is required` })
      return false
    }
  }
  return true
}

const uploadEventInputFile = async (eventId: string, fieldName: string, file: File) => {
  const body = new FormData()
  body.append('file', file)
  await parseJson(
    await _fetch(
      `/api/admin/events/${encodeURIComponent(eventId)}/event-inputs/${encodeURIComponent(fieldName)}/file`,
      { method: 'POST', body },
    ),
  )
}

const createEvent = async () => {
  if (!validateCreateForm()) return
  creating.value = true
  try {
    const eventInputs = selectedTemplateEventInputs.value
      .filter((field) => field.type === 'text')
      .map((field) => ({
        name: field.name,
        value: createForm.value.event_input_values[field.name]?.trim() || null,
      }))

    const created = await parseJson(
      await _fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.value.name.trim(),
          template_id: createForm.value.template_id,
          event_inputs: eventInputs,
        }),
      }),
    )

    for (const field of selectedTemplateEventInputs.value) {
      if (field.type !== 'file') continue
      const file = createForm.value.event_input_files[field.name]
      if (file) {
        await uploadEventInputFile(created.id, field.name, file)
      }
    }

    showCreateDialog.value = false
    createForm.value.name = ''
    resetCreateFormInputs()
    await loadData()
    $q.notify({ type: 'positive', message: 'Event created' })
  } catch (error) {
    $q.notify({ type: 'negative', message: `Create failed: ${error}` })
  } finally {
    creating.value = false
  }
}

const updateStatus = async (eventId: string, status: EventStatus) => {
  try {
    await parseJson(
      await _fetch(`/api/admin/events/${eventId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    )
    await loadData()
  } catch (error) {
    $q.notify({ type: 'negative', message: `Status update failed: ${error}` })
  }
}

const deleteEvent = async (eventId: string) => {
  try {
    await parseJson(
      await _fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      }),
    )
    await loadData()
    $q.notify({ type: 'positive', message: 'Event deleted' })
  } catch (error) {
    $q.notify({ type: 'negative', message: `Delete failed: ${error}` })
  }
}

const confirmActivate = (event: EventRecord) => {
  selectedEvent.value = event
  showActivateDialog.value = true
}

const activateSelectedEvent = async () => {
  if (!selectedEvent.value) return
  activating.value = true
  try {
    await parseJson(
      await _fetch(`/api/admin/events/${selectedEvent.value.id}/activate?restart=true`, {
        method: 'POST',
      }),
    )
  } catch (error) {
    $q.notify({ type: 'negative', message: `Activate failed: ${error}` })
    activating.value = false
  }
}

onMounted(loadData)
</script>
