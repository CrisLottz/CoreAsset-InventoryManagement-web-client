import { useState, useRef } from 'react';
import { apiClient } from '../../services/apiClient';

interface CsvImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CsvImportModal = ({ isOpen, onClose, onSuccess }: CsvImportModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const TARGET_FIELDS = [
        { key: 'first_name', label: 'First Name (Required)' },
        { key: 'last_name', label: 'Last Name (Required)' },
        { key: 'job_title', label: 'Job Title (Required)' },
        { key: 'employee_number', label: 'Employee Number' },
        { key: 'email', label: 'Email Address' },
    ];

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.name.endsWith('.csv')) {
                setError("Please select a valid CSV file.");
                return;
            }
            setFile(selectedFile);
            setError(null);
            
            // Basic client-side header extraction
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                if (text) {
                    const firstLine = text.split('\n')[0];
                    if (firstLine) {
                        // Split by comma, clean quotes, and filter out empty columns (which happen when exporting empty Excel columns)
                        const cols = firstLine.split(',')
                            .map(c => c.trim().replace(/^"|"$/g, ''))
                            .filter(c => c.length > 0);
                        
                        // Deduplicate headers just in case there are identical headers
                        const uniqueCols = Array.from(new Set(cols));
                        
                        setHeaders(uniqueCols);
                        
                        // Auto-guess mapping based on exact match or lowercase match
                        const autoMapping: Record<string, string> = {};
                        uniqueCols.forEach(col => {
                            const lcCol = col.toLowerCase().replace(/[^a-z_]/g, '');
                            if (lcCol.includes('first')) autoMapping[col] = 'first_name';
                            else if (lcCol.includes('last')) autoMapping[col] = 'last_name';
                            else if (lcCol.includes('job') || lcCol.includes('title')) autoMapping[col] = 'job_title';
                            else if (lcCol.includes('email')) autoMapping[col] = 'email';
                            else if (lcCol.includes('number') || lcCol.includes('id')) autoMapping[col] = 'employee_number';
                        });
                        setMapping(autoMapping);
                    }
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    const handleMapChange = (csvHeader: string, targetField: string) => {
        setMapping(prev => ({
            ...prev,
            [csvHeader]: targetField
        }));
    };

    const handleSubmit = async () => {
        if (!file) return;
        setIsLoading(true);
        setError(null);

        // Filter out empty mappings and invert logic so we send: {"CSV Header": "TargetField"}
        const finalMapping: Record<string, string> = {};
        Object.entries(mapping).forEach(([csvHeader, target]) => {
            if (target) {
                finalMapping[csvHeader] = target;
            }
        });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('mapping', JSON.stringify(finalMapping));

        try {
            const response = await apiClient.post('/employees/import-csv/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.status === 207) {
                // Partial success
                setSuccessMsg(`Imported ${response.data.created} employees. Some rows had errors and were skipped.`);
            } else {
                setSuccessMsg(`Successfully imported ${response.data.created} employees.`);
            }
            
            // Allow user to read success message before closing automatically
            setTimeout(() => {
                onSuccess();
            }, 3000);
            
        } catch (err: any) {
            setError(err.response?.data?.error || "An error occurred during import.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetModal = () => {
        setStep(1);
        setFile(null);
        setHeaders([]);
        setMapping({});
        setError(null);
        setSuccessMsg(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={resetModal} aria-hidden="true"></div>
            
            <div 
                className="relative bg-white dark:bg-surface-elevated rounded-lg shadow-xl w-full max-w-2xl flex flex-col"
                role="dialog"
                aria-modal="true"
                aria-labelledby="csv-modal-title"
            >
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 id="csv-modal-title" className="text-xl font-bold tracking-tight leading-tight text-gray-900 dark:text-white">
                        Bulk Import Employees (CSV)
                    </h2>
                    <button 
                        onClick={resetModal}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-1 transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div aria-live="assertive" className="sr-only">
                    {error ? `Error: ${error}` : ''}
                    {successMsg ? `Success: ${successMsg}` : ''}
                </div>

                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {error && (
                        <div className="mb-4 p-4 bg-semantic-error/10 text-semantic-error rounded-md flex items-center gap-2">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-4 p-4 bg-semantic-success/10 text-semantic-success rounded-md flex items-center gap-2">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium">{successMsg}</span>
                        </div>
                    )}

                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="mt-4 flex justify-center text-sm leading-6 text-gray-600 dark:text-gray-400">
                                    <label htmlFor="csv-upload" className="relative cursor-pointer rounded-md bg-transparent font-bold text-primary-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-600 focus-within:ring-offset-2 hover:text-primary-500">
                                        <span>Upload a file</span>
                                        <input id="csv-upload" name="csv-upload" type="file" accept=".csv" className="sr-only" ref={fileInputRef} onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs leading-5 text-gray-500 mt-2">CSV files only, up to 10MB</p>
                            </div>
                            
                            {file && (
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-base rounded-md border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{file.name}</p>
                                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setFile(null)} className="text-sm font-medium text-semantic-error hover:text-red-700 focus:outline-none focus:underline">Remove</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                We found <strong className="text-gray-900 dark:text-white">{headers.length}</strong> columns in your file. 
                                Match them to the required system fields below. Leave unneeded columns as "Ignore".
                            </p>
                            
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">CSV Column Header</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Maps to System Field</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-surface-elevated divide-y divide-gray-200 dark:divide-gray-700">
                                        {headers.map((header, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {header}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <select
                                                        value={mapping[header] || ''}
                                                        onChange={(e) => handleMapChange(header, e.target.value)}
                                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-surface-base text-gray-900 dark:text-white"
                                                        aria-label={`Map column ${header}`}
                                                    >
                                                        <option value="">-- Ignore Column --</option>
                                                        {TARGET_FIELDS.map(field => (
                                                            <option key={field.key} value={field.key}>{field.label}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-base flex justify-end gap-3 mt-auto">
                    <button
                        type="button"
                        onClick={resetModal}
                        disabled={isLoading}
                        className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-surface-elevated border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    {step === 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            disabled={!file}
                            className="px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                        >
                            Next: Map Columns
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            {isLoading && (
                                <svg className="w-5 h-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            Import Data
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
