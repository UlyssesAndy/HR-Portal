"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, ChevronRight, Edit } from "lucide-react";
import { DepartmentForm } from "./department-form";

interface Department {
  id: string;
  name: string;
  code: string | null;
  parentId: string | null;
  isActive: boolean;
  parent: { id: string; name: string } | null;
  _count: { employees: number; positions: number };
}

interface DepartmentListProps {
  departments: Department[];
}

export function DepartmentList({ departments }: DepartmentListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editDepartment, setEditDepartment] = useState<Department | null>(null);

  const handleEdit = (dept: Department) => {
    setEditDepartment(dept);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditDepartment(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Departments</CardTitle>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
          >
            <Plus className="h-4 w-4" />
            Add Department
          </button>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {departments.map((department) => (
              <div
                key={department.id}
                className="flex items-center justify-between py-4 hover:bg-slate-50 -mx-6 px-6 transition-colors group cursor-pointer"
                onClick={() => handleEdit(department)}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                    {department.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{department.name}</h3>
                      {department.code && (
                        <span className="text-xs text-slate-400">({department.code})</span>
                      )}
                      <Badge variant={department.isActive ? "success" : "secondary"}>
                        {department.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                      <span>{department._count.employees} employees</span>
                      <span>{department._count.positions} positions</span>
                      {department.parent && (
                        <span>Parent: {department.parent.name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(department);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            ))}
            
            {departments.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                No departments found. Create your first department!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <DepartmentForm
          department={editDepartment}
          departments={departments.map(d => ({ id: d.id, name: d.name }))}
          onClose={handleClose}
        />
      )}
    </>
  );
}
