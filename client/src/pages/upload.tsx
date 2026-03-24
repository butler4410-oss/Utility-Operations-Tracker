import { MatrixLayout } from "@/components/matrix/matrix-layout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload as UploadIcon, FileUp, CheckCircle, AlertCircle } from "lucide-react";

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadResult(null);

    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000));

    setUploading(false);
    setUploadResult({
      type: 'success',
      message: `Successfully processed ${selectedFile.name}. Production Run #PR-${Date.now().toString().slice(-6)} created.`
    });
    setSelectedFile(null);
  };

  return (
    <MatrixLayout>
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Upload</h1>
          <p className="text-sm text-gray-600">Upload data files for processing</p>
        </div>

        <div className="max-w-2xl">
          <div className="bg-white border border-gray-200 rounded p-6 space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileUp className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-700 mb-2">Drop files here or click to browse</p>
              <p className="text-xs text-gray-500 mb-4">Supported formats: .dat, .csv, .txt, .xml</p>
              <Input
                type="file"
                onChange={handleFileChange}
                className="max-w-xs mx-auto"
                data-testid="input-file-upload"
                accept=".dat,.csv,.txt,.xml"
              />
            </div>

            {selectedFile && (
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-900">{selectedFile.name}</p>
                    <p className="text-xs text-blue-700">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-[#1e3a5f] hover:bg-[#2c5282]"
                    data-testid="button-upload"
                  >
                    {uploading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <UploadIcon className="h-4 w-4 mr-2" />
                        Upload & Process
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {uploadResult && (
              <div className={`border rounded p-4 ${uploadResult.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-start gap-3">
                  {uploadResult.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-brand-green mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-semibold ${uploadResult.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                      {uploadResult.type === 'success' ? 'Upload Successful' : 'Upload Failed'}
                    </p>
                    <p className={`text-sm ${uploadResult.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                      {uploadResult.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Upload Guidelines</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Files must be in standard municipal utility format</li>
                <li>• Maximum file size: 50MB</li>
                <li>• Files will be validated and processed automatically</li>
                <li>• You'll receive a confirmation with run details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MatrixLayout>
  );
}
