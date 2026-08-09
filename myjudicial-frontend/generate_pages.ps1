$clientPages = @(
    "ai-plan", "ai-saved", "lawyers", "book", "booking-requests", "consultations", "join", 
    "scope", "projects", "orders", "legal-matter", "payments", "lawyer", "documents", 
    "purchases", "billing", "notifications", "compliance", "verify", "profile", "password", "support", "docs"
)

$expertPages = @(
    "getting-started", "guide", "messages", "verify", "services", "upload", "availability", 
    "ai-case", "ai-contract", "ai-scope", "ai-research", "consultations", "quotations", "join", "meetings"
)

$template = @"
import { Info } from "lucide-react";

export default function PAGE_NAME() {
  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 shrink-0">
        <h1 className="text-[22px] font-bold text-brand-dark capitalize">PAGE_TITLE</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your PAGE_TITLE_LOWER
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-brand-border bg-white shadow-sm">
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/30">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100/80 shadow-sm">
            <Info size={28} className="text-slate-400" />
          </div>
          <h2 className="text-[16px] font-bold text-brand-dark mb-2">No records found</h2>
          <p className="text-[13px] text-slate-500 max-w-sm">
            There is currently no data to display for this section. Your records will appear here once available.
          </p>
        </div>
      </div>
    </div>
  );
}
"@

function Create-Page($dir, $pageName) {
    $fullDir = "d:\Dowloads\myjudicial-frontend\src\app\(portal)\$dir\$pageName"
    if (!(Test-Path $fullDir)) {
        New-Item -ItemType Directory -Force -Path $fullDir | Out-Null
    }
    
    # Format name (e.g. "ai-plan" -> "AiPlanPage", "AI Plan")
    $title = ($pageName -split '-' | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) }) -join ' '
    $componentName = ($pageName -split '-' | ForEach-Object { $_.Substring(0,1).ToUpper() + $_.Substring(1) }) -join ''
    $componentName = $componentName + "Page"
    
    $content = $template.Replace("PAGE_NAME", $componentName).Replace("PAGE_TITLE_LOWER", $title.ToLower()).Replace("PAGE_TITLE", $title)
    
    # Don't overwrite if it exists and has content
    $filePath = "$fullDir\page.tsx"
    if (!(Test-Path $filePath)) {
        Set-Content -Path $filePath -Value $content -Encoding UTF8
    }
}

foreach ($page in $clientPages) {
    if ($page -eq "lawyers") { continue } # lawyers is typically at root, not dashboard
    Create-Page "dashboard" $page
}

foreach ($page in $expertPages) {
    Create-Page "expert\dashboard" $page
}

Write-Output "Done creating pages"
