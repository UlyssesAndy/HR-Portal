"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import { EmployeeEditForm } from "./employee-edit-form";

interface EditButtonProps {
  employee: any;
  departments: any[];
  positions: any[];
  managers: any[];
  legalEntities: any[];
}

export function ProfileEditButton({ employee, departments, positions, managers, legalEntities }: EditButtonProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <EmployeeEditForm
        employee={{
          ...employee,
          startDate: employee.startDate?.toISOString() || null,
          birthDate: employee.birthDate?.toISOString() || null,
          statusStartDate: employee.statusStartDate?.toISOString() || null,
          statusEndDate: employee.statusEndDate?.toISOString() || null,
        }}
        departments={departments}
        positions={positions}
        managers={managers}
        legalEntities={legalEntities}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
    >
      <Edit className="h-4 w-4" />
      Edit Profile
    </button>
  );
}
