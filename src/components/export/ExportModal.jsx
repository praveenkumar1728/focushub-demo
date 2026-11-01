import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { exportService } from '../../services/exportService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FileText, FileSpreadsheet, FileCode, File, CheckCircle2 } from 'lucide-react';

export function ExportModal({
  isOpen,
  onClose,
  moduleName,
  allData = [],
  filteredData = [],
}) {
  const { currentUser } = useAuth();
  const toast = useToast();

  const [format, setFormat] = useState('pdf');
  const [scope, setScope] = useState('filtered'); // 'all' or 'filtered'
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      await exportService.exportData({
        moduleName,
        format,
        isFiltered: scope === 'filtered',
        filteredData,
        allData,
        user: currentUser,
      });
      toast.success(`${moduleName} exported as ${format.toUpperCase()}`);
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export report.');
    } finally {
      setLoading(false);
    }
  };

  const formats = [
    {
      id: 'pdf',
      name: 'PDF Document',
      ext: '.pdf',
      desc: 'Styled table report with branded banner',
      icon: FileText,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
    },
    {
      id: 'xlsx',
      name: 'Excel Workbook',
      ext: '.xlsx',
      desc: 'Spreadsheet with auto-width columns',
      icon: FileSpreadsheet,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'csv',
      name: 'CSV File',
      ext: '.csv',
      desc: 'Standard comma-delimited raw file',
      icon: FileCode,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800',
    },
    {
      id: 'docx',
      name: 'Word Document',
      ext: '.docx',
      desc: 'Editable Microsoft Word table document',
      icon: File,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Export ${moduleName} Records`}
      subtitle="Select file format and dataset scope"
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            loading={loading}
          >
            Download {format.toUpperCase()}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Scope selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Export Scope
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setScope('filtered')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                scope === 'filtered'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Current Filtered
                </span>
                {scope === 'filtered' && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {filteredData.length} records matching filters
              </span>
            </button>

            <button
              type="button"
              onClick={() => setScope('all')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                scope === 'all'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  All Records
                </span>
                {scope === 'all' && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {allData.length} total records
              </span>
            </button>
          </div>
        </div>

        {/* Format Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            File Format
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {formats.map((f) => {
              const Icon = f.icon;
              const isSelected = format === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className={`p-2 rounded-lg border ${f.color} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {f.name}
                      </span>
                      <span className="text-2xs font-mono px-1 py-0.2 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-300">
                        {f.ext}
                      </span>
                    </div>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
