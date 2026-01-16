"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import { 
  ChevronDown, Users, Search, X, ZoomIn, ZoomOut, Move, GripVertical, Check,
  Minus, Plus, Maximize2, Download, Loader2, LayoutGrid, LayoutList, Map, Building2, Filter
} from "lucide-react";
import Link from "next/link";

interface Employee {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  position: { title: string } | null;
  department: { id?: string; name: string } | null;
  location: string | null;
  managerId: string | null;
  directReports: Employee[];
}

interface Department {
  id: string;
  name: string;
}

interface OrgChartProps {
  rootEmployees: Employee[];
  allEmployees: Employee[];
  departments?: Department[];
  canEdit: boolean;
}

// Single node card
function OrgNode({ 
  employee, 
  isHighlighted,
  canEdit,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragging,
  isDropTarget,
}: { 
  employee: Employee;
  isHighlighted: boolean;
  canEdit: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (targetId: string) => void;
  isDragging: boolean;
  isDropTarget: boolean;
}) {
  return (
    <div 
      className={`relative transition-all duration-200 ${isDragging ? 'opacity-40 scale-90' : ''} ${isDropTarget ? 'scale-105' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDrop(employee.id); }}
    >
      {/* Drop target indicator */}
      {isDropTarget && (
        <div className="absolute -inset-2 border-2 border-dashed border-blue-400 rounded-2xl bg-blue-50/50" />
      )}
      
      {/* Highlight pulse */}
      {isHighlighted && (
        <div className="absolute -inset-1 bg-amber-400/30 rounded-2xl animate-pulse" />
      )}
      
      {/* Card */}
      <div 
        className={`relative bg-white rounded-xl shadow-sm border transition-all duration-200 hover:shadow-lg group ${
          isHighlighted ? 'border-amber-400 shadow-amber-100' : 'border-slate-200 hover:border-slate-300'
        }`}
        style={{ width: '180px' }}
      >
        {/* Drag handle */}
        {canEdit && (
          <div 
            draggable
            onDragStart={() => onDragStart(employee.id)}
            onDragEnd={onDragEnd}
            className="absolute -left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        
        <div className="p-3 text-center">
          {/* Avatar */}
          <Link href={`/profile/${employee.id}`} className="inline-block">
            <UserAvatar 
              name={employee.fullName} 
              imageUrl={employee.avatarUrl} 
              className="h-12 w-12 mx-auto ring-2 ring-white shadow hover:ring-blue-100 transition-all"
            />
          </Link>
          
          {/* Name */}
          <Link 
            href={`/profile/${employee.id}`}
            className="block mt-2 font-semibold text-sm text-slate-800 hover:text-blue-600 transition-colors truncate"
          >
            {employee.fullName}
          </Link>
          
          {/* Position */}
          {employee.position && (
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {employee.position.title}
            </p>
          )}
          
          {/* Department badge */}
          {employee.department && (
            <div className="mt-2">
              <span className="inline-block px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full truncate max-w-full">
                {employee.department.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Recursive tree with centered layout and connectors - supports vertical and horizontal
function OrgTree({ 
  employee, 
  expandedNodes,
  onToggle,
  highlightedId,
  canEdit,
  draggedId,
  onDragStart,
  onDragEnd,
  onDrop,
  isRoot = false,
  layout = 'vertical',
}: { 
  employee: Employee;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  highlightedId: string | null;
  canEdit: boolean;
  draggedId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (targetId: string) => void;
  isRoot?: boolean;
  layout?: 'vertical' | 'horizontal';
}) {
  const isExpanded = expandedNodes.has(employee.id);
  const hasChildren = employee.directReports.length > 0;
  const isHighlighted = highlightedId === employee.id;
  const isDragging = draggedId === employee.id;
  const isDropTarget = draggedId !== null && draggedId !== employee.id;
  const isHorizontal = layout === 'horizontal';

  return (
    <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center`}>
      {/* Node */}
      <div className="relative">
        <OrgNode
          employee={employee}
          isHighlighted={isHighlighted}
          canEdit={canEdit}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDrop={onDrop}
          isDragging={isDragging}
          isDropTarget={isDropTarget}
        />
        
        {/* Toggle button */}
        {hasChildren && (
          <button
            onClick={() => onToggle(employee.id)}
            className={`absolute ${isHorizontal ? '-right-3 top-1/2 -translate-y-1/2' : '-bottom-3 left-1/2 -translate-x-1/2'} w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
              isExpanded 
                ? 'bg-slate-800 border-slate-800 text-white' 
                : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400'
            }`}
          >
            <span className="text-xs font-bold">
              {isExpanded ? '−' : employee.directReports.length}
            </span>
          </button>
        )}
      </div>
      
      {/* Connector line */}
      {hasChildren && isExpanded && (
        <div className={isHorizontal ? 'w-8 h-px bg-slate-300' : 'w-px h-8 bg-slate-300'} />
      )}
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Connector line for children */}
          {employee.directReports.length > 1 && (
            <div 
              className={`absolute ${isHorizontal ? 'w-px bg-slate-300' : 'h-px bg-slate-300'}`}
              style={isHorizontal ? {
                top: '50%',
                left: 0,
                height: `calc(100% - 60px)`,
                transform: 'translateY(-50%)',
              } : {
                left: '50%',
                width: `calc(100% - 180px)`,
                transform: 'translateX(-50%)',
              }}
            />
          )}
          
          {/* Children container */}
          <div className={`flex ${isHorizontal ? 'flex-col gap-3' : 'flex-row gap-6'}`}>
            {employee.directReports.map((child) => (
              <div key={child.id} className={`relative ${isHorizontal ? 'flex items-center' : ''}`}>
                {/* Connector from main line */}
                <div className={isHorizontal ? 'h-px w-8 bg-slate-300' : 'w-px h-8 bg-slate-300 mx-auto'} />
                
                <OrgTree
                  employee={child}
                  expandedNodes={expandedNodes}
                  onToggle={onToggle}
                  highlightedId={highlightedId}
                  canEdit={canEdit}
                  draggedId={draggedId}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onDrop={onDrop}
                  layout={layout}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrgChartPro({ rootEmployees, allEmployees, departments = [], canEdit }: OrgChartProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // State
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const set = new Set<string>();
    rootEmployees.forEach(emp => {
      set.add(emp.id);
      emp.directReports.forEach(sub => set.add(sub.id));
    });
    return set;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignData, setReassignData] = useState<{ employeeId: string; newManagerId: string } | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [layout, setLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [showMinimap, setShowMinimap] = useState(false);
  const [viewportPosition, setViewportPosition] = useState({ x: 0, y: 0 });
  const [showDeptFilter, setShowDeptFilter] = useState(false);

  // Filter tree by department - only show employees in the selected department
  // but keep the hierarchy path to them
  const filterByDepartment = (employees: Employee[], deptId: string): Employee[] => {
    if (!deptId) return employees;
    
    const filterRecursive = (emp: Employee): Employee | null => {
      const filteredReports = emp.directReports
        .map(r => filterRecursive(r))
        .filter((r): r is Employee => r !== null);
      
      const matchesDept = emp.department?.id === deptId;
      
      // Include if matches department or has matching descendants
      if (matchesDept || filteredReports.length > 0) {
        return {
          ...emp,
          directReports: filteredReports,
        };
      }
      
      return null;
    };
    
    return employees
      .map(emp => filterRecursive(emp))
      .filter((emp): emp is Employee => emp !== null);
  };

  const filteredRootEmployees = filterByDepartment(rootEmployees, departmentFilter);

  // Export to PNG
  const exportToPng = async () => {
    if (!chartRef.current) return;
    
    setIsExporting(true);
    try {
      // Temporarily reset zoom for clean export
      const currentZoom = zoom;
      setZoom(100);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      setZoom(currentZoom);
      
      const link = document.createElement('a');
      link.download = `org-chart-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Minimap scroll tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const { scrollLeft, scrollTop, scrollWidth, scrollHeight, clientWidth, clientHeight } = container;
      setViewportPosition({
        x: scrollWidth > clientWidth ? scrollLeft / (scrollWidth - clientWidth) : 0,
        y: scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0,
      });
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;
    
    const { scrollWidth, scrollHeight, clientWidth, clientHeight } = container;
    container.scrollTo({
      left: clickX * (scrollWidth - clientWidth),
      top: clickY * (scrollHeight - clientHeight),
      behavior: 'smooth',
    });
  };

  // Toggle
  const handleToggle = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Expand/collapse all
  const expandAll = useCallback(() => {
    const collectIds = (emps: Employee[]): string[] => 
      emps.flatMap(emp => [emp.id, ...collectIds(emp.directReports)]);
    setExpandedNodes(new Set(collectIds(rootEmployees)));
  }, [rootEmployees]);

  const collapseAll = useCallback(() => setExpandedNodes(new Set()), []);

  // Search
  const searchResults = searchQuery.trim() 
    ? allEmployees.filter(emp => 
        emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position?.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearchSelect = (id: string) => {
    setHighlightedId(id);
    setSearchQuery("");
    
    const findPath = (emps: Employee[], targetId: string, path: string[] = []): string[] | null => {
      for (const emp of emps) {
        if (emp.id === targetId) return [...path, emp.id];
        const found = findPath(emp.directReports, targetId, [...path, emp.id]);
        if (found) return found;
      }
      return null;
    };
    
    const path = findPath(rootEmployees, id);
    if (path) {
      setExpandedNodes(prev => {
        const next = new Set(prev);
        path.forEach(p => next.add(p));
        return next;
      });
    }

    setTimeout(() => setHighlightedId(null), 3000);
  };

  // Drag & drop
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragEnd = () => setDraggedId(null);

  const handleDrop = (targetId: string) => {
    if (draggedId && draggedId !== targetId) {
      setReassignData({ employeeId: draggedId, newManagerId: targetId });
      setShowReassignModal(true);
    }
    setDraggedId(null);
  };

  const confirmReassign = async () => {
    if (!reassignData) return;
    
    setIsReassigning(true);
    try {
      const res = await fetch(`/api/employees/${reassignData.employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: reassignData.newManagerId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setIsReassigning(false);
      setShowReassignModal(false);
      setReassignData(null);
    }
  };

  const getEmployeeName = (id: string) => 
    allEmployees.find(e => e.id === id)?.fullName || "Unknown";

  if (rootEmployees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">No Organization Structure</h3>
        <p className="text-slate-500 mt-1 text-sm">Add managers to build the org chart.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
          
          {searchResults.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-xl max-h-60 overflow-auto">
              {searchResults.slice(0, 8).map(emp => (
                <button
                  key={emp.id}
                  onClick={() => handleSearchSelect(emp.id)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 transition-colors text-left"
                >
                  <UserAvatar name={emp.fullName} imageUrl={emp.avatarUrl} className="h-7 w-7" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{emp.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{emp.position?.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* Zoom */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setZoom(Math.max(30, zoom - 10))}
            className="p-1.5 hover:bg-white rounded transition-colors disabled:opacity-50"
            disabled={zoom <= 30}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium w-10 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(Math.min(150, zoom + 10))}
            className="p-1.5 hover:bg-white rounded transition-colors disabled:opacity-50"
            disabled={zoom >= 150}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="p-1.5 hover:bg-white rounded transition-colors ml-1"
            title="Reset zoom"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* Department Filter */}
        {departments.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowDeptFilter(!showDeptFilter)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                departmentFilter 
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>{departmentFilter ? departments.find(d => d.id === departmentFilter)?.name : 'All Departments'}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDeptFilter ? 'rotate-180' : ''}`} />
            </button>
            
            {showDeptFilter && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDeptFilter(false)} />
                <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-white rounded-lg border border-slate-200 shadow-xl max-h-64 overflow-auto">
                  <button
                    onClick={() => { setDepartmentFilter(''); setShowDeptFilter(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors ${
                      !departmentFilter ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>All Departments</span>
                    {!departmentFilter && <Check className="h-4 w-4 ml-auto" />}
                  </button>
                  {departments.map(dept => (
                    <button
                      key={dept.id}
                      onClick={() => { setDepartmentFilter(dept.id); setShowDeptFilter(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors ${
                        departmentFilter === dept.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                      }`}
                    >
                      <Building2 className="h-4 w-4" />
                      <span className="truncate">{dept.name}</span>
                      {departmentFilter === dept.id && <Check className="h-4 w-4 ml-auto flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Expand/Collapse */}
        <button onClick={expandAll} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          Expand All
        </button>
        <button onClick={collapseAll} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          Collapse All
        </button>

        {canEdit && (
          <>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
              <Move className="h-3.5 w-3.5" />
              <span>Drag to reassign</span>
            </div>
          </>
        )}

        <div className="h-6 w-px bg-slate-200" />
        
        {/* Layout Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setLayout('vertical')}
            className={`p-1.5 rounded transition-colors ${layout === 'vertical' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
            title="Vertical Layout"
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            onClick={() => setLayout('horizontal')}
            className={`p-1.5 rounded transition-colors ${layout === 'horizontal' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
            title="Horizontal Layout"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
        
        {/* Minimap Toggle */}
        <button
          onClick={() => setShowMinimap(!showMinimap)}
          className={`p-1.5 rounded-lg transition-colors ${showMinimap ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
          title="Toggle Minimap"
        >
          <Map className="h-4 w-4" />
        </button>
        
        {/* Export PNG */}
        <button
          onClick={exportToPng}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-lg transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          <span>{isExporting ? 'Exporting...' : 'Export PNG'}</span>
        </button>
      </div>

      {/* Chart */}
      <div 
        ref={containerRef}
        className="overflow-auto bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-200 p-8"
        style={{ maxHeight: '70vh', minHeight: '400px' }}
      >
        <div 
          ref={chartRef}
          className="inline-flex flex-col items-center min-w-full transition-transform duration-200 origin-top"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          {/* Multiple root employees */}
          {filteredRootEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Filter className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No employees in this department</p>
              <p className="text-sm text-slate-400 mt-1">Try selecting a different department</p>
            </div>
          ) : filteredRootEmployees.length === 1 ? (
            <OrgTree
              employee={filteredRootEmployees[0]}
              expandedNodes={expandedNodes}
              onToggle={handleToggle}
              highlightedId={highlightedId}
              canEdit={canEdit}
              draggedId={draggedId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              isRoot
              layout={layout}
            />
          ) : (
            <div className={`flex ${layout === 'horizontal' ? 'flex-col' : 'flex-row'} gap-8`}>
              {filteredRootEmployees.map(emp => (
                <OrgTree
                  key={emp.id}
                  employee={emp}
                  expandedNodes={expandedNodes}
                  onToggle={handleToggle}
                  highlightedId={highlightedId}
                  canEdit={canEdit}
                  draggedId={draggedId}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                  layout={layout}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Minimap Overlay */}
      {showMinimap && (
        <div className="absolute bottom-4 right-4 z-40">
          <div 
            onClick={handleMinimapClick}
            className="w-48 h-32 bg-white/95 backdrop-blur rounded-lg shadow-lg border border-slate-200 overflow-hidden cursor-crosshair relative"
          >
            {/* Mini tree representation */}
            <div className="absolute inset-2 flex items-center justify-center">
              <div className="text-xs text-slate-400 flex flex-col items-center">
                <div className="w-3 h-3 rounded bg-blue-400 mb-1" />
                <div className="flex gap-1">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-px h-2 bg-slate-300" />
                      <div className="w-2 h-2 rounded bg-slate-300" />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px]">Click to navigate</p>
              </div>
            </div>
            
            {/* Viewport indicator */}
            <div 
              className="absolute bg-blue-500/20 border-2 border-blue-500 rounded transition-all duration-100"
              style={{
                width: '40%',
                height: '40%',
                left: `${Math.min(60, viewportPosition.x * 60)}%`,
                top: `${Math.min(60, viewportPosition.y * 60)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showReassignModal && reassignData && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 text-center mb-6">Change Manager</h2>
              
              <div className="flex items-center justify-center gap-6 py-4">
                <div className="text-center">
                  <UserAvatar name={getEmployeeName(reassignData.employeeId)} className="h-14 w-14 mx-auto" />
                  <p className="text-sm font-medium text-slate-900 mt-2">{getEmployeeName(reassignData.employeeId)}</p>
                </div>
                
                <div className="text-2xl text-slate-300">→</div>
                
                <div className="text-center">
                  <UserAvatar name={getEmployeeName(reassignData.newManagerId)} className="h-14 w-14 mx-auto ring-2 ring-blue-100" />
                  <p className="text-sm font-medium text-slate-900 mt-2">{getEmployeeName(reassignData.newManagerId)}</p>
                  <p className="text-xs text-blue-600">New Manager</p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setShowReassignModal(false); setReassignData(null); }}
                  disabled={isReassigning}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={confirmReassign} disabled={isReassigning}>
                  {isReassigning ? "Saving..." : "Confirm"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
