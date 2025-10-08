import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../../components/Layout/AppLayout'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { getUpdDocuments, UPDDocumentWithCounterparty } from '../../services/updService'
import { CreditCard as Edit, FileText } from 'lucide-react'

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year} г.`
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
  }).format(amount)
}

export const UPDArchive: React.FC = () => {
  const navigate = useNavigate()
  const [updDocuments, setUpdDocuments] = useState<UPDDocumentWithCounterparty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUpdDocuments()
  }, [])

  const loadUpdDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUpdDocuments()
      setUpdDocuments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки УПД')
    } finally {
      setLoading(false)
    }
  }

  const handleView = (updId: string) => {
    navigate(`/app/upd-archive/${updId}`)
  }

  if (loading) {
    return (
      <AppLayout title="Архив УПД">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Загрузка...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Архив УПД">
      <div className="space-y-6">
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {updDocuments.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет сохраненных УПД</h3>
            <p className="text-gray-500 mb-6">
              Когда вы создадите УПД, они появятся здесь
            </p>
            <Button onClick={() => navigate('/app/upd-assembly')}>
              Создать УПД
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Номер УПД
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата УПД
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Контрагент
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Подразделение
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сумма доходов
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сумма расходов
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {updDocuments.map((upd) => (
                  <tr key={upd.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {upd.document_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(upd.document_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{upd.counterparties.name}</div>
                      {upd.counterparties.inn && (
                        <div className="text-xs text-gray-500">ИНН: {upd.counterparties.inn}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {upd.subdivisions?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(upd.total_income || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-red-600">
                        {formatCurrency(upd.total_expense || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          upd.status === 'Draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : upd.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {upd.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(upd.id)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Просмотр
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
