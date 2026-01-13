// Management/src/components/workflows/ValidationResultsPanel.tsx
import type { ValidationResult } from '@/types/workflow';

interface ValidationResultsPanelProps {
    result: ValidationResult;
}

export default function ValidationResultsPanel({ result }: ValidationResultsPanelProps) {
    return (
        <div className="mb-6">
            <h2 className="text-xl font-bold mb-3">Validation Results</h2>

            {result.valid ? (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                    <div className="flex items-center">
                        <span className="font-semibold">✅ Workflow is valid!</span>
                    </div>
                    <p className="mt-1 text-sm">Your workflow passed all validation checks and is ready to run.</p>
                </div>
            ) : (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                    <div className="flex items-center text-red-800 mb-3">
                        <span className="font-semibold">❌ Validation failed ({result.errors.length} error{result.errors.length !== 1 ? 's' : ''})</span>
                    </div>

                    <div className="space-y-2">
                        {result.errors.map((error, index) => (
                            <div key={index} className="bg-white rounded p-3 border border-red-200">
                                <div className="flex items-start">
                                    <code className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-mono mr-3">
                                        {error.code}
                                    </code>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900">{error.message}</p>
                                        {(error.nodeId || error.edgeId) && (
                                            <div className="mt-1 text-xs text-gray-600">
                                                {error.nodeId && <span className="mr-3">Node: <code>{error.nodeId}</code></span>}
                                                {error.edgeId && <span>Edge: <code>{error.edgeId}</code></span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
