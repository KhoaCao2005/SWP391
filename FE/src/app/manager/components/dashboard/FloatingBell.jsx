import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import AlertsDropdown from './AlertsDropdown';

const FloatingBell = () => {
  const [open, setOpen] = useState(false);
  const alertCount = 8;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="relative p-3 bg-white shadow-lg border border-[#DEE2E6] rounded-full hover:shadow-xl transition-shadow"
          title="Notifications"
        >
          <Bell className="w-5 h-5 text-[#6C757D]" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#DC3545] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {alertCount}
            </span>
          )}
        </button>
        {open && (
          <div className="absolute right-0 bottom-14">
            <AlertsDropdown onClose={() => setOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingBell;


