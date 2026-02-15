import { useEffect, useRef, useState } from 'react'
import { Eye } from 'lucide-react'
import { toast } from 'sonner'
import { fetchOrderDetail, fetchOrders, transitionOrderStatus } from '@/api'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusTimeline } from '@/components/shared/StatusTimeline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { fetchUserProfile } from '@/services/api/usersApi'
import { extractErrorMessage } from '@/services/api/client'

const orderStatusOptions = [
  'draft',
  'pending',
  'pending_payment',
  'paid',
  'processing',
  'confirm',
  'shiping',
  'shipped',
  'delivered',
  'cancel',
  'cancelled',
]

const statusTransitions = {
  draft: 'pending_payment',
  pending: 'confirm',
  pending_payment: 'paid',
  paid: 'processing',
  processing: 'shipped',
  confirm: 'shiping',
  shiping: 'delivered',
  shipped: 'delivered',
}

const timelineSteps = ['draft', 'pending_payment', 'paid', 'processing', 'shipped', 'delivered']
const legacyTimelineSteps = ['pending', 'confirm', 'shiping', 'delivered']
const defaultPagination = { currentPage: 1, lastPage: 1, perPage: 10, total: 0 }

function getCustomerId(row) {
  const safeRow = row && typeof row === 'object' ? row : {}
  return safeRow.user_id || safeRow.customer_id || safeRow.user?.id || safeRow.customer?.id || null
}

function getRoleNames(user) {
  const safeUser = user && typeof user === 'object' ? user : {}
  const sources = [safeUser.role, safeUser.roles, safeUser.role_names]
  return sources
    .flatMap((item) => (Array.isArray(item) ? item : [item]))
    .map((item) => (typeof item === 'string' ? item : item?.name || item?.label || item?.slug || null))
    .filter(Boolean)
    .map((item) => String(item).toLowerCase())
}

function isCustomerUser(user) {
  return getRoleNames(user).includes('customer')
}

function getCustomerName(row, customerNameMap = {}) {
  const safeRow = row && typeof row === 'object' ? row : {}
  const inlineName = safeRow.customer_name || safeRow.user_name || safeRow.customer?.name || safeRow.user?.name || null
  if (inlineName) return inlineName
  const customerId = getCustomerId(safeRow)
  return customerId ? customerNameMap[String(customerId)] || '-' : '-'
}

function statusVariant(status) {
  const map = {
    draft: 'outline',
    pending: 'secondary',
    pending_payment: 'secondary',
    paid: 'default',
    processing: 'outline',
    confirm: 'default',
    shiping: 'default',
    shipped: 'default',
    delivered: 'default',
    cancel: 'destructive',
    cancelled: 'destructive',
  }
  return map[String(status || '').toLowerCase()] || 'secondary'
}

export function OrdersManagementPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(defaultPagination)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [activeOrder, setActiveOrder] = useState(null)
  const [customerNameMap, setCustomerNameMap] = useState({})
  const latestLoadRef = useRef(0)

  const loadOrders = async ({ targetPage = page } = {}) => {
    const requestId = latestLoadRef.current + 1
    latestLoadRef.current = requestId

    try {
      setLoading(true)
      const result = await fetchOrders({
        page: targetPage,
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        date_from: startDate || undefined,
        date_to: endDate || undefined,
      })

      if (latestLoadRef.current !== requestId) return

      setRows(result.items)
      setPagination(result.meta)
      setPage(result.meta?.currentPage || targetPage)

      const unresolvedIds = [
        ...new Set(
          result.items
            .filter((row) => !getCustomerName(row))
            .map((row) => getCustomerId(row))
            .filter((id) => id && !customerNameMap[String(id)]),
        ),
      ]

      if (!unresolvedIds.length) return

      const resolved = await Promise.all(
        unresolvedIds.map(async (userId) => {
          try {
            const user = await fetchUserProfile(userId)
            if (!isCustomerUser(user)) return [String(userId), '-']
            return [String(userId), user?.name || user?.full_name || user?.username || '-']
          } catch {
            return [String(userId), '-']
          }
        }),
      )

      if (latestLoadRef.current !== requestId) return
      setCustomerNameMap((prev) => ({ ...prev, ...Object.fromEntries(resolved) }))
    } catch (error) {
      if (latestLoadRef.current !== requestId) return
      setRows([])
      toast.error(extractErrorMessage(error, 'Failed to load orders.'))
    } finally {
      if (latestLoadRef.current === requestId) setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadOrders({ targetPage: page }), 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, startDate, endDate])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, startDate, endDate])

  const columns = [
    { key: 'order_number', label: 'Order #' },
    { key: 'customer_name', label: 'Customer', render: (row) => getCustomerName(row, customerNameMap) },
    { key: 'created_at', label: 'Created', render: (row) => String(row.created_at || '-').slice(0, 10) },
    { key: 'total', label: 'Total', render: (row) => Number(row.total || 0).toLocaleString() },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={statusVariant(row.status)}>{row.status || 'pending'}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        const currentStatus = String(row.status || '').toLowerCase()
        const nextStatus = statusTransitions[currentStatus] || null

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const detail = await fetchOrderDetail(row.id)
                  setActiveOrder(detail)
                  setDetailOpen(true)
                } catch (error) {
                  toast.error(extractErrorMessage(error, 'Failed to load order detail.'))
                }
              }}
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              Detail
            </Button>
            {nextStatus ? (
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await transitionOrderStatus(row.id, { status: nextStatus })
                    toast.success(`Order moved to ${nextStatus}.`)
                    await loadOrders({ targetPage: page })
                  } catch (error) {
                    toast.error(extractErrorMessage(error, 'Failed to update order status.'))
                  }
                }}
              >
                Move to {nextStatus}
              </Button>
            ) : null}
          </div>
        )
      },
    },
  ]

  const activeStatus = String(activeOrder?.status || '').toLowerCase()
  const activeTimeline = legacyTimelineSteps.includes(activeStatus) ? legacyTimelineSteps : timelineSteps

  return (
    <div className="space-y-6">
      <PageHeader
        title="Order Management"
        description="Monitor order lifecycle, filter by status/date, and update transitions."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded-[calc(var(--radius)-2px)] border bg-background/75 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              {orderStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-40" />
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-40" />
          </div>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        search={search}
        onSearchChange={setSearch}
        sort={{ column: 'created_at', direction: 'desc' }}
        onSort={() => {}}
      />

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Detail</DialogTitle>
            <DialogDescription>Order detail, status timeline, and line items.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border bg-background/40 p-4">
              <h4 className="text-sm font-semibold">Status Timeline</h4>
              <StatusTimeline steps={activeTimeline} current={activeStatus || 'pending'} />
            </div>
            <div className="space-y-2 rounded-xl border bg-background/40 p-4 text-sm">
              <p>
                <strong>Order #:</strong> {activeOrder?.order_number || '-'}
              </p>
              <p>
                <strong>Customer:</strong> {getCustomerName(activeOrder, customerNameMap)}
              </p>
              <p>
                <strong>Total:</strong> {Number(activeOrder?.total || 0).toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> {activeOrder?.status || '-'}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
