import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../shared/api/http'
import { Card } from '../../shared/components/Card'
import { Page } from '../../shared/components/Page'
import { Pagination } from '../../shared/components/Pagination'
import { QueryStatus } from '../../shared/components/QueryStatus'
import { downloadCsv } from '../../shared/utils/csv'
import { useAuth } from '../auth/AuthContext'
import { useAllUsers } from '../users/hooks'
import { ClientForm } from './components/ClientForm'
import { ClientTable } from './components/ClientTable'
import { emptyClientForm, toCreateClientDto, type ClientFormValues } from './clientForm'
import { exportAllClients, useClients, useCreateClient } from './hooks'

export function ClientsPage() {
  const { token, user } = useAuth()
  const { t } = useTranslation()

  const [page, setPage] = useState(1)
  const clientsQuery = useClients({ page })
  const managersQuery = useAllUsers()
  const createClient = useCreateClient()

  const [form, setForm] = useState<ClientFormValues>(emptyClientForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const clients = clientsQuery.data?.data ?? []
  const meta = clientsQuery.data?.meta
  const managers = managersQuery.data?.data ?? []

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    try {
      await createClient.mutateAsync(toCreateClientDto(form))
      setForm(emptyClientForm)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('clients.createError'))
    }
  }

  const exportClients = async () => {
    if (!token) return
    setIsExporting(true)
    try {
      const all = await exportAllClients(token)
      downloadCsv(
        'clients.csv',
        all.map((c) => ({
          firstName: c.firstName,
          lastName: c.lastName,
          phone: c.phone,
          email: c.email ?? '',
          salonName: c.salonName ?? '',
          position: c.position ?? '',
          address: c.address ?? '',
          assignedTo: c.assignedTo ? `${c.assignedTo.firstName} ${c.assignedTo.lastName}` : '',
        })),
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Page title={t('clients.title')}>
      <Card title={t('clients.addTitle')}>
        <ClientForm
          values={form}
          onChange={setForm}
          managers={managers}
          currentUserFirstName={user?.firstName}
          onSubmit={handleSubmit}
          isSubmitting={createClient.isPending}
          submitLabel={t('clients.submit')}
          submittingLabel={t('clients.submitting')}
          error={formError}
        />
      </Card>

      <Card
        title={t('clients.listTitle')}
        actions={
          clients.length > 0 && (
            <button type="button" onClick={exportClients} disabled={isExporting}>
              {t('common.exportCsv')}
            </button>
          )
        }
      >
        <QueryStatus
          query={clientsQuery}
          loadingText={t('clients.loading')}
          errorFallback={t('clients.loadError')}
          isEmpty={clients.length === 0}
          emptyText={t('clients.empty')}
        >
          <ClientTable clients={clients} />
        </QueryStatus>
        {meta && (
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
        )}
      </Card>
    </Page>
  )
}
