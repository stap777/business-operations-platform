import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { deliveryService, type DeliveryPersonResponse } from '../../../../services/deliveryService';

interface DeliveryAndNotesProps {
  selectedDeliveryPersonId: number | null;
  onSelectDeliveryPerson: (id: number | null) => void;
  notes: string;
  onChangeNotes: (notes: string) => void;
  deliveryInstructions: string;
  onChangeDeliveryInstructions: (instructions: string) => void;
}

export const DeliveryAndNotes: React.FC<DeliveryAndNotesProps> = ({
  selectedDeliveryPersonId,
  onSelectDeliveryPerson,
  notes,
  onChangeNotes,
  deliveryInstructions,
  onChangeDeliveryInstructions,
}) => {
  const { data: deliveryPeople = [], isLoading } = useQuery<DeliveryPersonResponse[]>({
    queryKey: ['users', 'delivery'],
    queryFn: () => deliveryService.getDeliveryPeople(),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
      {/* Assign Delivery Person Dropdown */}
      <div className="space-y-1.5">
        <label className="font-semibold text-[#111111] dark:text-[#FAFAFA] block">
          Assign Delivery <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal">(Optional)</span>
        </label>
        <select
          value={selectedDeliveryPersonId || ''}
          onChange={(e) => {
            const val = e.target.value;
            onSelectDeliveryPerson(val ? Number(val) : null);
          }}
          className="w-full p-2.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] transition-colors"
        >
          <option value="">Select delivery person...</option>
          {isLoading ? (
            <option value="" disabled>Loading delivery personnel...</option>
          ) : (
            deliveryPeople.map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName} ({person.phoneNumber})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="font-semibold text-[#111111] dark:text-[#FAFAFA] block">
          Notes <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal">(Optional)</span>
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder="Add order notes..."
          maxLength={200}
          className="w-full p-2.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] dark:placeholder-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] transition-colors"
        />
      </div>

      {/* Delivery Instructions */}
      <div className="space-y-1.5 md:col-span-2">
        <label className="font-semibold text-[#111111] dark:text-[#FAFAFA] block">
          Delivery Instructions <span className="text-[#71717A] dark:text-[#A1A1AA] font-normal">(Optional)</span>
        </label>
        <input
          type="text"
          value={deliveryInstructions}
          onChange={(e) => onChangeDeliveryInstructions(e.target.value)}
          placeholder="Specific gate instructions or landmarks..."
          maxLength={300}
          className="w-full p-2.5 rounded-xl border border-[#ECECEC] dark:border-[#232323] bg-white dark:bg-[#0F0F0F] text-[#111111] dark:text-[#FAFAFA] placeholder-[#71717A] dark:placeholder-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#FAFAFA] transition-colors"
        />
      </div>
    </div>
  );
};
