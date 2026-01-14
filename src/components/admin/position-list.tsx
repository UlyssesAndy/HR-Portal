"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, Building2, ChevronRight, Users } from "lucide-react";
import { PositionForm } from "./position-form";

interface Department {
  id: string;
  name: string;
}

interface Position {
  id: string;
  title: string;
  departmentId: string | null;
  isActive: boolean;
  department?: { id: string; name: string } | null;
  _count?: { employees: number };
}

interface PositionListProps {
  positions: Position[];
  departments: Department[];
}

export function PositionList({ positions, departments }: PositionListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editPosition, setEditPosition] = useState<Position | null>(null);

  // Group positions by department
  const positionsByDept = positions.reduce((acc, pos) => {
    const deptName = pos.department?.name || "Uncategorized";
    if (!acc[deptName]) acc[deptName] = [];
    acc[deptName].push(pos);
    return acc;
  }, {} as Record<string, Position[]>);

  const totalEmployees = positions.reduce(
    (acc, p) => acc + (p._count?.employees || 0),
    0
  );

  return (
    <>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Positions</p>
                <p className="text-2xl font-bold text-slate-900">{positions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Departments</p>
                <p className="text-2xl font-bold text-slate-900">{departments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Employees in Positions</p>
                <p className="text-2xl font-bold text-slate-900">{totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          Add Position
        </button>
      </div>

      {/* Positions by Department */}
      {Object.entries(positionsByDept).map(([deptName, deptPositions]) => (
        <Card key={deptName}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-400" />
              {deptName}
              <span className="ml-2 text-sm font-normal text-slate-400">
                {deptPositions.length} positions
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {deptPositions.map((position) => (
                <div
                  key={position.id}
                  onClick={() => setEditPosition(position)}
                  className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-6 px-6 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{position.title}</h3>
                        <Badge variant={position.isActive ? "success" : "secondary"}>
                          {position.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {position._count?.employees || 0}{" "}
                        {(position._count?.employees || 0) === 1 ? "employee" : "employees"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {positions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No positions found. Create your first position!
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      {(showForm || editPosition) && (
        <PositionForm
          position={editPosition}
          departments={departments}
          onClose={() => {
            setShowForm(false);
            setEditPosition(null);
          }}
        />
      )}
    </>
  );
}
