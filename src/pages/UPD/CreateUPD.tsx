import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { AppLayout } from '../../components/Layout/AppLayout';
import { UPDItemsHierarchy } from '../../components/UPD/UPDItemsHierarchy';
import {
  getAvailableReceptionItems,
  getCounterparties,
  getSubdivisions,
  getReceptionsByCounterparty,
  createUpdAndLinkReceptionItems,
  AvailableReceptionItem,
} from '../../services/updService';

interface Counterparty {
  id: string;
  name: string;
  inn: string;
}

interface Subdivision {
  id: string;
  name: string;
  code: string;
}

interface Reception {
  id: string;
  reception_number: string;
  reception_date: string;
}

export default function CreateUPD() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [subdivisions, setSubdivisions] = useState<Subdivision[]>([]);
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [availableItems, setAvailableItems] = useState<AvailableReceptionItem[]>([]);

  const [selectedCounterpartyId, setSelectedCounterpartyId] = useState<string>('');
  const [selectedSubdivisionId, setSelectedSubdivisionId] = useState<string>('');
  const [selectedReceptionId, setSelectedReceptionId] = useState<string>('');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const [documentNumber, setDocumentNumber] = useState('');
  const [documentDate, setDocumentDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    loadCounterparties();
    loadSubdivisions();
  }, []);

  useEffect(() => {
    if (selectedCounterpartyId) {
      loadReceptions();
    } else {
      setReceptions([]);
      setSelectedReceptionId('');
      setAvailableItems([]);
      setSelectedItemIds(new Set());
    }
  }, [selectedCounterpartyId]);

  useEffect(() => {
    if (selectedCounterpartyId) {
      loadAvailableItems();
    } else {
      setAvailableItems([]);
      setSelectedItemIds(new Set());
    }
  }, [selectedCounterpartyId, selectedSubdivisionId, selectedReceptionId]);

  async function loadCounterparties() {
    try {
      const data = await getCounterparties();
      setCounterparties(data);
    } catch (err) {
      setError('Ошибка загрузки контрагентов');
      console.error(err);
    }
  }

  async function loadSubdivisions() {
    try {
      const data = await getSubdivisions();
      setSubdivisions(data);
    } catch (err) {
      setError('Ошибка загрузки подразделений');
      console.error(err);
    }
  }

  async function loadReceptions() {
    try {
      const data = await getReceptionsByCounterparty(selectedCounterpartyId);
      setReceptions(data);
    } catch (err) {
      setError('Ошибка загрузки приемок');
      console.error(err);
    }
  }

  async function loadAvailableItems() {
    setLoading(true);
    setError(null);
    try {
      const data = await getAvailableReceptionItems(
        selectedCounterpartyId,
        selectedSubdivisionId || undefined,
        selectedReceptionId || undefined
      );
      setAvailableItems(data);
      setSelectedItemIds(new Set());
    } catch (err) {
      setError('Ошибка загрузки доступных позиций');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function toggleItemSelection(itemId: string) {
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItemIds(newSelection);
  }

  function toggleMultipleItems(itemIds: string[]) {
    const newSelection = new Set(selectedItemIds);
    const allSelected = itemIds.every(id => newSelection.has(id));

    if (allSelected) {
      itemIds.forEach(id => newSelection.delete(id));
    } else {
      itemIds.forEach(id => newSelection.add(id));
    }

    setSelectedItemIds(newSelection);
  }

  function toggleSelectAll() {
    if (selectedItemIds.size === availableItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(availableItems.map((item) => item.id)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!documentNumber.trim()) {
      setError('Введите номер УПД');
      return;
    }

    if (selectedItemIds.size === 0) {
      setError('Выберите хотя бы одну позицию');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await createUpdAndLinkReceptionItems({ // <-- ИСПРАВЛЕНО: Вызываем новую функцию
        counterpartyId: selectedCounterpartyId,
        subdivisionId: selectedSubdivisionId || undefined,
        documentNumber,
        documentDate,
        itemIds: Array.from(selectedItemIds),
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/upd');
      }, 1500);
    } catch (err) {
      setError('Ошибка при создании УПД');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const isFormValid =
    selectedCounterpartyId &&
    documentNumber.trim() &&
    selectedItemIds.size > 0;

  return (
    <AppLayout
      title="Создание нового УПД"
      breadcrumbs={[
        { label: 'Сборка УПД', path: '/upd' },
        { label: 'Новый Заказ', path: '/upd/create' },
      ]}
    >
      <div className="space-y-6">
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess(false)}>
            УПД успешно создан! Перенаправление...
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Фильтры
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Контрагент *
              </label>
              <select
                value={selectedCounterpartyId}
                onChange={(e) => setSelectedCounterpartyId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Выберите контрагента</option>
                {counterparties.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.name} (ИНН: {cp.inn})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Приемки
              </label>
              <select
                value={selectedReceptionId}
                onChange={(e) => setSelectedReceptionId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedCounterpartyId}
              >
                <option value="">Все приемки</option>
                {receptions.map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    {rec.reception_number} ({new Date(rec.reception_date).toLocaleDateString('ru-RU')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Подразделение (опционально)
              </label>
              <select
                value={selectedSubdivisionId}
                onChange={(e) => setSelectedSubdivisionId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedCounterpartyId}
              >
                <option value="">Все подразделения</option>
                {subdivisions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedCounterpartyId && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Доступные позиции ({availableItems.length})
              </h2>

              {loading ? (
                <div className="text-center py-8 text-slate-600">
                  Загрузка позиций...
                </div>
              ) : (
                <UPDItemsHierarchy
                  items={availableItems}
                  selectedItemIds={selectedItemIds}
                  onToggleItem={toggleItemSelection}
                  onToggleAll={toggleSelectAll}
                  onToggleMultiple={toggleMultipleItems}
                />
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Данные документа
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <FileText className="inline w-4 h-4 mr-1" />
                    Номер УПД *
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Например: 00БП-000001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Дата УПД *
                  </label>
                  <input
                    type="date"
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/upd')}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || loading}
              >
                {loading ? 'Сохранение...' : 'Сохранить УПД'}
              </Button>
            </div>
          </>
        )}
        </form>
      </div>
    </AppLayout>
  );
}
