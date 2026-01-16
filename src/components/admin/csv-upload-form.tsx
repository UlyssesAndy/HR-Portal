"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, FileSpreadsheet, CheckCircle, XCircle, 
  Loader2, Play, AlertTriangle, ArrowRight, Sparkles,
  Link2, Wand2, ChevronDown, ChevronUp, Info
} from "lucide-react";

// Employee fields that can be mapped from CSV
interface EmployeeField {
  key: string;
  label: string;
  required?: boolean;
  aliases: string[];
}

const EMPLOYEE_FIELDS: EmployeeField[] = [
  { key: "email", label: "Email", required: true, aliases: ["email", "e-mail", "emailaddress", "email_address", "mail", "workEmail", "work_email", "corporateEmail"] },
  { key: "fullName", label: "Full Name", required: true, aliases: ["fullname", "full_name", "name", "displayname", "display_name", "employeename", "employee_name"] },
  { key: "firstName", label: "First Name", required: false, aliases: ["firstname", "first_name", "givenname", "given_name", "fname"] },
  { key: "lastName", label: "Last Name", required: false, aliases: ["lastname", "last_name", "surname", "familyname", "family_name", "lname"] },
  { key: "phone", label: "Phone", required: false, aliases: ["phone", "phonenumber", "phone_number", "telephone", "mobile", "cellphone", "cell", "workPhone", "work_phone"] },
  { key: "departmentName", label: "Department", required: false, aliases: ["department", "departmentname", "department_name", "dept", "team", "division", "unit"] },
  { key: "positionTitle", label: "Position/Title", required: false, aliases: ["position", "title", "positiontitle", "position_title", "jobtitle", "job_title", "role", "designation"] },
  { key: "managerEmail", label: "Manager Email", required: false, aliases: ["manageremail", "manager_email", "manager", "reportsto", "reports_to", "supervisoremail", "supervisor_email", "boss"] },
  { key: "location", label: "Location", required: false, aliases: ["location", "office", "officelocation", "office_location", "city", "worklocation", "work_location", "site"] },
  { key: "hireDate", label: "Hire Date", required: false, aliases: ["hiredate", "hire_date", "startdate", "start_date", "joiningdate", "joining_date", "dateofhire", "date_of_hire", "employmentdate"] },
  { key: "birthday", label: "Birthday", required: false, aliases: ["birthday", "birthdate", "birth_date", "dateofbirth", "date_of_birth", "dob"] },
  { key: "timezone", label: "Timezone", required: false, aliases: ["timezone", "time_zone", "tz"] },
  { key: "legalEntityName", label: "Legal Entity", required: false, aliases: ["legalentity", "legal_entity", "legalentityname", "legal_entity_name", "company", "employer", "organization", "org"] },
  { key: "status", label: "Status", required: false, aliases: ["status", "employmentstatus", "employment_status", "state", "employeestatus", "employee_status", "active"] },
  { key: "mattermostUsername", label: "Mattermost Username", required: false, aliases: ["mattermost", "mattermostusername", "mattermost_username", "mm", "mmuser", "mmhandle"] },
  { key: "telegramHandle", label: "Telegram Handle", required: false, aliases: ["telegram", "telegramhandle", "telegram_handle", "tg", "tghandle", "telegramuser"] },
];

interface FieldMapping {
  csvColumn: string;
  employeeField: string | null;
  confidence: "high" | "medium" | "low" | "manual";
  sampleValues: string[];
}

interface DryRunResult {
  validRows: number;
  errorRows: number;
  errors: Array<{ row: number; field: string; message: string }>;
  preview: Array<{ email: string; fullName: string; action: "create" | "update" }>;
}

export function CsvUploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvSamples, setCsvSamples] = useState<string[][]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [showAdvancedMapping, setShowAdvancedMapping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate auto-mapped vs manual fields
  const mappingStats = useMemo(() => {
    const mapped = fieldMappings.filter(m => m.employeeField);
    const autoMapped = mapped.filter(m => m.confidence !== "manual");
    const required = EMPLOYEE_FIELDS.filter(f => f.required);
    const requiredMapped = required.filter(r => mapped.some(m => m.employeeField === r.key));
    return {
      total: fieldMappings.length,
      mapped: mapped.length,
      autoMapped: autoMapped.length,
      requiredTotal: required.length,
      requiredMapped: requiredMapped.length,
    };
  }, [fieldMappings]);

  // Smart auto-mapping function
  const autoMapFields = (headers: string[], samples: string[][]): FieldMapping[] => {
    return headers.map((header, idx) => {
      const normalizedHeader = header.toLowerCase().replace(/[\s_-]/g, "").trim();
      const sampleValues = samples.map(row => row[idx] || "").filter(Boolean).slice(0, 3);
      
      // Try to find a matching field
      let bestMatch: { field: typeof EMPLOYEE_FIELDS[number] | null; confidence: "high" | "medium" | "low" } = {
        field: null,
        confidence: "low"
      };
      
      for (const field of EMPLOYEE_FIELDS) {
        // Exact match with field key
        if (normalizedHeader === field.key.toLowerCase()) {
          bestMatch = { field, confidence: "high" };
          break;
        }
        
        // Check aliases
        for (const alias of field.aliases) {
          if (normalizedHeader === alias.toLowerCase().replace(/[\s_-]/g, "")) {
            bestMatch = { field, confidence: "high" };
            break;
          }
        }
        
        if (bestMatch.confidence === "high") break;
        
        // Partial match - header contains field name or alias
        if (normalizedHeader.includes(field.key.toLowerCase()) ||
            field.aliases.some(a => normalizedHeader.includes(a.toLowerCase()))) {
          if (!bestMatch.field || bestMatch.confidence === "low") {
            bestMatch = { field, confidence: "medium" };
          }
        }
      }
      
      // Additional heuristics based on sample data
      if (!bestMatch.field && sampleValues.length > 0) {
        const sample = sampleValues[0];
        
        // Email detection
        if (sample.includes("@") && sample.includes(".")) {
          const emailField = EMPLOYEE_FIELDS.find(f => f.key === "email");
          if (emailField && !normalizedHeader.includes("manager")) {
            bestMatch = { field: emailField, confidence: "medium" };
          }
        }
        
        // Date detection (various formats)
        if (/^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}\.\d{2}\.\d{4}/.test(sample)) {
          if (normalizedHeader.includes("birth") || normalizedHeader.includes("dob")) {
            bestMatch = { field: EMPLOYEE_FIELDS.find(f => f.key === "birthday")!, confidence: "medium" };
          } else if (normalizedHeader.includes("hire") || normalizedHeader.includes("start") || normalizedHeader.includes("join")) {
            bestMatch = { field: EMPLOYEE_FIELDS.find(f => f.key === "hireDate")!, confidence: "medium" };
          }
        }
        
        // Phone detection
        if (/^[\d\s\+\-\(\)]{7,}$/.test(sample.replace(/\s/g, ""))) {
          const phoneField = EMPLOYEE_FIELDS.find(f => f.key === "phone");
          if (phoneField) {
            bestMatch = { field: phoneField, confidence: "low" };
          }
        }
      }
      
      return {
        csvColumn: header,
        employeeField: bestMatch.field?.key || null,
        confidence: bestMatch.field ? bestMatch.confidence : "low",
        sampleValues,
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setDryRunResult(null);
      setImportId(null);
      setError(null);
      
      // Parse CSV headers and first few rows for auto-mapping
      try {
        const text = await selectedFile.text();
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length < 1) {
          setError("CSV file appears to be empty");
          return;
        }
        
        // Parse headers
        const headers = parseCSVLine(lines[0]);
        setCsvHeaders(headers);
        
        // Parse sample rows (up to 5)
        const samples: string[][] = [];
        for (let i = 1; i < Math.min(6, lines.length); i++) {
          samples.push(parseCSVLine(lines[i]));
        }
        setCsvSamples(samples);
        
        // Auto-map fields
        const mappings = autoMapFields(headers, samples);
        setFieldMappings(mappings);
        
        // Move to mapping step
        setStep("mapping");
      } catch (err) {
        setError("Failed to parse CSV file");
      }
    }
  };

  // CSV line parser
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const updateMapping = (index: number, fieldKey: string | null) => {
    setFieldMappings(prev => prev.map((m, i) => 
      i === index ? { ...m, employeeField: fieldKey, confidence: "manual" as const } : m
    ));
  };

  const handleDryRun = async () => {
    if (!file) return;

    // Check required fields are mapped
    const requiredFields = EMPLOYEE_FIELDS.filter(f => f.required);
    const missingRequired = requiredFields.filter(
      rf => !fieldMappings.some(m => m.employeeField === rf.key)
    );
    
    if (missingRequired.length > 0) {
      setError(`Missing required field mappings: ${missingRequired.map(f => f.label).join(", ")}`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Send field mappings
      const mappingConfig = fieldMappings
        .filter(m => m.employeeField)
        .reduce((acc, m) => {
          acc[m.csvColumn] = m.employeeField!;
          return acc;
        }, {} as Record<string, string>);
      formData.append("mappings", JSON.stringify(mappingConfig));

      const response = await fetch("/api/csv/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setDryRunResult(data.dryRun);
      setImportId(data.importId);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommit = async () => {
    if (!importId) return;

    setIsCommitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/csv/commit/${importId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Commit failed");
      }

      router.refresh();
      setFile(null);
      setDryRunResult(null);
      setImportId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsCommitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setCsvHeaders([]);
    setCsvSamples([]);
    setFieldMappings([]);
    setStep("upload");
    setDryRunResult(null);
    setImportId(null);
    setError(null);
    setShowAdvancedMapping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getConfidenceBadge = (confidence: FieldMapping["confidence"]) => {
    switch (confidence) {
      case "high":
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Auto</Badge>;
      case "medium":
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Suggested</Badge>;
      case "manual":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Manual</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="dark:bg-slate-900/80 dark:border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-500" />
          Upload CSV File
        </CardTitle>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mt-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            step === "upload" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "text-slate-400"
          }`}>
            <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">1</span>
            Upload
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            step === "mapping" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "text-slate-400"
          }`}>
            <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">2</span>
            Map Fields
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            step === "preview" ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "text-slate-400"
          }`}>
            <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">3</span>
            Preview & Import
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: File Upload */}
        {step === "upload" && (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 dark:text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-xl file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300
                  hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
                  cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Step 2: Field Mapping */}
        {step === "mapping" && (
          <div className="space-y-4">
            {/* Auto-mapping summary */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                  <Wand2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Smart Field Mapping
                  </h4>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                    Auto-mapped <strong>{mappingStats.autoMapped}</strong> of {mappingStats.total} columns.
                    {mappingStats.requiredMapped < mappingStats.requiredTotal && (
                      <span className="text-amber-600 dark:text-amber-400 ml-2">
                        Missing {mappingStats.requiredTotal - mappingStats.requiredMapped} required field{mappingStats.requiredTotal - mappingStats.requiredMapped > 1 ? "s" : ""}.
                      </span>
                    )}
                    {mappingStats.requiredMapped === mappingStats.requiredTotal && (
                      <span className="text-emerald-600 dark:text-emerald-400 ml-2">
                        All required fields mapped!
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Required Fields Mapping */}
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                Required Fields
                <Badge variant="secondary" className="text-xs">Must be mapped</Badge>
              </h4>
              <div className="space-y-2">
                {(() => {
                  type MappingItem = { mapping: FieldMapping; idx: number; requiredField?: EmployeeField };
                  
                  const mappedRequired: MappingItem[] = fieldMappings
                    .map((mapping, idx) => ({ mapping, idx }))
                    .filter(({ mapping }) => {
                      const field = EMPLOYEE_FIELDS.find(f => f.key === mapping.employeeField);
                      return field?.required;
                    });
                  
                  const unmappedRequired: MappingItem[] = EMPLOYEE_FIELDS
                    .filter(f => f.required && !fieldMappings.some(m => m.employeeField === f.key))
                    .map(f => ({ 
                      mapping: { csvColumn: "", employeeField: null, confidence: "low" as const, sampleValues: [] }, 
                      idx: -1, 
                      requiredField: f 
                    }));
                  
                  return [...mappedRequired, ...unmappedRequired].map((item) => {
                    const { mapping, idx, requiredField } = item;
                    if (requiredField) {
                      // Show unmapped required field
                      return (
                        <div key={requiredField.key} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <div className="flex-1">
                            <span className="text-amber-800 dark:text-amber-200 font-medium">
                              {requiredField.label} <span className="text-red-500">*</span>
                            </span>
                            <p className="text-xs text-amber-600 dark:text-amber-400">Not mapped - select a CSV column</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-amber-400" />
                          <select
                            value=""
                            onChange={(e) => {
                              const colIdx = csvHeaders.indexOf(e.target.value);
                              if (colIdx >= 0) {
                                updateMapping(colIdx, requiredField.key);
                              }
                            }}
                            className="px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="">Select column...</option>
                            {csvHeaders.filter(h => !fieldMappings.find(m => m.csvColumn === h)?.employeeField).map(header => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 dark:text-white truncate">{mapping.csvColumn}</span>
                            {getConfidenceBadge(mapping.confidence)}
                          </div>
                          {mapping.sampleValues.length > 0 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              e.g. {mapping.sampleValues.slice(0, 2).join(", ")}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-emerald-500" />
                        <select
                          value={mapping.employeeField || ""}
                          onChange={(e) => updateMapping(idx, e.target.value || null)}
                          className="px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Skip this column</option>
                          {EMPLOYEE_FIELDS.map(field => (
                            <option key={field.key} value={field.key} disabled={fieldMappings.some(m => m.employeeField === field.key && m.csvColumn !== mapping.csvColumn)}>
                              {field.label} {field.required ? "*" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Toggle for other fields */}
            <button
              onClick={() => setShowAdvancedMapping(!showAdvancedMapping)}
              className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              {showAdvancedMapping ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showAdvancedMapping ? "Hide" : "Show"} optional fields ({fieldMappings.filter(m => !EMPLOYEE_FIELDS.find(f => f.key === m.employeeField)?.required).length} columns)
            </button>

            {/* Optional Fields Mapping */}
            {showAdvancedMapping && (
              <div className="space-y-2">
                {fieldMappings
                  .map((mapping, idx) => ({ mapping, idx }))
                  .filter(({ mapping }) => {
                    const field = EMPLOYEE_FIELDS.find(f => f.key === mapping.employeeField);
                    return !field?.required;
                  })
                  .map(({ mapping, idx }) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{mapping.csvColumn}</span>
                          {mapping.employeeField && getConfidenceBadge(mapping.confidence)}
                        </div>
                        {mapping.sampleValues.length > 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            e.g. {mapping.sampleValues.slice(0, 2).join(", ")}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <select
                        value={mapping.employeeField || ""}
                        onChange={(e) => updateMapping(idx, e.target.value || null)}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                      >
                        <option value="">Skip this column</option>
                        {EMPLOYEE_FIELDS.map(field => (
                          <option key={field.key} value={field.key} disabled={fieldMappings.some(m => m.employeeField === field.key && m.csvColumn !== mapping.csvColumn)}>
                            {field.label} {field.required ? "*" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDryRun}
                disabled={isUploading || mappingStats.requiredMapped < mappingStats.requiredTotal}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Preview Import
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Import */}
        {step === "preview" && dryRunResult && (
          <div className="space-y-4">
            {/* Mapping Summary */}
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Field Mapping Used</h4>
              <div className="flex flex-wrap gap-2">
                {fieldMappings.filter(m => m.employeeField).map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs border border-indigo-200 dark:border-indigo-700">
                    <span className="text-slate-500 dark:text-slate-400">{m.csvColumn}</span>
                    <ArrowRight className="h-3 w-3 text-indigo-500" />
                    <span className="font-medium text-indigo-700 dark:text-indigo-300">
                      {EMPLOYEE_FIELDS.find(f => f.key === m.employeeField)?.label}
                    </span>
                  </span>
                ))}
              </div>
            </div>
            
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">{dryRunResult.validRows} Valid Rows</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">{dryRunResult.errorRows} Errors</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span className="font-semibold">{dryRunResult.preview.length} Previewed</span>
                </div>
              </div>
            </div>

            {/* Errors */}
            {dryRunResult.errors.length > 0 && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Validation Errors</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {dryRunResult.errors.slice(0, 10).map((err, i) => (
                    <div key={i} className="text-sm text-red-700 dark:text-red-300">
                      Row {err.row}: <strong>{err.field}</strong> - {err.message}
                    </div>
                  ))}
                  {dryRunResult.errors.length > 10 && (
                    <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                      ...and {dryRunResult.errors.length - 10} more errors
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preview */}
            {dryRunResult.preview.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Preview (first 10 rows)</h4>
                <div className="space-y-2">
                  {dryRunResult.preview.slice(0, 10).map((row, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{row.email} - {row.fullName}</span>
                      <Badge variant={row.action === "create" ? "success" : "default"}>
                        {row.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep("mapping")}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Back to Mapping
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                {dryRunResult.validRows > 0 && (
                  <button
                    onClick={handleCommit}
                    disabled={isCommitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isCommitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Commit Import ({dryRunResult.validRows} rows)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
