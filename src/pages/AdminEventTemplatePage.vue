<template>
  <q-page id="admin-event-template-page" padding>
    <q-card flat>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6">Event templates</div>
          <div class="text-caption text-grey-7">Git-synced templates in instabooth-admin</div>
        </div>
        <q-btn no-caps color="green" icon="sym_o_add" label="Create template" @click="openCreateDialog" />
      </q-card-section>
    </q-card>

    <q-table flat bordered class="q-mt-md" :rows="templates" :columns="columns" row-key="id" :loading="loading">
      <template #body-cell-inputs="props">
        <q-td :props="props">
          <span v-if="!props.row.inputs?.length" class="text-grey-6">—</span>
          <q-badge v-else color="blue-grey" :label="String(props.row.inputs.length)" />
        </q-td>
      </template>
      <template #body-cell-event_inputs="props">
        <q-td :props="props">
          <span v-if="!props.row.event_inputs?.length" class="text-grey-6">—</span>
          <q-badge v-else color="teal" :label="String(props.row.event_inputs.length)" />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn no-caps flat color="primary" label="Edit" @click="openEditDialog(props.row)" />
          <q-btn
            no-caps
            flat
            color="primary"
            label="Config"
            :to="{ name: 'template-config', params: { templateId: props.row.id, section: 'app' } }"
          />
          <q-btn no-caps flat color="primary" label="Files" :to="`/admin/event-template/${props.row.id}/files`" />
          <q-btn no-caps flat color="negative" label="Delete" @click="deleteTemplate(props.row.id)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 520px; max-width: 720px">
        <q-card-section>
          <div class="text-h6">{{ editingId ? 'Edit template' : 'Create template' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.id" label="Template ID" hint="lowercase letters, numbers, hyphens" :disable="!!editingId" />
          <q-input v-model="form.name" label="Template name" />
          <q-input v-model="form.description" label="Description" type="textarea" autogrow />

          <div>
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle2">Template Inputs</div>
              <q-btn no-caps flat color="primary" icon="sym_o_add" label="Add template input" @click="addInputRow" />
            </div>

            <div v-if="form.inputs.length === 0" class="text-caption text-grey-7 q-mb-sm">
              Values and assets stored on this template (e.g. collage frames).
            </div>

            <q-card v-for="(input, index) in form.inputs" :key="index" flat bordered class="q-mb-sm">
              <q-card-section class="q-gutter-sm">
                <div class="row q-col-gutter-sm items-start">
                  <div class="col-5">
                    <q-input v-model="input.name" dense filled label="Name" placeholder="Bridename" />
                  </div>
                  <div class="col-4">
                    <q-select
                      v-model="input.type"
                      dense
                      filled
                      label="Type"
                      :options="inputTypeOptions"
                      emit-value
                      map-options
                    />
                  </div>
                  <div class="col-3 text-right">
                    <q-btn no-caps flat color="negative" icon="sym_o_delete" label="Remove" @click="removeInputRow(index)" />
                  </div>
                </div>

                <q-input
                  v-if="input.type === 'text'"
                  v-model="input.value"
                  dense
                  filled
                  label="Value"
                  placeholder="Text saved with this template"
                />

                <div v-else class="q-gutter-xs">
                  <q-file
                    v-model="input.pendingFile"
                    dense
                    filled
                    label="Upload file"
                    accept="image/*,.png,.jpg,.jpeg,.webp,.svg"
                    clearable
                  >
                    <template #prepend>
                      <q-icon name="sym_o_upload_file" />
                    </template>
                  </q-file>
                  <div v-if="input.value" class="text-caption text-grey-7">Saved: {{ input.value }}</div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div>
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle2">Event Inputs</div>
              <q-btn no-caps flat color="primary" icon="sym_o_add" label="Add event input" @click="addEventInputRow" />
            </div>

            <div v-if="form.event_inputs.length === 0" class="text-caption text-grey-7 q-mb-sm">
              Fields the operator must fill in when creating an event from this template.
            </div>

            <q-card v-for="(input, index) in form.event_inputs" :key="`event-${index}`" flat bordered class="q-mb-sm">
              <q-card-section class="q-gutter-sm">
                <div class="row q-col-gutter-sm items-center">
                  <div class="col-5">
                    <q-input v-model="input.name" dense filled label="Name" placeholder="Bride Name" />
                  </div>
                  <div class="col-3">
                    <q-select
                      v-model="input.type"
                      dense
                      filled
                      label="Type"
                      :options="inputTypeOptions"
                      emit-value
                      map-options
                    />
                  </div>
                  <div class="col-2">
                    <q-toggle v-model="input.required" dense label="Required" />
                  </div>
                  <div class="col-2 text-right">
                    <q-btn no-caps flat color="negative" icon="sym_o_delete" label="Remove" @click="removeEventInputRow(index)" />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn no-caps flat label="Cancel" v-close-popup />
          <q-btn no-caps color="green" :label="editingId ? 'Save' : 'Create'" :loading="saving" @click="saveTemplate" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { _fetch } from '../util/fetch_api'

type TemplateInputType = 'text' | 'file'

interface TemplateInputField {
  name: string
  type: TemplateInputType
  value: string
  pendingFile?: File | null
}

interface TemplateEventInputField {
  name: string
  type: TemplateInputType
  required: boolean
}

interface TemplateRecord {
  id: string
  name: string
  description?: string
  inputs?: TemplateInputField[]
  event_inputs?: TemplateEventInputField[]
}

const $q = useQuasar()
const templates = ref<TemplateRecord[]>([])
const loading = ref(false)
const showDialog = ref(false)
const saving = ref(false)
const editingId = ref<string | null>(null)

const inputTypeOptions = [
  { label: 'Text', value: 'text' },
  { label: 'File', value: 'file' },
]

const emptyForm = () => ({
  id: '',
  name: '',
  description: '',
  inputs: [] as TemplateInputField[],
  event_inputs: [] as TemplateEventInputField[],
})

const form = ref(emptyForm())

const columns = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' as const, sortable: true },
  { name: 'name', label: 'Name', field: 'name', align: 'left' as const, sortable: true },
  { name: 'description', label: 'Description', field: 'description', align: 'left' as const },
  { name: 'inputs', label: 'Template Inputs', field: 'inputs', align: 'left' as const },
  { name: 'event_inputs', label: 'Event Inputs', field: 'event_inputs', align: 'left' as const },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' as const },
]

const parseJson = async (response: Response) => {
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `${response.status} ${response.statusText}`)
  }
  return response.json()
}

const loadTemplates = async () => {
  loading.value = true
  try {
    const response = await parseJson(await _fetch('/api/admin/event-templates'))
    templates.value = response.templates
  } catch (error) {
    $q.notify({ type: 'negative', message: `Failed to load templates: ${error}` })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = emptyForm()
  editingId.value = null
}

const openCreateDialog = () => {
  resetForm()
  showDialog.value = true
}

const openEditDialog = async (template: TemplateRecord) => {
  resetForm()
  editingId.value = template.id
  try {
    const full = await parseJson(await _fetch(`/api/admin/event-templates/${encodeURIComponent(template.id)}`))
    form.value = {
      id: full.id,
      name: full.name,
      description: full.description || '',
      inputs: (full.inputs || []).map((item: TemplateInputField) => ({
        name: item.name,
        type: item.type,
        value: item.value || '',
        pendingFile: null,
      })),
      event_inputs: (full.event_inputs || []).map((item: TemplateEventInputField) => ({
        name: item.name,
        type: item.type,
        required: !!item.required,
      })),
    }
    showDialog.value = true
  } catch (error) {
    $q.notify({ type: 'negative', message: `Failed to load template: ${error}` })
  }
}

const addInputRow = () => {
  form.value.inputs.push({ name: '', type: 'text', value: '', pendingFile: null })
}

const removeInputRow = (index: number) => {
  form.value.inputs.splice(index, 1)
}

const addEventInputRow = () => {
  form.value.event_inputs.push({ name: '', type: 'text', required: true })
}

const removeEventInputRow = (index: number) => {
  form.value.event_inputs.splice(index, 1)
}

const validateNamedFields = (fields: { name: string }[], label: string) => {
  const names = new Set<string>()
  for (const input of fields) {
    if (!input.name.trim()) {
      $q.notify({ type: 'warning', message: `Each ${label} needs a name` })
      return false
    }
    const key = input.name.trim().toLowerCase()
    if (names.has(key)) {
      $q.notify({ type: 'warning', message: `Duplicate ${label} name: ${input.name}` })
      return false
    }
    names.add(key)
  }
  return true
}

const validateForm = () => {
  if (!form.value.id.trim() || !form.value.name.trim()) {
    $q.notify({ type: 'warning', message: 'Template ID and name are required' })
    return false
  }
  return validateNamedFields(form.value.inputs, 'template input') && validateNamedFields(form.value.event_inputs, 'event input')
}

const buildEventInputsPayload = () =>
  form.value.event_inputs.map((input) => ({
    name: input.name.trim(),
    type: input.type,
    required: input.required,
  }))

const buildInputsPayload = () =>
  form.value.inputs.map((input) => ({
    name: input.name.trim(),
    type: input.type,
    value: input.type === 'text' ? input.value || null : input.value || null,
  }))

const uploadInputFile = async (templateId: string, input: TemplateInputField) => {
  if (!input.pendingFile) return input.value || null
  const body = new FormData()
  body.append('file', input.pendingFile)
  const response = await _fetch(
    `/api/admin/event-templates/${encodeURIComponent(templateId)}/inputs/${encodeURIComponent(input.name.trim())}/file`,
    { method: 'POST', body },
  )
  const result = await parseJson(response)
  return result.path as string
}

const saveTemplate = async () => {
  if (!validateForm()) return
  saving.value = true
  try {
    const templateId = form.value.id.trim()
    const payload = {
      id: templateId,
      name: form.value.name.trim(),
      description: form.value.description,
      inputs: buildInputsPayload(),
      event_inputs: buildEventInputsPayload(),
    }

    if (editingId.value) {
      await parseJson(
        await _fetch(`/api/admin/event-templates/${encodeURIComponent(templateId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: payload.name,
            description: payload.description,
            inputs: payload.inputs,
            event_inputs: payload.event_inputs,
          }),
        }),
      )
      for (const input of form.value.inputs) {
        if (input.type === 'file' && input.pendingFile) {
          await uploadInputFile(templateId, input)
        }
      }
      $q.notify({ type: 'positive', message: 'Template updated' })
    } else {
      await parseJson(
        await _fetch('/api/admin/event-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }),
      )
      for (const input of form.value.inputs) {
        if (input.type === 'file' && input.pendingFile) {
          await uploadInputFile(templateId, input)
        }
      }
      $q.notify({ type: 'positive', message: 'Template created' })
    }

    showDialog.value = false
    resetForm()
    await loadTemplates()
  } catch (error) {
    $q.notify({ type: 'negative', message: `Save failed: ${error}` })
  } finally {
    saving.value = false
  }
}

const deleteTemplate = async (templateId: string) => {
  $q.dialog({
    title: 'Delete template',
    message: `Delete template "${templateId}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await parseJson(
        await _fetch(`/api/admin/event-templates/${encodeURIComponent(templateId)}`, {
          method: 'DELETE',
        }),
      )
      await loadTemplates()
      $q.notify({ type: 'positive', message: 'Template deleted' })
    } catch (error) {
      $q.notify({ type: 'negative', message: `Delete failed: ${error}` })
    }
  })
}

onMounted(loadTemplates)
</script>
