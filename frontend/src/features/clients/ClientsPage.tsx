import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError, messageFrom } from '../../shared/api/http'
import { Banner } from '../../shared/components/Banner'
import { Card } from '../../shared/components/Card'
import { Page } from '../../shared/components/Page'
import { Pagination } from '../../shared/components/Pagination'
import { QueryStatus } from '../../shared/components/QueryStatus'
import { downloadCsv } from '../../shared/utils/csv'
import { useAuth } from '../auth/AuthContext'
import { useAllUsers } from '../users/hooks'
import { ClientForm } from './components/ClientForm'
import { ClientTable } from './components/ClientTable'
import { emptyClientForm, toClientWriteDto, type ClientFormValues } from './clientForm'
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
  const [exportWarning, setExportWarning] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const clients = clientsQuery.data?.data ?? []
  const meta = clientsQuery.data?.meta
  const managers = managersQuery.data?.data ?? []

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    try {
      await createClient.mutateAsync(toClientWriteDto(form))
      setForm(emptyClientForm)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('clients.createError'))
    }
  }

  const exportClients = async () => {
    if (!token) return
    setIsExporting(true)
    setExportWarning(null)
    setExportError(null)
    try {
      const { rows, truncated, total } = await exportAllClients(token)
      downloadCsv(
        'clients.csv',
        rows.map((c) => ({
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
      if (truncated) {
        setExportWarning(t('common.exportTruncated', { count: rows.length, total }))
      }
    } catch (err) {
      setExportError(messageFrom(err, t('common.exportError')))
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
        {exportWarning && <Banner>{exportWarning}</Banner>}
        {exportError && <p className="form-error">{exportError}</p>}
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
