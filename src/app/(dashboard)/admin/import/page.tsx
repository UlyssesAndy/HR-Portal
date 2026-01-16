import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, FileSpreadsheet, CheckCircle, XCircle, 
  Clock, Download, AlertTriangle, FileUp, Database
} from "lucide-react";
import { CsvUploadForm } from "@/components/admin/csv-upload-form";

async function getImportHistory() {
  return db.csvImport.findMany({
    include: {
      uploadedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

const statusColors: Record<string, string> = {
  uploaded: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  dry_run: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  committed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusIcons: Record<string, React.ReactNode> = {
  uploaded: <Upload className="h-4 w-4" />,
  dry_run: <AlertTriangle className="h-4 w-4" />,
  committed: <CheckCircle className="h-4 w-4" />,
  failed: <XCircle className="h-4 w-4" />,
};

export default async function CsvImportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  const userRoles = session.user.roles || [];
  if (!userRoles.includes("HR") && !userRoles.includes("ADMIN")) {
    redirect("/");
  }

  const imports = await getImportHistory();
  const totalImported = imports.reduce((acc, i) => acc + (i.rowsImported || 0), 0);
  const successfulImports = imports.filter(i => i.status === "committed").length;

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-purple-500/20">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FileUp className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold">CSV Import</h1>
          </div>
          <p className="text-white/80 mb-6 max-w-lg">
            Bulk import or update employee data from spreadsheets
          </p>
          
          {/* Stats badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="font-semibold">{imports.length}</span>
              <span className="text-white/80 text-sm">Imports</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">{successfulImports}</span>
              <span className="text-white/80 text-sm">Successful</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Database className="h-4 w-4" />
              <span className="font-semibold">{totalImported}</span>
              <span className="text-white/80 text-sm">Records</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
            <FileSpreadsheet className="h-5 w-5" />
            Import Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-300 space-y-3">
          <p>Upload a CSV file with employee data. The file should include these columns:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <Badge variant="secondary">email *</Badge>
            <Badge variant="secondary">fullName *</Badge>
            <Badge variant="secondary">firstName</Badge>
            <Badge variant="secondary">lastName</Badge>
            <Badge variant="secondary">department</Badge>
            <Badge variant="secondary">position</Badge>
            <Badge variant="secondary">manager_email</Badge>
            <Badge variant="secondary">phone</Badge>
            <Badge variant="secondary">location</Badge>
            <Badge variant="secondary">startDate</Badge>
            <Badge variant="secondary">birthDate</Badge>
            <Badge variant="secondary">status</Badge>
          </div>
          <p className="text-sm">
            <strong>Note:</strong> Existing employees will be matched by email and updated.
            New emails will create new employee records.
          </p>
          <a 
            href="/api/csv/template" 
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Download className="h-4 w-4" />
            Download Template CSV
          </a>
        </CardContent>
      </Card>

      {/* Upload Form */}
      <CsvUploadForm />

      {/* Import History */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Clock className="h-5 w-5 text-slate-400" />
            Import History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {imports.map((imp) => (
              <div
                key={imp.id}
                className="flex items-center justify-between py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-6 px-6 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${statusColors[imp.status]}`}>
                    {statusIcons[imp.status]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{imp.filename}</h3>
                      <Badge className={statusColors[imp.status]}>
                        {imp.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Uploaded by {imp.uploadedBy.fullName} • {new Date(imp.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="text-right text-sm">
                  {imp.status === "committed" && (
                    <div className="space-y-1">
                      <div className="text-green-600 dark:text-green-400">{imp.rowsImported} imported</div>
                      <div className="text-blue-600 dark:text-blue-400">{imp.rowsUpdated} updated</div>
                      {imp.rowsSkipped && imp.rowsSkipped > 0 && (
                        <div className="text-amber-600 dark:text-amber-400">{imp.rowsSkipped} skipped</div>
                      )}
                    </div>
                  )}
                  {imp.status === "dry_run" && (
                    <div className="space-y-1">
                      <div className="text-green-600 dark:text-green-400">{imp.dryRunValidRows} valid</div>
                      {imp.dryRunErrorRows && imp.dryRunErrorRows > 0 && (
                        <div className="text-red-600 dark:text-red-400">{imp.dryRunErrorRows} errors</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {imports.length === 0 && (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                No imports yet. Upload your first CSV file!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
