import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { CollapsibleHeader, formatCurrency, TransactionBadge } from './HierarchyShared'

type DisplayMode = 'view' | 'edit' | 'selection'

interface BaseItem {
  id: string
  itemName?: string
  item_description?: string
  quantity: number
  price: number
  totalAmount?: number
}

interface ItemRowProps {
  item: BaseItem
  mode: DisplayMode
  isSelected?: boolean
  onToggle?: () => void
  onQuantityChange?: (newQuantity: number) => void
  onSelectMotor?: () => void
}

export const UnifiedItemRow: React.FC<ItemRowProps> = ({
  item,
  mode,
  isSelected = false,
  onToggle,
  onQuantityChange,
  onSelectMotor,
}) => {
  const displayName = item.item_description || item.itemName || ''
  const totalAmount = item.totalAmount ?? (item.price * item.quantity)

  return (
    <div className="flex items-start py-1.5 hover:bg-slate-50 rounded transition-colors">
      {mode === 'selection' && onToggle && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-slate-400 text-blue-600 mr-4 mt-1 flex-shrink-0 focus:ring-blue-500"
        />
      )}

      <div className="flex-grow min-w-0">
        <p className="text-sm text-slate-800">{displayName}</p>
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
          <span>Кол-во: {item.quantity}</span>
          <span>Цена: {formatCurrency(item.price)}</span>
          <span className="font-medium text-slate-600">
            Сумма: {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {mode === 'edit' && onQuantityChange && (
        <div className="flex items-center gap-1 ml-4 flex-shrink-0">
          <button
            onClick={() => item.quantity > 1 && onQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="w-6 h-6 flex items-center justify-center rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-sm">−</span>
          </button>
          <button
            onClick={() => onQuantityChange(item.quantity + 1)}
            className="w-6 h-6 flex items-center justify-center rounded border border-slate-300 hover:bg-slate-100"
          >
            <span className="text-sm">+</span>
          </button>
        </div>
      )}
    </div>
  )
}

interface TransactionGroupProps {
  type: 'income' | 'expense' | 'Доходы' | 'Расходы' | 'Приход'
  items: BaseItem[]
  mode: DisplayMode
  selectedItemIds?: Set<string>
  onToggleItem?: (itemId: string) => void
  onQuantityChange?: (itemId: string, newQuantity: number) => void
  onSelectMotor?: (itemId: string) => void
}

export const UnifiedTransactionGroup: React.FC<TransactionGroupProps> = ({
  type,
  items,
  mode,
  selectedItemIds = new Set(),
  onToggleItem,
  onQuantityChange,
  onSelectMotor,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  if (items.length === 0) return null

  const isIncome = type === 'income' || type === 'Доходы' || type === 'Приход'
  const displayType = typeof type === 'string' && (type === 'Доходы' || type === 'Расходы' || type === 'Приход')
    ? type
    : isIncome ? 'Доходы' : 'Расходы'

  const totalAmount = items.reduce((sum, item) => {
    const itemTotal = item.totalAmount ?? (item.price * item.quantity)
    return sum + itemTotal
  }, 0)

  return (
    <div>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center cursor-pointer py-1 group hover:bg-slate-50 rounded px-2"
      >
        <div className="text-slate-400 group-hover:text-slate-800">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        <TransactionBadge type={type} className="text-sm font-medium ml-1 flex-grow">
          {displayType}
        </TransactionBadge>
        <span className={`text-sm font-semibold ml-2 ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
          {formatCurrency(totalAmount)}
        </span>
        {items.length > 0 && (
          <span className="text-sm text-slate-500 ml-2">({items.length})</span>
        )}
      </div>
      {isExpanded && (
        <div className="mt-1 pl-4 border-l-2 border-slate-200">
          {items.map((item) => (
            <UnifiedItemRow
              key={item.id}
              item={item}
              mode={mode}
              isSelected={selectedItemIds.has(item.id)}
              onToggle={onToggleItem ? () => onToggleItem(item.id) : undefined}
              onQuantityChange={onQuantityChange ? (qty) => onQuantityChange(item.id, qty) : undefined}
              onSelectMotor={onSelectMotor ? () => onSelectMotor(item.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface PositionGroupProps {
  baseItemName: string
  incomeItems: BaseItem[]
  expenseItems: BaseItem[]
  mode: DisplayMode
  selectedItemIds?: Set<string>
  onToggleItem?: (itemId: string) => void
  onQuantityChange?: (itemId: string, newQuantity: number) => void
  onSelectMotor?: (itemId: string) => void
}

export const UnifiedPositionGroup: React.FC<PositionGroupProps> = ({
  baseItemName,
  incomeItems,
  expenseItems,
  mode,
  selectedItemIds,
  onToggleItem,
  onQuantityChange,
  onSelectMotor,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const totalIncome = incomeItems.reduce((sum, item) => sum + (item.totalAmount ?? item.price * item.quantity), 0)
  const totalExpense = expenseItems.reduce((sum, item) => sum + (item.totalAmount ?? item.price * item.quantity), 0)
  const totalProfit = totalIncome - totalExpense
  const itemCount = incomeItems.length + expenseItems.length

  return (
    <div>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center cursor-pointer py-1.5 group hover:bg-slate-50 rounded px-2"
      >
        <div className="text-slate-500 group-hover:text-slate-900">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
        <h4 className="text-sm text-slate-800 ml-2 flex-grow min-w-0">
          {baseItemName}
        </h4>
        <div className="flex items-center space-x-3 text-xs ml-auto flex-shrink-0">
          <div className="flex items-center space-x-1">
            <span className="text-slate-600 font-medium">Д:</span>
            <span className="text-green-700 font-semibold">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-600 font-medium">Р:</span>
            <span className="text-red-700 font-semibold">{formatCurrency(totalExpense)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-slate-600 font-medium">П:</span>
            <span className="text-blue-700 font-bold">{formatCurrency(totalProfit)}</span>
          </div>
        </div>
        <span className="text-sm text-slate-500 ml-2">({itemCount})</span>
      </div>
      {isExpanded && (
        <div className="space-y-1 mt-1 pl-6">
          <UnifiedTransactionGroup
            type="Доходы"
            items={incomeItems}
            mode={mode}
            selectedItemIds={selectedItemIds}
            onToggleItem={onToggleItem}
            onQuantityChange={onQuantityChange}
            onSelectMotor={onSelectMotor}
          />
          <UnifiedTransactionGroup
            type="Расходы"
            items={expenseItems}
            mode={mode}
            selectedItemIds={selectedItemIds}
            onToggleItem={onToggleItem}
            onQuantityChange={onQuantityChange}
            onSelectMotor={onSelectMotor}
          />
        </div>
      )}
    </div>
  )
}

interface WorkGroupProps {
  workGroup: string
  positions: Array<{
    id: string
    baseItemName: string
    incomeItems: BaseItem[]
    expenseItems: BaseItem[]
  }>
  mode: DisplayMode
  selectedItemIds?: Set<string>
  onToggleItem?: (itemId: string) => void
  onQuantityChange?: (itemId: string, newQuantity: number) => void
  onSelectMotor?: (itemId: string) => void
}

export const UnifiedWorkGroup: React.FC<WorkGroupProps> = ({
  workGroup,
  positions,
  mode,
  selectedItemIds,
  onToggleItem,
  onQuantityChange,
  onSelectMotor,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const totalIncome = positions.reduce((sum, pos) => {
    return sum + pos.incomeItems.reduce((s, item) => s + (item.totalAmount ?? item.price * item.quantity), 0)
  }, 0)

  const totalExpense = positions.reduce((sum, pos) => {
    return sum + pos.expenseItems.reduce((s, item) => s + (item.totalAmount ?? item.price * item.quantity), 0)
  }, 0)

  const totalProfit = totalIncome - totalExpense
  const itemCount = positions.reduce((sum, pos) => sum + pos.incomeItems.length + pos.expenseItems.length, 0)

  return (
    <div className="py-2">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center cursor-pointer py-1.5 group hover:bg-blue-50 rounded px-2"
      >
        <div className="text-slate-500 group-hover:text-slate-900">
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
        <h3 className="text-base font-medium text-slate-800 ml-2 flex-grow min-w-0">
          {workGroup}
        </h3>
        <div className="flex items-center space-x-3 text-sm ml-auto flex-shrink-0">
          <div className="flex items-center space-x-1">
            <span className="text-xs text-slate-600 font-medium">Д:</span>
            <span className="text-green-700 font-semibold">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-slate-600 font-medium">Р:</span>
            <span className="text-red-700 font-semibold">{formatCurrency(totalExpense)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-slate-600 font-medium">П:</span>
            <span className="text-blue-700 font-bold">{formatCurrency(totalProfit)}</span>
          </div>
        </div>
        <span className="text-base text-slate-500 ml-2">({itemCount})</span>
      </div>
      {isExpanded && (
        <div className="space-y-2 mt-2 pl-4">
          {positions.map((pos) => (
            <UnifiedPositionGroup
              key={pos.id}
              baseItemName={pos.baseItemName}
              incomeItems={pos.incomeItems}
              expenseItems={pos.expenseItems}
              mode={mode}
              selectedItemIds={selectedItemIds}
              onToggleItem={onToggleItem}
              onQuantityChange={onQuantityChange}
              onSelectMotor={onSelectMotor}
            />
          ))}
        </div>
      )}
    </div>
  )
}
