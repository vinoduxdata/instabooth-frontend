<template>
  <q-page id="admin-user-page" padding>
    <q-card flat>
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-h6">Users</div>
          <div class="text-caption text-grey-7">Manage admin dashboard accounts.</div>
        </div>
        <q-btn no-caps color="green" icon="sym_o_person_add" label="Add user" @click="openCreateDialog" />
      </q-card-section>
    </q-card>

    <q-table flat bordered class="q-mt-md" :rows="users" :columns="columns" row-key="username" :loading="loading">
      <template #body-cell-enabled="props">
        <q-td :props="props">
          <q-badge :color="props.row.enabled ? 'positive' : 'grey'" :label="props.row.enabled ? 'enabled' : 'disabled'" />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn no-caps flat color="primary" label="Edit" @click="openEditDialog(props.row)" />
          <q-btn no-caps flat color="negative" label="Delete" :disable="users.length <= 1" @click="confirmDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="showDialog">
      <q-card style="min-width: 360px" flat>
        <q-card-section>
          <div class="text-h6">{{ editingUser ? 'Edit user' : 'Create user' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.username" filled label="Username" :disable="!!editingUser" />
          <q-input v-model="form.full_name" filled label="Full name" />
          <q-input v-model="form.password" filled type="password" :label="editingUser ? 'New password (optional)' : 'Password'" />
          <q-toggle v-model="form.enabled" label="Enabled" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn no-caps flat label="Cancel" v-close-popup />
          <q-btn no-caps color="primary" :label="editingUser ? 'Save' : 'Create'" @click="saveUser" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Notify, Dialog } from 'quasar'
import { _fetch } from 'src/util/fetch_api'

interface AdminUserRow {
  username: string
  full_name?: string | null
  role: string
  enabled: boolean
}

const users = ref<AdminUserRow[]>([])
const loading = ref(false)
const showDialog = ref(false)
const editingUser = ref<AdminUserRow | null>(null)
const form = reactive({
  username: '',
  full_name: '',
  password: '',
  enabled: true,
})

const columns = [
  { name: 'username', label: 'Username', field: 'username', align: 'left' as const },
  { name: 'full_name', label: 'Name', field: 'full_name', align: 'left' as const },
  { name: 'role', label: 'Role', field: 'role', align: 'left' as const },
  { name: 'enabled', label: 'Status', field: 'enabled', align: 'left' as const },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' as const },
]

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await _fetch('/api/admin/users')
    if (!response.ok) throw new Error(`Server returned ${response.status}`)
    const data = await response.json()
    users.value = data.users ?? []
  } catch (err) {
    Notify.create({ message: String(err), color: 'negative' })
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.username = ''
  form.full_name = ''
  form.password = ''
  form.enabled = true
}

const openCreateDialog = () => {
  editingUser.value = null
  resetForm()
  showDialog.value = true
}

const openEditDialog = (user: AdminUserRow) => {
  editingUser.value = user
  form.username = user.username
  form.full_name = user.full_name ?? ''
  form.password = ''
  form.enabled = user.enabled
  showDialog.value = true
}

const saveUser = async () => {
  try {
    if (editingUser.value) {
      const body: Record<string, unknown> = {
        full_name: form.full_name || null,
        enabled: form.enabled,
      }
      if (form.password) body.password = form.password
      const response = await _fetch(`/api/admin/users/${encodeURIComponent(form.username)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) throw new Error(await response.text())
    } else {
      if (!form.username || !form.password) {
        Notify.create({ message: 'Username and password are required', color: 'negative' })
        return
      }
      const response = await _fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          full_name: form.full_name || null,
          enabled: form.enabled,
        }),
      })
      if (!response.ok) throw new Error(await response.text())
    }
    showDialog.value = false
    await loadUsers()
    Notify.create({ message: 'User saved', color: 'positive' })
  } catch (err) {
    Notify.create({ message: String(err), color: 'negative' })
  }
}

const confirmDelete = (user: AdminUserRow) => {
  Dialog.create({
    title: 'Delete user',
    message: `Delete user "${user.username}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const response = await _fetch(`/api/admin/users/${encodeURIComponent(user.username)}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await response.text())
      await loadUsers()
      Notify.create({ message: 'User deleted', color: 'positive' })
    } catch (err) {
      Notify.create({ message: String(err), color: 'negative' })
    }
  })
}

onMounted(loadUsers)
</script>
