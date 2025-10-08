import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { AvailableReceptionItem } from '../../services/updService';
import { UnifiedWorkGroup } from '../common/UnifiedHierarchyComponents';
import { formatCurrency } from '../common/HierarchyShared';

interface PositionableItem extends AvailableReceptionItem {}

interface HierarchicalTopLevelGroup {
  id: string;
  positionNumber: number;
  mainInfo: {
    service_description: string;
    subdivision: string | null;
  };
  workGroups: Array<{
    id: string;
    workGroup: string;
    positions: Array<{
      id: string;
      baseItemName: string;
      incomeItems: PositionableItem[];
      expenseItems: PositionableItem[];
    }>;
  }>;
  itemCount: number;
  allItemIds: string[];
}

const getBaseItemName = (description: string): string => {
  return description;
};


const PositionCard: React.FC<{
  group: HierarchicalTopLevelGroup;
  selectedItemIds: Set<string>;
  onToggleItem: (itemId: string) => void;
  onTogglePosition: (itemIds: string[]) => void;
}> = ({ group, selectedItemIds, onToggleItem, onTogglePosition }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const selectedCount = useMemo(() => {
    return group.allItemIds.filter((id) => selectedItemIds.has(id)).length;
  }, [group.allItemIds, selectedItemIds]);

  const allSelected = selectedCount === group.allItemIds.length;
  const someSelected = selectedCount > 0 && selectedCount < group.allItemIds.length;

  const handleTogglePosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePosition(group.allItemIds);
  };

  const handleHeaderClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200">
      <div className="flex items-start p-4 hover:bg-slate-50 rounded-t-lg">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(input) => {
            if (input) input.indeterminate = someSelected;
          }}
          onChange={handleTogglePosition}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-slate-400 text-blue-600 mt-1.5 mr-3 flex-shrink-0 focus:ring-blue-500"
        />
        <span className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full text-sm font-bold flex-shrink-0 mt-1">
          {group.positionNumber}
        </span>
        <div
          onClick={handleHeaderClick}
          className="flex-grow min-w-0 ml-4 cursor-pointer"
        >
          <h2 className="text-base font-semibold text-slate-900">
            {group.mainInfo.service_description}
          </h2>
          {group.mainInfo.subdivision && (
            <p className="mt-1 text-sm text-slate-600">
              Подразделение: {group.mainInfo.subdivision}
            </p>
          )}
        </div>
        <div
          onClick={handleHeaderClick}
          className="flex items-center flex-shrink-0 ml-4 mt-1 cursor-pointer"
        >
          <div className="text-right mr-3">
            <span className="text-sm text-slate-600 font-medium">
              {selectedCount} / {group.itemCount} работ
            </span>
          </div>
          <div className="text-slate-500">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="pb-3 mt-1 px-4 pl-14">
          {group.workGroups.map((workGroup) => (
            <UnifiedWorkGroup
              key={workGroup.id}
              workGroup={workGroup.workGroup}
              positions={workGroup.positions}
              mode="selection"
              selectedItemIds={selectedItemIds}
              onToggleItem={onToggleItem}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---

export interface UPDItemsHierarchyProps {
  items: PositionableItem[];
  selectedItemIds: Set<string>;
  onToggleItem: (itemId: string) => void;
  onToggleAll: () => void;
  onToggleMultiple: (itemIds: string[]) => void;
}

export const UPDItemsHierarchy: React.FC<UPDItemsHierarchyProps> = ({
  items,
  selectedItemIds,
  onToggleItem,
  onToggleAll,
  onToggleMultiple,
}) => {
  const handleTogglePosition = (itemIds: string[]) => {
    onToggleMultiple(itemIds);
  };

  const hierarchicalData: HierarchicalTopLevelGroup[] = useMemo(() => {
    const positionMap = new Map<number, PositionableItem[]>();
    items.forEach((item) => {
      const key = item.position_number;
      if (!positionMap.has(key)) positionMap.set(key, []);
      positionMap.get(key)!.push(item);
    });

    const sortedPositions = Array.from(positionMap.entries()).sort((a, b) => a[0] - b[0]);

    return sortedPositions.map(([positionNumber, positionItems]) => {
      const firstItem = positionItems[0];
      const workGroupMap = new Map<string, PositionableItem[]>();
      positionItems.forEach((item) => {
        const workGroupName = item.work_group || 'Прочие работы';
        if (!workGroupMap.has(workGroupName)) workGroupMap.set(workGroupName, []);
        workGroupMap.get(workGroupName)!.push(item);
      });

      const workGroups = Array.from(workGroupMap.entries()).map(
        ([workGroupName, workItems]) => {
          const positionMap = new Map<string, PositionableItem[]>();
          workItems.forEach((item) => {
            const baseName = getBaseItemName(item.item_description);
            if (!positionMap.has(baseName)) positionMap.set(baseName, []);
            positionMap.get(baseName)!.push(item);
          });

          const positions = Array.from(positionMap.entries()).map(
            ([baseName, posItems]) => {
              const incomeItems = posItems.filter(item =>
                item.transaction_type === 'Приход' || item.transaction_type === 'Доходы'
              );
              const expenseItems = posItems.filter(item =>
                item.transaction_type !== 'Приход' && item.transaction_type !== 'Доходы'
              );

              return {
                id: baseName,
                baseItemName: baseName,
                incomeItems,
                expenseItems,
              };
            }
          );

          return {
            id: workGroupName,
            workGroup: workGroupName,
            positions,
          };
        }
      );

      return {
        id: positionNumber.toString(),
        positionNumber: positionNumber,
        mainInfo: {
          service_description: firstItem.motor_service_description,
          subdivision: firstItem.subdivision_name,
        },
        workGroups,
        itemCount: positionItems.length,
        allItemIds: positionItems.map(item => item.id),
      };
    });
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        Нет доступных позиций для выбранных фильтров
      </div>
    );
  }

  const allSelected = items.length > 0 && selectedItemIds.size === items.length;
  const someSelected = selectedItemIds.size > 0 && selectedItemIds.size < items.length;
  const totalSelectedAmount = items
    .filter((item) => selectedItemIds.has(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div>
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(input) => {
              if (input) input.indeterminate = someSelected;
            }}
            onChange={onToggleAll}
            className="rounded border-slate-400 text-blue-600 h-5 w-5 focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-slate-700">
            {selectedItemIds.size === 0
              ? 'Выбрать все'
              : `Выбрано: ${selectedItemIds.size} из ${items.length}`}
          </label>
        </div>
        {selectedItemIds.size > 0 && (
          <div className="text-right">
            <p className="text-sm text-slate-600">Сумма выбранных позиций:</p>
            <p className="text-lg font-bold text-slate-900">
              {formatCurrency(totalSelectedAmount)}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4 mt-4">
        {hierarchicalData.map((group) => (
          <PositionCard
            key={group.id}
            group={group}
            selectedItemIds={selectedItemIds}
            onToggleItem={onToggleItem}
            onTogglePosition={handleTogglePosition}
          />
        ))}
      </div>
    </div>
  );
};
