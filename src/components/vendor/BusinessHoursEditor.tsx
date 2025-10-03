'use client';

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface BusinessHours {
  [key: string]: DayHours;
}

interface BusinessHoursEditorProps {
  businessHours: BusinessHours;
  onChange: (hours: BusinessHours) => void;
}

const daysOfWeek = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function BusinessHoursEditor({ businessHours, onChange }: BusinessHoursEditorProps) {
  // Initialize business hours with defaults if not set
  const getHours = (day: string): DayHours => {
    return (
      businessHours[day] || {
        isOpen: true,
        openTime: '09:00',
        closeTime: '18:00',
      }
    );
  };

  const handleToggle = (day: string, isOpen: boolean) => {
    onChange({
      ...businessHours,
      [day]: {
        ...getHours(day),
        isOpen,
      },
    });
  };

  const handleTimeChange = (day: string, field: 'openTime' | 'closeTime', value: string) => {
    onChange({
      ...businessHours,
      [day]: {
        ...getHours(day),
        [field]: value,
      },
    });
  };

  const handleCopyToAll = (sourceDay: string) => {
    const sourceHours = getHours(sourceDay);
    const newHours: BusinessHours = {};

    daysOfWeek.forEach((day) => {
      newHours[day.key] = { ...sourceHours };
    });

    onChange(newHours);
  };

  return (
    <div className="space-y-3">
      {daysOfWeek.map((day, index) => {
        const dayHours = getHours(day.key);

        return (
          <Card key={day.key} className="p-4">
            <div className="flex items-center gap-4">
              {/* Day Label */}
              <div className="w-32">
                <Label className="font-medium">{day.label}</Label>
              </div>

              {/* Open/Closed Toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={dayHours.isOpen}
                  onCheckedChange={(checked) => handleToggle(day.key, checked)}
                />
                <span className="text-sm text-gray-600">
                  {dayHours.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>

              {/* Time Inputs */}
              {dayHours.isOpen && (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-600">From:</Label>
                    <Input
                      type="time"
                      value={dayHours.openTime}
                      onChange={(e) => handleTimeChange(day.key, 'openTime', e.target.value)}
                      className="w-32"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-600">To:</Label>
                    <Input
                      type="time"
                      value={dayHours.closeTime}
                      onChange={(e) => handleTimeChange(day.key, 'closeTime', e.target.value)}
                      className="w-32"
                    />
                  </div>

                  {/* Copy to All Button */}
                  {index === 0 && (
                    <button
                      type="button"
                      onClick={() => handleCopyToAll(day.key)}
                      className="text-sm text-primary hover:underline ml-auto"
                    >
                      Copy to all days
                    </button>
                  )}
                </>
              )}
            </div>
          </Card>
        );
      })}

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-blue-900 font-medium mb-2">Business Hours Summary:</p>
        <div className="text-sm text-blue-800 space-y-1">
          {daysOfWeek.map((day) => {
            const hours = getHours(day.key);
            return (
              <div key={day.key} className="flex justify-between">
                <span className="font-medium">{day.label}:</span>
                <span>
                  {hours.isOpen
                    ? `${hours.openTime} - ${hours.closeTime}`
                    : 'Closed'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
